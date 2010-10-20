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

/**
 * @namespace <p>jQuery namespace overrides and additions.</p>
 * @name $
 */
;(function($){

/*!
 * Inheritance from John Resig.
 * http://ejohn.org/blog/simple-javascript-inheritance
 * Inspired by base2 and Prototype
 * MIT license
 */

var fnTest = /xyz/.test(function(){xyz;}) ? /\b(_super|_class)\b/ : /.*/;

$.CLASS_NAMESPACE = 'class';
$.QUAID = 'quaid';
$[$.QUAID] = {};

/**
 * @namespace <p>Quaid namespace. We'll hang all kinds of fun plugins off Q. Convenience for $[$.QUAID].</p>
 * @name Q
 */
window.Q = $[$.QUAID];

if(!$[$.CLASS_NAMESPACE]) $[$.CLASS_NAMESPACE] = {};

(/** @lends Q.Class# */function(){
    
    var initializing = false;

    // The base Class implementation
    // add Class to window (this is window)
    this.Class = function(){
    };
    /**
     * <p>The base class constructor. Provides setting extension. Puts the settings in
     * this.settings. Puts the container element in this.container. This constructor takes
     * two settings params so in your subclass you can call:</p>
     *
     * <pre class="code">this._super(container, userSettings, newClassDefaults);</pre>
     *
     * @class <p>This is the base class all your new classes will inherit from. Check out the
     * main usage: {@link Q.Class.extend}.</p>
     * 
     * @constructs
     * @param container The jQuery object that this class relates to
     * @param settings The user's passed in settings
     * @param defaults Your subclass' defaults
     * @name Q.Class
     */
    this.Class.prototype.init = function(container, settings, defaults){
        this.container = container;
        this.settings = $.extend({}, defaults, settings);
    };
 
    /**
     * <p>Create a new class that inherits from Class.</p>
     * 
     * <p>newClassName is optional. When specified, Quaid will put your class under
     * Q[newClassName] and will wrap it in a jQuery plugin at $.fn[newClassName]. For example:</p>
     *
     * <pre class="code">
     * Class.extend('Hidden',{
     *     init: function(container, settings){
     *         this._super(container, settings, {});
     *         this.container.hide();
     *     }
     * });
     * var div = $('#some-div');
     * var hidden = div.Hidden({setting: 'blah'});
     * //or
     * var hidden = new Q.Hidden(div, {setting: 'blah'});
     * </pre>
     *
     * <p>If newClassName is not specified the new class will not be put in the Q or
     * the $.fn namespace. Example:</p>
     *
     * <pre class="code">
     * var MyNewClass = Class.extend({
     *     init: function(blah, wow, ok){
     *         this.omg = wow;
     *     }
     * });
     *
     * var yay = new MyNewClass(2, 'derp', 'foo');
     * $.log(yay.omg);
     * </pre>
     *
     * @function 
     * @name Q.Class.extend
     * @param newClassName (optional) The name of your subclass.
     * @param staticProperties (optional) static properties of your new class. Accessable via Q.YourClass.$param
     * @param properties The protoype object for your new class
     * @returns Your shiny new class!
     */
    Class.extend = function(/*newClassName, staticMembers, prop*/) {
        
        function isStr(s){return typeof s == "string" || s instanceof String;}
        function isObj(o){return o instanceof Object;}
        
        // bogle modifications:
        //  * allow for auto creation of a node method.
        //  * allow ability to specify static members
        var newClassName, staticMembers, prop;
        
        if(arguments.length == 1 && isObj(arguments[0]))
            prop = arguments[0]; //just prototype extension
        else if(arguments.length == 2 && isObj(arguments[0]) && isObj(arguments[1]))
            staticMembers = arguments[0], prop = arguments[1];
        else if(arguments.length == 2 && isStr(arguments[0]) && isObj(arguments[1]))
            newClassName = arguments[0], prop = arguments[1];
        else if(arguments.length == 3 && isStr(arguments[0]) && isObj(arguments[1]) && isObj(arguments[2]))
            newClassName = arguments[0], staticMembers = arguments[1], prop = arguments[2];
        else
            throw new Error('extend() not called correctly!');
        
        if(newClassName){
            
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
                (function(name, fn, cls){
                    return function() {
                        var tmp = this._super;
                        var tmpCls = this._class;
                       
                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];
                        this._class = cls;
                       
                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);       
                        this._super = tmp;
                        this._class = tmpCls;
                       
                        return ret;
                    };
                })(name, prop[name], Class) :
                prop[name];
        }
       
        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
            //this._class = Class;
        }
        
        if(staticMembers)
            $.extend(Class, staticMembers);
        
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

})(jQuery);
