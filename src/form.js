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

Q.Textbox = Class.extend('Textbox', /** @lends Q.Textbox# */{
    
    /**
     * @class <p>Simple textbox class. Right now just provides a function to get the box's selection</p>
     *
     * @augments Q.Class
     * @param box the textbox
     * @param options your config
     * @constructs
     **/
    init: function(box, options){
        this._super(box, options, {});
        this.box = $(box);
    },
    
    /** <p>Pass through to jQuery's input.val() method</p> */
    val: function(value){
        return value ? this.box.val(value) : this.box.val();
    },
    
    /** <p>Gets the currently selected text in the box.</p> */
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

Q.IntBox = Q.Textbox.extend('IntBox', /** @lends Q.IntBox# */{
    /**
     *  @class <p>Int box. Only allows integers to be typed into the box.</p>
     *
     *  <pre class="code">
     *  $('input#my-textbox').IntBox();
     *  </pre>
     *
     *  @augments Q.Textbox
     *  @param box the textbox
     *  @param options your config
     *  @constructs
     **/
    init: function(box, options){
        
        var defs = {
            onFail: function(key){ return false; },
            maxDigits: 7
        };
        
        var settings = $.extend(true, {}, this.defaults, options);
        
        this._super(box, settings);
        
        
        (function(self){self.box.keypress(function (e){
            //check for max number of digits. But still let them type control chars,
            //and integers if they have selected something (resulting in an overwrite)
            if(self.val().length > settings.maxDigits-1 && !(e.which in Q.controlChars) && !self.getSelection())
                return false;
            
            //if the letter is not digit then display error and don't type anything
            if( (e.which!=8 && e.which!=0 && e.which!=13 && (e.which<48 || e.which>57)))
                return settings.onFail.call(self, e.which);
            
            return true;
        });})(this);
        
        return this;
    },
    
    /**
     * <p>Default options.</p>
     *
     * <pre class="code">
     * onFail: function(keyCode){ return false; },
     * maxDigits: 7
     * </pre>
     */
    defaults: {
        onFail: function(key){ return false; },
        maxDigits: 7
    }
});

Q.DecimalBox = Q.IntBox.extend('DecimalBox', /** @lends Q.DecimalBox# */{
    /**
     *  @class <p>Decimal box. Only allows real numbers to be typed into the box. Only one decimal
     *  and numbers can be type.</p>
     *
     *  <pre class="code">
     *  $('input#my-textbox').DecimalBox();
     *  </pre>
     *
     *  @augments Q.IntBox
     *  @param box the textbox
     *  @param options your config
     *  @constructs
     **/
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

Q.Form = Q.Module.extend('Form', /** @lends Q.Form */{
        //static members
        /**
         * <p>Default options.</p>
         * <pre class="code">
         * // enforces data types for form elements. use 'input_name':'type'
         * // supported types: int, decimal, + whatever you put in Q.Form.dataTypes
         * dataTypes: {
         *     //i.e
         *     //date_input: 'date'
         * },
         * validationOptions: {},
         * defaultData: {},
         * resetInitially: false,
         * onLoad: function(data){},
         * onSubmit: function(form){}
         * </pre>
         */
        defaults: {
            dataTypes: {},
            validationOptions: {},
            defaultData: {},
            resetInitially: false,
            
            submitters: null,
            disableSubmittersOnSubmit: true,
            disabledClass: 'disabled',
            
            onLoad: function(data){},
            onSubmit: function(form, formData){}
        },
        
        /**
         * Data types that can be specified for an element in the Q.Form class. These will setup the
         * element for the type specified. i.e. an int element will only allow the user to type integers.
         * A hypothetical date element would hookup a date picker, etc. Feel free to add your own.
         **/
        dataTypes: {
            'int': function(elem){
                elem.IntBox();
            },
            'decimal': function(elem){
                elem.DecimalBox();
            }
        }
    }, /** @lends Q.Form# */{
    /**
     * @class <p>Handles validation via validate plugin. Will load default data. Can force types on
     * elements with the dataType option. Also provides comvenience methods like
     * load() (from a dict), reset(), getElement etc.
     * </p>
     *
     * @augments Q.Class
     * @constructs
     **/
    init: function(container, options){
        var self = this;
        self._super(container, $.extend(true, {}, self._class.defaults, options));
        settings = self.settings;
        
        if(container.is('form'))
            self.form = container;
        else{
            self.form = container.find('form');
            if(!self.form.length){
                $.error('Cannot find form in', container, '!! You need a form. Fo\' Real!');
                return;
            }
        }
        
        self.form.submit(function(){
            return self._onSubmit(arguments);
        });
        
        settings.validationOptions.invalidHandler = function(){
            self._submittersEnable(true);
        };
        
        self.form.validate(settings.validationOptions);
        
        settings.submitters = $.getjQueryObject(settings.submitters);
        if(!settings.submitters)
            settings.submitters = self.form.find('input[type="submit"]');
        
        settings.submitters.click(function(e){
            var targ = $(this);
            if(targ.hasClass(settings.disabledClass)){
                e.stopPropagation();
                return false;
            }
            
            if(targ.is(':not(:submit)')){
                self.submit();
                return false;
            }
        });
        
        if(settings.resetInitially)
            this.reset();
        
        for(var k in settings.dataTypes){
            var elem = self.getElement(k);
            if(!elem.length)
                continue;
            
            self._setElementDataFilter(elem, settings.dataTypes[k]);
        }
    },
    
    /**
     * <p>Apply the data types filters. i.e. make some text boxen IntBoxes, or DecimalBoxes, etc.</p>
     * @private
     */
    _setElementDataFilter: function(elem, type){
        if($.isFunction(this._class.dataTypes[type])){
            this._class.dataTypes[type].call(this, elem);
        }
    },
    
    /**
     * <p>Set data in an element. Dont use this. use val()</p>
     * @private
     */
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
    
    /**
     * <p>The form's submit event hook. You can return false to </p>
     * @private
     */
    _onSubmit: function(){
        if(this.settings.disableSubmittersOnSubmit)
            this._submittersEnable(false);
        
        var formData = $.parseUrlParams(this.form.formSerialize());
        
        this.trigger('submit', this, this.form, formData, arguments);
        if($.isFunction(this.settings.onSubmit))
            return this.settings.onSubmit.call(this, this.form, formData, arguments);
        return true;
    },
    
    _submittersEnable: function(enable){
        var self = this;
        if(self.settings.submitters)
            self.settings.submitters.each(function(){
                var elem = $(this);
                
                if(elem.is('input') && !enable)
                    elem.attr('disabled', 'disabled');
                else if(elem.is('input') && enable)
                    elem.removeAttr('disabled');
                
                elem[enable ? 'removeClass' : 'addClass'](self.settings.disabledClass);
            });
    },
    
    /**
     * <p>Will return the HTML element with the name specified if possible.</p>
     * @returns an HTML element corresponding to the passed in name
     */
    getElement: function(name){
        return this.form.find('input[name="'+name+'"], textarea[name="'+name+'"], select[name="'+name+'"]');
    },
    
    /**
     * <p>Works like jQuery val() function. If the val parameter is not specified, val()
     * will return the value of the element corresponding to the passed in name. If val param
     * is specified, it will set the HTML element's value to val. This properly handles
     * radio buttons and checkboxen. Set radio buttons by specifying the desired radio's
     * value string. Set checkboxen with a bool.</p>
     *
     * @param name the name of the HTML element to value get/set
     * @param val (optional) the value to set. Will set if specified, will get if not.
     * @returns undefined if val specified, the value of the HTML element if not.
     */
    val: function(name, val){
        
        if(arguments.length == 0){
            //if nothing specified return an object with all values.
            var ret = {};
            var elems = this.form.find('input[type="hidden"], input:visible, textarea:visible, select:visible');
            
            for(var i = 0; i < elems.length; i++){
                var elem = elems.eq(i);
                var n = elem.attr('name');
                if(elem.attr('type') != 'submit' && n)
                    ret[n] = this.val(n);
            }
            return ret;
        }
        
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
    
    /**
     * <p>Set focus on the first text element in the form.</p>
     */
    focusFirst: function(){
        this.form.find('input[type="text"]:first, textarea:first').focus();
    },
    
    /**
     * <p>Will reset the form based on the settings.defaultData dict. If an element's name
     * is not in the dict, the value will be cleared/unchecked</p>
     */
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
     * <p>Loads data into the form. data is in the format:</p>
     * <pre class="code">{
     *   'element_name': 'value',
     *   'checkbox': true,
     *   ....
     * }</pre>
     *
     * @param data the data object to load into the form
     **/
    load: function(data){
        if($.isFunction(this.settings.onLoad)) this.settings.onLoad.call(this, data);
        
        for(var k in data){
            this.val(k, data[k]);
        }
    },
    
    /**
     * <p>Will hide the element which Q.Form was called on. </p>
     */
    hide: function(){
        this.container.hide();
    },
    
    /**
     * <p>Will show the element which Q.Form was called on. </p>
     */
    show: function(){
        this.container.show();
        this.focusFirst();
    },
    
    /**
     * <p>Will hide the submit the HTML form.</p>
     */
    submit: function(){
        this.form.submit();
    }
});

Q.AsyncForm = Q.Form.extend('AsyncForm', /** @lends Q.AsyncForm */{
        /**
         * <p>Default options. Extends {@link Q.Form} defaults.</p>
         * <pre class="code">
         * loaderLocation: {position: 'absolute', bottom: 5, left: 5}, //passed into Q.Loader
         * ajaxOptions: {dataType: 'json'}, //passed into $.ajax()
         * autoGenValidationOptions: false, //will auto generate validation rules for each element
         * validationOptions: {}, //passed into the validation plugin
         * onSuccess: function(data){},
         * onFail: function(err_type, errors){}
         * </pre>
         */
        defaults: {
            loaderLocation: {position: 'absolute', bottom: 5, left: 5},
            ajaxOptions: {dataType: 'json'},
            autoGenValidationOptions: false,
            validationOptions: {},
            onSuccess: function(data){},
            onFail: function(errorType, errors){}
        }
    },/** @lends Q.AsyncForm# */{
    /**
     * @class <p>
     * Extends Form to allow for async form submission.
     * Provides validation via the bassistance validate plugin.
     * Provides async form submission via malsup's form plugin.
     * Provides a loading image inside the form via this library's Q.Loader object.
     * </p>
     *
     * @augments Q.Form
     * @constructs
     **/
    init: function(container, settings){
        var self = this;
        settings = $.extend(true, {}, self._class.defaults, settings);
        
        if(settings.autoGenValidationOptions){
            var rules = settings.validationOptions.rules || {};
            var inputs = container.find('input, select, textarea');
            
            for(var i=0; i < inputs.length; i++)
                if(!(inputs[i].name in rules))
                    rules[inputs[i].name] = {required: false};
            settings.validationOptions.rules = rules;
        }
        
        //hook the async form submission to the validation plugin
        settings.validationOptions.submitHandler = function(validForm){
            self.loader.startLoading();
            
            settings.ajaxOptions.form = self.form;
            var opts = $.extend(settings.ajaxOptions, {
                success: function(data){
                    self._onSuccess.apply(self, arguments);
                    self.loader.stopLoading();
                },
                applicationError: function(){
                    self._onFail.apply(self, arguments);
                    self.loader.stopLoading();
                }
            });
            
            //actually submit the form
            self._validSubmit(opts);
        };
        
        self._super(container, settings);
        
        self.loader = self.form.Loader({location: self.settings.loaderLocation});
        self.loader.bind('loading', function(){
            self.trigger.apply(self, ['loading'].concat(Array.prototype.slice.call(arguments)));
        });
    },
    
    /**
     * This should submit the form with the given ajax options. Override as necessary
     */
    _validSubmit: function(ajaxOptions){
        this.form.ajaxSubmit(ajaxOptions);
    },
    
    _onSuccess: function(){
        var enable = true;
        
        this.trigger.apply(this, ['success', this].concat(Array.prototype.slice.call(arguments)));
        
        if($.isFunction(this.settings.onSuccess))
            enable = this.settings.onSuccess.apply(this, arguments) != false;
        
        if(enable && this.settings.disableSubmittersOnSubmit)
            this._submittersEnable(enable);
    },
    
    _onFail: function(){
        this.trigger.apply(this, ['fail', this].concat(Array.prototype.slice.call(arguments)));
        
        if($.isFunction(this.settings.onFail))
            this.settings.onFail.apply(this, arguments);
        this._submittersEnable(true);
    }
});

//end no conflict
})(jQuery);
//
