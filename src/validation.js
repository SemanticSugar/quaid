/*
MIT License

Copyright (c) 2010, Ben Ogle, AdRoll (Semantic Sugar Inc.)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// no conflict.
;(function($){
//

var Q = $[$.QUAID];

/**
 *
 * $.ajax - Monkey patch for the jquery ajax function. It handles our json
 * conventions. It handles 500 errors. It makes you coffee. It entertains your
 * girlfriend so you can get some shit done.
 *
 * This patch is a thin layer that does some error handling and introduces a
 * new option to the options object:
 *
 * applicationError()
 *
 * So when everything is good, the server will return json in the form:
 *
 *   { status: 'success', otherStuff: ... }
 *
 * When there is an application error it will return something like:
 *
 *   {
 *     status: 'fail',
 *     errors: [
 *       {value: 'hi@example.com', message: 'Email address in use', field: 'email_address'},
 *       {code: 64, message: 'Ads step is incomplete'}
 *     ]
 *   }
 *
 * In this case your options.applicationError(errortype, errors) callback will
 * be called. errortype will be 'applicationerror' and errors will be split into
 * general and field type errors:
 *
 *   {
 *     general: [
 *       {code: 64, message: 'Ads step is incomplete'}
 *     ],
 *     field: [
 *       {value: 'hi@example.com', message: 'Email address in use', field: 'email_address'}
 *     ]
 *   }
 *
 * field errors will be passed automatically through Q.asyncErrors.add
 * and will get shoved into your form if possible.
 * 
 **/
$.ajaxOriginal = $.ajax;
$.ajax = function( options ) {

    //If json, we put our functions in the options dict for success and error.
    //also define a new callback in options called applicationError.
    if(options.dataType && options.dataType == 'json'){
    
        //options now accepts a new parameter: applicationError
    
        //errortype: 'servererror' - internal server error; errors -  http code (500, 501, etc.)
        //           'applicationerror' - means errors from our system; errors - {general: [], field: []}
        function defErrorCb(errortype, errors){};
        if( !$.isFunction(options.applicationError) )
            options.applicationError = defErrorCb;
        
        function _handleAppErrors(data){
            var errors = {
                general: [],
                field: []
            };
            
            //split the errors into the different types. Then the client
            //will have an easier time parsing through the errors.
            for(var i = 0; data.errors && i < data.errors.length; i++){
                if('field' in data.errors[i] && data.errors[i].field)
                    errors.field.push(data.errors[i]);
                else
                    errors.general.push(data.errors[i]);
            }
            
            if(errors.field.length > 0)
                Q.asyncErrors.add(errors.field);
            
            options.applicationError.call(this, 'applicationerror', errors);
        }
        
        //So success gets anything that is a 200. However, we may have application
        //errors coming in (data.status == 'fail'). So we will extract those
        //responses and call the error callback.
        var originalSuccess = options.success || function(){};
        function successHandler(data, status){
			
			if(data && !data.status && !data.errors){
				$.log('Hey, you need a "success" or "errors" param on the response data!');
			}
            
            // dump the data into the query analyzer.
            if(data.debug && Q.DEBUG){
                Q.DEBUG.addRequest(data.debug);
            }
			
            //just pass through for success....
            if( data && data.status == 'success' ){
                originalSuccess.call(this, data, status);
            }
            
            // failures are a bit more complicated. 
            else
                _handleAppErrors(data);
            
        }//end success handler
        options.success = successHandler;
        
        var originalError = options.error || function(){};
        function errorHandler(xhr, status, errorThrown){
            
            if(xhr.status >= 500){
                options.applicationError.call(this, 'servererror', xhr.status);
                Q.handleServerError.call(this, xhr, status, errorThrown);
            }
            else if(xhr.status >= 400){
                $.log('SERVER ERROR', this.url, '; http status:', xhr.status + ':' + status);
                try {
                    var data = jQuery.httpData( xhr, options.dataType, options );
                    _handleAppErrors(data);
                } catch(err) {
                    options.applicationError.call(this, 'parsererror', err);
                }
            }
            else{
                var original = '[Unknown]';
                try{ original = xhr.responseText || xhr.responseXML; }
                catch(err){}
                
                var error = '[Unknown Error]';
                if(errorThrown)
                    error = errorThrown.number + ': ' + errorThrown.description;
                
                $.log('$.ajax Error ', error, ', http status: ', xhr.status, ':', status, '; original', original);
            }
            
            originalError.call(this, xhr, status, errorThrown);
            
        }//end error handler
        options.error = errorHandler;
        
    }//end json monkey patchage
    
    return $.ajaxOriginal(options);
};

Q.handleServerError = function(){
    alert('Oops. An error occurred. Our team has been notified!');
};

