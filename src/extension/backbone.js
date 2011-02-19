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

//give our module class backbone events!
$.extend(Q.Module.prototype, Backbone.Events);
$.extend(Q, Backbone.Events);


var _View = Q.Module.extend(Backbone.View.prototype);
Q.View = _View.extend('View', {
    //in your base class, define:
    //template: '#my-template',
    
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
    },
    
    renderTemplate: function(attributes){
        /**
         * Uses the template property of the object, and passes in your attributes
         */
        this.container.html(_.template($(this.template).html(), attributes));
        return this;
    },
    
    render: function(){
        return this.renderTemplate(this.model.attributes);
    }
});

// using call as a hack so the resulting objects are of type Backbone.Collection
// making it so isinstance still works.
var _Collection = Class.extend.call(Backbone.Collection, Backbone.Collection.prototype);
Q.Collection = _Collection.extend({
    _ctor: function(models, settings){
        
        this.settings = settings;
        
        //call backbone's constructor
        Backbone.Collection.call(this, models, settings);
        
        // call the quaid constructor
        if ( $.isFunction(this.init) )
            this.init.call(this, models, settings);
    },
    init: function(){},
    
    removeAll: function(){
        var models = _.clone(this.models);
        for(var i = 0; i < models.length; i++)
            this.remove(models[i]);
    },
    
    /**
     * Called by Backbone.sync. grabs a url from this.urls based on the method
     */
    url: function(method) {
        if(!this.urls || !this.urls[method])
            $.error("Place a url map in the settings of your model! " + this + " needs a url for " + method);
        else{
            var url = this.urls[method];
            return $.isFunction(url) ? url() : url;
        }
        throw new Error('Place a url map in the settings of your model!');
    }
});

// using call as a hack so the resulting objects are of type Backbone.Model
// making it so isinstance still works.
var _Model = Class.extend.call(Backbone.Model, Backbone.Model.prototype);
Q.Model = _Model.extend({
    
    _ctor: function(attributes, settings){
        
        this.settings = $.extend({}, Q.Model.defaults, settings);
        
        //call backbone's constructor
        Backbone.Model.call(this, attributes, this.settings);
        
        // call the quaid constructor
        if ( $.isFunction(this.init) )
            this.init.call(this, attributes, this.settings);
    },
    
    init: function(){},
    
    /**
     * Upon create, update, read, this is called with the server's response.
     * You are supposed to return an object that will be passed to this
     * model's set function.
     *
     * Default it sets nothing returning an empty object.
     */
    parse: function(data){
        data = data.results || data;
        if(data.eid)
            return {id: data.eid, eid: data.eid};
        
        return {};
    },
    
    /**
     * Called by Backbone.sync. Default behaviour is to reuturn all the attributes.
     */
    toJSON: function(){
        return $.extend({}, this.attributes);
    },
    
    /**
     * Called by Backbone.sync. grabs a url from this.settings.urls based on the method
     */
    url: function(method) {
        if(!this.urls || !this.urls[method])
            $.error("Place a url map in the settings of your model! " + this + " needs a url for " + method);
        else{
            var url = this.urls[method];
            return $.isFunction(url) ? url() : url;
        }
        throw new Error('Place a url map in the settings of your model!');
    },
    
    /**
     * returns GET/POST, etc based on a CRUD word from Backbone.sync
     */
    httpMethod: function(method){
        return this.settings.methods[method];
    }
});

Q.Model.methods = {
    create: 'POST',
    read: 'GET',
    update: 'POST',
    'delete': 'POST'
};

//end stuff to put in quaid

//backbone sync override
Backbone.sync = function(method, model, success, error) {
    var modelJSON = model.toJSON(method);
    
    var wrap = function(fn, err){
        return function(){
            if($.isFunction(fn)) fn.apply(this, arguments);
            model.trigger('request:end', err, arguments);
        };
    }
    
    // Default JSON-request options.
    var params = {
        url: model.url(method),
        type: Q.Model.methods[method],
        data: modelJSON,
        dataType: 'json',
        success: wrap(success, false),
        error: wrap(error, true)
    };
    
    model.trigger('request:start', modelJSON, params);
    
    // Make the request.
    $.ajax(params);
};

})(jQuery);
