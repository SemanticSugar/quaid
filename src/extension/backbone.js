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

/**
 * Backbone integration
 */
;(function($){

if(!this.Backbone){
    $.debug('Backbone not defined. Kicking out of the Quaid backbone module.');
    return;
}

var _View = Q.Module.extend(Backbone.View.prototype);
Q.View = _View.extend('View', {
    _ctor: function(arg1, arg2){
        
        // If an element is specified (i.e. $('#blah').View()), place it in the 
        // backbone view's el property. Do this before the ctor so BB doesnt
        // create an element.
        if(arg1.jquery || _.isElement(arg1)){
            this.el = arg1;
            arg1 = arg2;
        }
        
        //call backbone's constructor
        Backbone.View.call(this, arg1);
        
        // call the quaid constructor
        if ( $.isFunction(this.init) )
            this.init.call(this, this.el.jquery ? this.el : $(this.el), arg1);
    }
});

//give our module class backbone events!
$.extend(Q.Module.prototype, Backbone.Events);

})(jQuery);
