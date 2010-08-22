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
 * Simple textbox class. Right now just provides a function to get the box's selection
 **/
Q.Textbox = Class.extend('Textbox', {
    init: function(box, settings){
        this._super(box, settings, {});
        this.box = $(box);
    },
    
    val: function(value){
        return this.box.val(value);
    },
    
    getSelection: function(){
        
        var textComponent = this.box[0];
        var selectedText = '';
        
        if (document.selection != undefined)
        {
            textComponent.focus();
            var sel = document.selection.createRange();
            selectedText = sel.text;
        }
        // Mozilla version
        else if (textComponent.selectionStart != undefined)
        {
            var startPos = textComponent.selectionStart;
            var endPos = textComponent.selectionEnd;
            selectedText = textComponent.value.substring(startPos, endPos)
        }
        
        return selectedText;

    }
});

/**
 *  Int box. Only allows integers to be typed into the box.
 *
 *  $('input#my-textbox').IntBox();
 *  
 *  :param options: options
 *
 *  options = {
 *      onFail: function(keyCode){ return false; },
 *      maxDigits: 7
 *  };
 *  
 **/
Q.IntBox = Q.Textbox.extend('IntBox', {
    init: function(box, options){
        
        var defs = {
            onFail: function(key){ return false; },
            maxDigits: 7
        };
        
        var settings = $.extend({}, defs, options);
        
        this._super(box, settings);
        
        self = this;
        
        this.box.keypress(function (e){
            
            //check for max number of digits. But still let them type control chars,
            //and integers if they have selected something (resulting in an overwrite)
            if(self.val().length > settings.maxDigits-1 && !(e.which in Q.controlChars) && !self.getSelection())
                return false;
            
            //if the letter is not digit then display error and don't type anything
            if( (e.which!=8 && e.which!=0 && e.which!=13 && (e.which<48 || e.which>57)))
                return settings.onFail.call(self, e.which);
            
            return true;
        });
        
        return this;
    }
});

/**
 *  Decimal box. Only allows real numbers to be typed into the box. Only one decimal
 *  and numbers can be typed.
 *
 *  $('input#my-textbox').DecimalBox();
 *  
 *  :param options: options
 *  
 **/
Q.DecimalBox = Q.IntBox.extend('DecimalBox', {
    init: function(box, options){
        var defs = {};
        var settings = $.extend({}, defs, options);
        
        var self = this;
        
        settings.onFail = function(key){
            //returning false does not allow the key...
            
            if( key == 46 && self.val().length == 0) //they typed a decimal in the first position
                self.val('0');
            
            return key == 46 && self.val().indexOf('.') < 0; //if they typed a decimal and there isnt already one there.
            
        };
        
        this._super(box, settings);
    }
});

/**
 * Form class.
 *
 * - Handles validation connect via validate plugin.
 * - Will load default data.
 * - Can force types on elements with the dataType option
 *
 * - Provides comvenience methods like load() (from a dict), reset(), getElement etc.
 * 
 **/