/**
 * Async Error stuff. This code allows us to push validation errors from the
 * server through the jquery validation framework. Here's how it works:
 *
 * You setup some validation rules with Q.getValidationOptions:
 *
 * var rules = {
 *     rules: { something: 'required' },
 *     messages: { something: 'omg you need something' }
 * };
 * $('form#my-form').adrollValidate(rules);
 *
 * $.fn.adrollValidate will append the 'asyncError' rule to your
 * rules.
 *
 * You make a post to some action on the server which will return some errors,
 * then you send the errors to Q.asyncErrors. Q.asyncErrors
 * will display the errors just like regular client side errors. 
 *
 * $.post('/myaction', {param: 'wow'}, function(data){
 *     if(data.status == 'fail')
 *         Q.asyncErrors(data.errors, $('form#my-form'));
 * }, 'json');
 *
 * The data from above should look something like:
 *
 * data = {
 *     status: 'fail',
 *     errors: [
 *         {field: 'name', value: '', message: 'Name is too short!'},
 *         {field: 'email', value: 'wow@ok', message: 'Email is not valid!'}
 *     ]
 * }
 *
 **/

Q.asyncErrors = {
    
    errors: {},
    
    add: function(errors){
      
        Q.asyncErrors.clear();
        if(errors){
            
            var form = null;
            
            //iterate through the fields, and save the errors in our special
            //little errors construct. This construct is what the validation
            //rule will read.
            for(var i = 0; i < errors.length; i++){
                var field = $('[name="'+ errors[i].field +'"]:visible');
				if(field.length){
					//Infer the form from the field. I hope like hell I am not
					//dumb enough to have fields from multiple forms coming back in
					//in this errors dict. 
					if(!form || form.length == 0)
						form = field.parents('form');
					
					//we save the old value so the rule knows what value caused the error.
					//if the value changes, then the field will be valid.
					Q.asyncErrors.errors[errors[i].field] = {
						message: errors[i].message,
						val: field.val()
					};
				}
            }
            
            //force form validation so the framework will read our new errors.
            if(form){
                if($.fn.valid)
                    //there may be multiple forms we need to attend to...
                    form.each(function(){
                        $(this).valid();
                    });
            }
        }
        
    },

    clear: function(errors){
        Q.asyncErrors.errors = {};
    }

};


if($.validator && $.fn.validate){
    /**
     * New validation method. Works with Q.asyncErrors to display the
     * errors returned from the server through the validation framework.
     *
     * Allows for connection to a second field. Specified like this:
     *
     * rules:{
     *     field1: {asyncError: {connect: 'field2', display: true} },
     *     field1: {asyncError: {connect: 'field1', display: false} }
     * }
     *
     * The 'display: true|false' is important in this case. The error for field1
     * will be displayed. Field1's value will be assumed to be
     * field1.value()+field2.value(). When the value in field2 is changed it will
     * just trigger a check on field1's value. 
     **/
    $.validator.addMethod(
        "asyncError",
        
        //check fn
        function(value, element, params) {
            //'this' is the validator
            
            //if they specify asyncError: false, do nothing.
            if(!params) return true;
            
            //assemble the element's current value...
            var cur = $(element).val();
            
            //..and the value that caused the error.
            var err = '';
            if(element.name in Q.asyncErrors.errors)
                err = Q.asyncErrors.errors[element.name].val || '';
            
            // if this element is connected to another, and it is the display element,
            // concat the connected element's current value and error value.
            if(params instanceof Object && params.connect && params.display){
                cur += $('[name="'+ params.connect +'"]').val();
                if(params.connect in Q.asyncErrors.errors)
                    err += Q.asyncErrors.errors[params.connect].val || '';
            }
            
            //if it is connected, but not the display element, just trigger a check
            //on the main display element
            else if(params instanceof Object && params.connect && !params.display){
                this.check($('[name="'+ params.connect +'"]'));
                return true;
            }
            
            //basically: do we have an error for this element?
            //has the element's value NOT changed since we got the error?
            //if both true, fail.
            fail = (element.name in Q.asyncErrors.errors && cur == err);
            
            return /*this.optional(element) || */ !fail;
        },
        
        //the message fn; extract the message we got from the server
        function(params, element){
            //'this' is the validator
            
            var message = Q.asyncErrors.errors[element.name].message;
            
            return message;
        }
    );
    
    Q.defaultValidationOptions = {
        //insert your own defaults here!
    };
    
    Q.getValidationOptions = function(newopts){
        
        function normalizeRule(data) {
            if( typeof data == "string" ) {
                var transformed = {};
                $.each(data.split(/\s/), function() {
                    transformed[this] = true;
                });
                data = transformed;
            }
            return data;
        }
        
        var opts = $.extend({}, Q.defaultValidationOptions, newopts);
        
        if(opts.rules){
            //force asyncError rule into each and every field. 
            for(k in opts.rules){
                opts.rules[k] = normalizeRule(opts.rules[k]);
                
                if( !('asyncError' in opts.rules[k]) )
                    opts.rules[k].asyncError = true;
            }
        }
        
        //$.log(opts);
        return opts;
    };
    
    //monkey patch the validation plugin
    $.fn._oldValidate = $.fn.validate;
    $.fn.validate = function(options){
        var opts = Q.getValidationOptions(options);
        return $(this)._oldValidate(opts);
    };
}// end if validator
else{
    $.fn.validate = function(){
        var URL = 'http://bassistance.de/jquery-plugins/jquery-plugin-validation/';
        $.warn('You need to install jQuery validation plugin for validation to work! '+ URL);
    };
}

//end no conflict
})(jQuery);
//
