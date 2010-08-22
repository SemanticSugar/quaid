/*
MIT License

Copyright (c) 2010, Ben Ogle, AdRoll (Semantic Sugar Inc.), John Resig 

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

;(function($){

/*!
 * Inheritance from John Resig.
 * http://ejohn.org/blog/simple-javascript-inheritance
 * Inspired by base2 and Prototype
 * MIT license
 */

var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

$.CLASS_NAMESPACE = 'class';
$.QUAID = 'quaid';
$[$.QUAID] = {};

if(!$[$.CLASS_NAMESPACE]) $[$.CLASS_NAMESPACE] = {};

(function(){
  
    var initializing = false;

    // The base Class implementation
    // add Class to window (this is window)
    this.Class = function(){
	};
	this.Class.prototype.init = function(container, settings, defaults){
		this.container = container;
		this.settings = $.extend({}, defaults, settings);
	};
 
    // Create a new Class that inherits from this class
    Class.extend = function(newClassName, prop) {
        
        // bogle modification: allow for auto creation of a node method.
        //so we allow calling extend without a newClassName. If it isnt there, shift.
        if(newClassName instanceof Object){
            prop = newClassName;
            newClassName = null;
        }
        else if(newClassName){
            
            if($.fn[newClassName]){
                throw Error("You cannot define '"+newClassName+"' more than once!");
            }
            
            //setup a node/element method for this new class. Maybe kind of magic.
            $.fn[newClassName] = function(options){ 
                var elems = this;
                var ret = [];
                elems.each(function(){
                    var elem = $(this);
                    var obj = elem.data(newClassName);
                    if(! obj){
                        if(! $[$.CLASS_NAMESPACE][newClassName])
                            $.log('Cannot find $.' + $.CLASS_NAMESPACE + '.' + newClassName + '!');
                        else{
                            obj = new $[$.CLASS_NAMESPACE][newClassName](elem, options);
                            elem.data(newClassName, obj);
                            obj.TYPE = newClassName;
                        }
                    }
                    ret.push(obj);
                });
                if(ret.length == 1) return ret[0];
                if(!ret.length) return null;
                return ret;
            };
        }
        // end bogle mod
        
        var _super = this.prototype;
   
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
       
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;
                       
                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];
                       
                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);       
                        this._super = tmp;
                       
                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
       
        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }
       
        // Populate our constructed prototype object
        Class.prototype = prototype;
       
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        if(newClassName)
            //save the new class in $.class[newClassName]
            $[$.CLASS_NAMESPACE][newClassName] = Class;
        
        return Class;
    };
})();


/**
 * $.adroll.ExtendWidget allows us to extend jquery widgets in the same way
 * we can extend our own classes via Class.extend. Rad.
 *
 * Inspiration from:
 * http://ejohn.org/blog/simple-javascript-inheritance
 * http://bililite.com/blog/extending-jquery-ui-widgets/
 *
 * Note that there is a bunch of copy paste from the Class.extend. I couldnt think
 * of a clean way to reuse junk between the two.
 *
 * USAGE:
 *
 * Must be called initially like this:
 *
 * $.adroll.AdrollWhatever = $.adroll.ExtendWidget('ui.somewidget');
 *
 * That will wrap the ui.somewidget widget in our little js container of magic.
 * From there on out we can create new types by simply calling .extend():
 *
 * $.adroll.AdrollWhatever2 = $.adroll.AdrollWhatever.extend('AdrollWhatever2', {
 *     init: function(element, options){
 *         //do constructor stuff here.
 *     }
 * });
 *
 * By specifying the 'AdrollWhatever2' string before the new object defn, we tell
 * extend to make us a node definition. The node definition would then allow for:
 *
 * $('#some-div').AdrollWhatever2({optionThing: true});
 *
 * Omitting the string will make extend not create the node funciton definition.
 * 
 **/

/*// for now, we dont need this widget extend code...

if($.ui){

$.WIDGET_NAMESPACE = 'widget'
$.ExtendWidget = function(type){
    
    //split ui.whatever as the widgets are stored that way
    var name = type.split(".");
    var namespace = name[0];
	name = name[1];
    
    var widget = $[namespace][name];
    var old_ctor = widget;
    
    // Create a new Class that inherits from this class
    widget.extend = function(newClassName, prop, elementMethod) {
        
        //so we allow calling extend without a newClassName. If it isnt there, shift.
        if(newClassName instanceof Object){
            elementMethod = prop;
            prop = newClassName;
            newClassName = null;
        }
        else{
            //setup an element/node method for this new class. Maybe kind of magic.
            $.fn[newClassName] = elementMethod || function(options){    
                var elem = $(this);
                var obj = elem.data(newClassName);
                
                if(! obj){
                    obj = new $[$.WIDGET_NAMESPACE][newClassName](this, options);
                    elem.data(newClassName, obj);
                }
                return obj;
            };
        }

        var _super = this.prototype;
   
        var prototype = {
            //this is the base init method. Basically allows us to override the
            //options passed into the constructor of the widget from the extended
            //class' init method (which is its ctor)
            init: function(element, options){
                
                if(options){
                    if(element instanceof jQuery)
                        element = element[0];
                        
                    //override the default options
                    this.options = $.extend({},
                        $.widget.defaults,
                        widget.defaults,
                        $.metadata && $.metadata.get(element)[name],
                        options);
                }
                
            }
        };
        
        prototype = $.extend(prototype, _super);
       
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;
                       
                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];
                       
                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);       
                        this._super = tmp;
                       
                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
       
        // The dummy class constructor
        function ExtendWidget(elem, opts){
            
            //if we forget the new operator... I do this all the damn time.
            if( !(this instanceof arguments.callee) ){
                $.log('MISSING NEW! Creating an instance of ', newClassName ? newClassName : '??');
                return new arguments.callee(elem, opts);
            }
            
            //call ui.widget constructor. This will bind some event handlers,
            //extend the options, etc.
            old_ctor.apply(this, arguments);
            
            //call our constructor. We can override the options at this point
            //as they havent been read by the widget yet!
            if ( this.init )
                this.init.apply(this, arguments);
            
            //call original init function AFTER ours so we have a bit of control.
            //This init function is the constructor for the jquery widget. It
            //will read the options, create its markup, etc.
            this._init();
        }
       
        // Populate our constructed prototype object
        ExtendWidget.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        ExtendWidget.constructor = ExtendWidget;
        
        // And make this class extendable
        ExtendWidget.extend = arguments.callee;
        
        if(newClassName)
            $[$.WIDGET_NAMSPACE][newClassName] = ExtendWidget;
        
        return ExtendWidget;
    };
    
    return widget;
};

//Initially create a cool dialog widget with an extend function hanging off it.
$.ExtendWidget('ui.dialog').extend('DialogWidget', {});

}//end if $.ui*/

})(jQuery);
