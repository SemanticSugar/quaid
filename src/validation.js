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
$.ajaxOriginal = $.ajax;

/**
 * <p>Monkey patch for the jquery ajax function. It handles our json
 * conventions. It handles 500 errors. It makes you coffee. It entertains your
 * girlfriend so you can get some shit done.</p>
 *
 * <p>This patch is a thin layer that does some error handling and introduces a
 * new option to the options object:</p>
 *
 * <pre class="code">applicationError()</pre>
 *
 * <p>So when everything is good, the server will return json in the form:</p>
 *
 * <pre class="code">{ status: 'success', otherStuff: ... }</pre>
 *
 * <p>When there is an application error it will return something like:</p>
 *
 * <pre class="code">{
 *     status: 'fail',
 *     errors: [
 *         {value: 'hi@example.com', message: 'Email address in use', field: 'email_address'},
 *         {code: 64, message: 'Ads step is incomplete'}
 *     ]
 * }</pre>
 *
 * <p>In this case your options.applicationError(errortype, errors) callback will
 * be called. errortype will be 'applicationerror' and errors will be split into
 * general and field type errors:</p>
 *
 * <pre class="code">{
 *     general: [
 *         {code: 64, message: 'Ads step is incomplete'}
 *     ],
 *     field: [
 *         {value: 'hi@example.com', message: 'Email address in use', field: 'email_address'}
 *     ]
 * }</pre>
 *
 * <p>Field errors will be passed automatically through {@link Q.asyncErrors.add}
 * and will get shoved into your form if possible.</p>
 **/
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
            
            if(data.errors.length > 0)
                Q.asyncErrors.add(data.errors, options.form);
            
            options.applicationError.call(this, 'applicationerror', errors);
            
            var uh = Q.asyncErrors.getUnhandledErrors();
            if(uh && $.isFunction(Q.handleApplicationErrors))
                Q.handleApplicationErrors.call(this, uh);
        }
        
        //So success gets anything that is a 200. However, we may have application
        //errors coming in (data.status == 'fail'). So we will extract those
        //responses and call the error callback.
        var originalSuccess = options.success || function(){};
        function successHandler(data, status, xhr){
            
            //aborted request causes success to be called with empty data. Boo.
            if(!xhr.status) return;
            
            if(!data)
                $.warn('No data returned from the server! Request args:', options);
            
            Q.handleSuccess(data, options);
            
            // fail if they have a 'fail' in the status or they specify errors.
            if( data && (data.status == 'fail' || (data.errors && data.errors.length)))
                _handleAppErrors(data);
            // just pass through for success....
            else
                originalSuccess.call(this, data, status);
            
        }//end success handler
        options.success = successHandler;
        
        var originalError = options.error || function(){};
        function errorHandler(xhr, status, errorThrown){
            
            if(xhr.status >= 500){
                var handled = false;
                var data = null;
                try {
                    data = jQuery.httpData( xhr, options.dataType, options );
                } catch(err) {
                    $.warn('ERROR: Failed to parse error data from the server. Is your response in', options.dataType, '?', 'Error:', err);
                }
                
                options.applicationError.call(this, 'servererror', xhr.status);
                Q.handleServerError.call(this, data, xhr, status, errorThrown);
            }
            else if(xhr.status >= 400){
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

/**
 * Called on every 200 response.
 **/
Q.handleSuccess = function(data, options){
};

/**
 * Called on 500 errors. You'll probably want to override this for your own applications.
 */
Q.handleServerError = function(data, xhr, status, errorThrown){
    alert('Oops. An error occurred. Our team has been notified!');
};

/**
 * On any Application errors. When the server returns a 400, or a status: 'fail' from a
 * 200 request.
 **/
Q.handleApplicationErrors = function(errors){
    for(var i = 0; i < errors.length; i ++)
        $.warn('Unhandled async application error "', errors[i].message ,'" :', errors[i]);
    Q.asyncErrors.handle(errors);
};

/**
 * @namespace
 * 
 * <p>Allows us to push validation errors from the
 * server through the jquery validation framework. Here's how it works.</p>
 *
 * <p>You setup some validation rules:</p>
 *
 * <pre class="code">var rules = {
 *     rules: { something: 'required' },
 *     messages: { something: 'omg you need something' }
 * };
 * $('form#my-form').validate(rules);</pre>
 *
 * <p>$.fn.validate will call {@link Q.getValidationOptions} which will add the 'asyncError' validation method to your
 * rules. You can add these asyncError validation methods manually if you like:</p>
 *
 * <pre class="code">var rules = {
 *     rules: { something: {
 *         required: true,
 *         asyncError: false //can be true or false. false will disable it.
 *     }},
 *     messages: { something: 'omg you need something' }
 * };</pre>
 * 
 * <p>You make a post to some action on the server which will return some errors,
 * then Quaid's monkey-patched {@link $.ajax} function adds the errors to Q.asyncErrors. Q.asyncErrors
 * will display the errors just like regular client side errors.</p>
 *
 * <pre class="code">$.post('/myaction', {param: 'wow'}, function(data){
 *     if(data.status == 'fail')
 *         Q.asyncErrors(data.errors, $('form#my-form'));
 * }, 'json');</pre>
 *
 * <p>The data from above request failure should look something like:</p>
 *
 * <pre class="code">data = {
 *     status: 'fail',
 *     errors: [
 *         {field: 'name', value: '', message: 'Name is too short!'},
 *         {field: 'email', value: 'wow@ok', message: 'Email is not valid!'}
 *     ]
 * }</pre>
 **/
Q.asyncErrors = {
    
    fieldErrors: {},
    errors: [],
    
    /**
     * <p>Add a list of errors to this Q.asyncErrors. The form will be revalidated and your
     * errors will be pushed through the client side validation framework.</p>
     *
     * @param errors A list of error dictionaries. Should be in the format:
     * <pre class="code">[
     *     {field: 'name', value: '', message: 'Name is too short!'},
     *     {field: 'email', value: 'wow@ok', message: 'Email is not valid!'}
     * ]</pre>
     */
    add: function(errors, form){
      
        Q.asyncErrors.fieldErrors = {};
        if(errors)
            Q.asyncErrors.errors = Q.asyncErrors.errors.concat(errors);
        
        if(errors && $.fn.valid){
            //iterate through the fields, and save the errors in our special
            //little errors construct. This construct is what the validation
            //rule will read.
            for(var i = 0; i < errors.length; i++){
                if(! errors[i].field ) continue;
                
                var field;
                if(form)
                    field = form.find('[name="'+ errors[i].field +'"]');
                else
                    field = $('[name="'+ errors[i].field +'"]');
				if(field.length && field.is(":visible")){
					//Infer the form from the field. I hope like hell I am not
					//dumb enough to have fields from multiple forms coming back in
					//in this errors dict. 
					if(!form || form.length == 0)
						form = field.parents('form');
					
					//we save the old value so the rule knows what value caused the error.
					//if the value changes, then the field will be valid.
					Q.asyncErrors.fieldErrors[errors[i].field] = {
						message: errors[i].message,
						val: field.val(),
                        original: errors[i]
					};
				}
            }
            
            //force form validation so the framework will read our new errors.
            if(form){
                //there may be multiple forms we need to attend to...
                form.each(function(){
                    $(this).valid();
                });
            }
        }
    },
    
    handle: function(error){
        if(!error) return;
        if(!$.isArray(error))
            error = [error];
        for(var i = 0; i < error.length; i++)
            error[i]._handled = true;
    },

    /**
     * <p>Gets all the unhandled errors.</p>
     */
    getUnhandledErrors: function(){
        var unhandled = [];
        
        for(var i = 0; i < Q.asyncErrors.errors.length; i++)
            if(!Q.asyncErrors.errors[i]._handled)
                unhandled.push(Q.asyncErrors.errors[i]);
        
        return unhandled;
    },
    
    clear: function(){
        Q.asyncErrors.errors = [];
        Q.asyncErrors.fieldErrors = {};
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
            if(element.name in Q.asyncErrors.fieldErrors)
                err = Q.asyncErrors.fieldErrors[element.name].val || '';
            
            // if this element is connected to another, and it is the display element,
            // concat the connected element's current value and error value.
            if(params instanceof Object && params.connect && params.display){
                cur += $('[name="'+ params.connect +'"]').val();
                if(params.connect in Q.asyncErrors.fieldErrors)
                    err += Q.asyncErrors.fieldErrors[params.connect].val || '';
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
            fail = (element.name in Q.asyncErrors.fieldErrors && cur == err);
            
            return /*this.optional(element) || */ !fail;
        },
        
        //the message fn; extract the message we got from the server
        function(params, element){
            //'this' is the validator
            
            var error = Q.asyncErrors.fieldErrors[element.name];
            
            var message = error.message;
            
            Q.asyncErrors.handle(error.original);
            
            return message;
        }
    );
    
    /**
     * <p>Overall default validation options. You probably want to override this for, say,
     * your own error label placement.</p>
     */
    Q.defaultValidationOptions = {
        //insert your own defaults here!
    };
    
    /**
     * <p>Overrides {@link Q.defaultValidationOptions} with newopts, normalizes all your rules,
     * and adds 'asyncError' validation methods to all rules where it is not already specified.</p>
     *
     * <p>Called automatically by the new validate() function.</p>
     */
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