Q.Form = Class.extend('Form', {
    init: function(container, settings){
        var self = this;
        var defs = {
            //enforces data types for form elements. use 'input_name':'type'
            // supported types: int, decimal, + whatever you put in Q.Form.dataTypes
            dataTypes: {        
                //i.e
                //date_input: 'date'
            },
            validationOptions: {},
            defaultData: {},
            resetInitially: false,
            
            onLoad: function(data){}
        };
        self._super(container, settings, defs);
        settings = self.settings;
        
        if(container.is('form'))
            self.form = container;
        else{
            self.form = container.find('form');
            if(!self.form.length){
                $.log('Cannot find form in', container, '!! You need a form. Fo\' Real!');
                return;
            }
        }
        
        self.form.validate(settings.validationOptions);
        
        if(settings.resetInitially)
            this.reset();
        
        for(var k in settings.dataTypes){
            var elem = self.getElement(k);
            if(!elem.length)
                continue;
            
            self._setElementDataFilter(elem, settings.dataTypes[k]);
        }
    },
    
    _setElementDataFilter: function(elem, type){
        if($.isFunction(Q.Form.dataTypes[type])){
            Q.Form.dataTypes[type].call(this, elem);
        }
    },
    
    //use val()
    _setData: function(elem, data){
        if(elem.attr('type') == 'radio'){
            elem.each(function(){
                if($(this).val() == data) $(this).attr('checked', 'checked');
            });
        }
        else if(elem.attr('type') == 'checkbox'){
            if(data) elem.attr('checked', 'checked');
            else elem.attr('checked', null);
        }
        else
            elem.val(data);
    },
    
    getElement: function(name){
        return this.form.find('input[name="'+name+'"], textarea[name="'+name+'"], select[name="'+name+'"]');
    },
    
    val: function(name, val){
        var elem = this.getElement(name);
        
        //set data?
        if(val != undefined){
            return this._setData(elem, val);
        }
        
        //get data
        if(elem.eq(0).attr('type') == 'radio'){
            return elem.filter(':checked').val();
        }
        else if(elem.attr('type') == 'checkbox'){
            return elem.is(':checked');
        }
        return elem.val();
    },
    
    focusFirst: function(){
        this.form.find('input[type="text"]:first, textarea:first').focus();
    },
    
    // Will reset the form based on the settings.defaultData dict.
    // If an element's name is not in the dict, the value will be cleared/unchecked
    reset: function(){
        var elems = this.form.find('input, textarea, select');
        var defs = this.settings.defaultData;
        
        for(var i = 0; i < elems.length; i++){
            var elem = elems.eq(i);
            var n = elem.attr('name');
            if(elem.attr('type') != 'submit'){
                var data = '';
                if(n in defs)
                    data = defs[n];
                this._setData(elem, data);
            }
        }
    },
    
    /**
     * Loads data into the form.
     * data is in the form
     * {
     *   'element_name': 'value',
     *   'checkbox': true,
     *   ....
     * }
     **/
    load: function(data){
        if($.isFunction(this.settings.onLoad)) this.settings.onLoad.call(this, data);
        
        for(var k in data){
            this.val(k, data[k]);
        }
    },
    
    hide: function(){
        this.container.hide();
    },
    
    show: function(){
        this.container.show();
        this.focusFirst();
    },
    
    submit: function(){
        this.form.submit();
    }
});

/**
 * Data types that can be specified for an element in the Q.Form class. These will setup the
 * element for the type specified. i.e. an int element will only allow the user to type integers.
 * A hypothetical date element would hookup a date picker, etc. Feel free to add your own.
 **/
Q.Form.dataTypes = {
    'int': function(elem){
        elem.IntBox();
    },
    'decimal': function(elem){
        elem.DecimalBox();
    }
};

/**
 * Q.AsyncForm Extends Form to allow for async form submission.
 *
 * Provides validation via the bassistance validate plugin.
 * Provides async form submission via malsup's form plugin.
 * Provides a loading image inside the form via this library's Loader object.
 **/
Q.AsyncForm =  Q.Form.extend('AsyncForm', {
    init: function(container, settings){
        var self = this;
        var defs = {
            loaderLocation: {position: 'absolute', bottom: 5, left: 5},
            ajaxOptions: {dataType: 'json'},
            validationOptions: {},
            onSuccess: function(data){},
            onFail: function(data){}
        };
        
        settings = $.extend({}, defs, settings);
        settings.validationOptions.submitHandler = function(validForm){
            self.loader.startLoading();
            var opts = $.extend(settings.ajaxOptions, {
                success: function(data){
                    if($.isFunction(settings.onSuccess)) settings.onSuccess.call(self, data);
                    self.loader.stopLoading();
                },
                applicationError: function(){
                    if($.isFunction(settings.onFail)) settings.onFail.apply(self, arguments);
                    self.loader.stopLoading();
                }
            });
            self.form.ajaxSubmit(opts);
        };
        
        self._super(container, settings);
        
        self.loader = self.form.Loader({location: self.settings.loaderLocation});
    }
});

//end no conflict
})(jQuery);
//
