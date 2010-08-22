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
 * Q.Loader - an object that will display a loading gif. Creates
 * its own markup. Called on the container within which you would like to see
 * the loader. 
 *
 * var myLoader = $('#my-container').InlineLoader();
 *
 * It will handle multiple requests. So you can do something like this.
 * When both requests are done, the loader will hide itself. 
 *
 * $.post('/blah', function(){
 *     myLoader.stopLoading();
 * });
 * myLoader.startLoading();
 *
 * $.post('/blah-again', function(){
 *     myLoader.stopLoading();
 * });
 * myLoader.startLoading();
 *
 * This is useful if more than one link can be clicked and start parallel
 * requests that need the same loader.
 *
 * Note that your container probably has got to have position set to something
 * like relative. The gif generally uses position absolute, so it must be absolute
 * in your container.
 * 
 **/
Q.Loader = Class.extend('Loader',{
    init: function(container, options){
        
        var defs = {
            image: '16x16_arrows.gif',
            location: {position: 'absolute', right: 5, top: 5},
            opacity: 0.4 //opacity of the container while loading     
        };
        this._super(container, options, defs);
        
        //startLoading counts up, stopLoading counts
        //down. When count > 0, loader shown; when == 0, loader hides.
        this.loadingCount = 0;
        
        this.loaderCreated = false;
    },
    
    _createLoader: function(){
        this.loaderCreated = true;
        
        var self = this;
        var set = this.settings;
        var container = $('<div/>');
        
        var image = $('<img/>');
        image[0].src = this.settings.image;
        
        container.append(image);
        container.addClass('inline-loader');
        container.hide();
        
        this.container.append(container);
        
        this.loader = container;
        
        //do this so the abs positioned image has a ref point.
        if(this.container.css('position') == 'static')
            this.container.css('position', 'relative')
        
        if(this.settings.location == 'center'){
            
            //the image might take a bit to load.
            //When it loads we set the position...
            var objImagePreloader = new Image();
            objImagePreloader.onload = function() {
                
                var h = self.container.height();
                var w = self.container.width();
                self.setLocation({
					position: 'absolute',
					top: h/2 - objImagePreloader.height/2,
                    left: w/2 - objImagePreloader.width/2
				});
                
                objImagePreloader.onload=function(){};
            };
            objImagePreloader.src = self.settings.image;
        }
        else
            self.setLocation(self.settings.location);
    },
    
    _show: function(){
        if(!this.loaderCreated)
            this._createLoader();
        
        if(!this.isLoading()){
            this.oldOpacity = this.container.css('opacity');
            this.container.css('opacity', '' + this.settings.opacity)
            this.loader.css('display', 'block');
        }
    },
    
    _hide: function(){
        if(this.isLoading()){
            if(!this.oldOpacity || this.oldOpacity == '1')
                //remove opacity or opacity:1 will hose everything in IE. 
                this.container.css('opacity', null);
            else
                this.container.css('opacity', this.oldOpacity);
            this.loader.css('display', 'none');
        }
    },
    
    setLocation: function(locCssObj){
        this.settings.location = locCssObj;
        if(this.loader)
            this.loader.css(locCssObj);
    },
    
    isLoading: function(){
        if(this.loader)
            return this.loader.css('display') == 'block';
        return false;
    },
    
    startLoading: function(){
        this.loadingCount++;
        
        this._show();
    },
    
    stopLoading: function(){
        this.loadingCount = Math.max(0, this.loadingCount-1);
        
        if(this.loadingCount == 0)
            this._hide();
    }
});

/**
 * $.adroll.AsyncLoader
 *
 * Will deal with race conditions. Wraps the InlineLoader. Abstracts common
 * functionality that many widgets use. Rad.
 *
 * Basically, it provides a load() function. You call load with your url and
 * your call backs. It will handle race conditions. This is super useful
 * when youre loading data into some interface object that can only accept
 * one set of data at a time, but the user can induce multiple requests.
 * i.e. a dynamically loaded table, a dynamic graph, etc.
 **/
Q.AsyncLoader = Q.Loader.extend('AsyncLoader',{
    init: function(container, options){
        
        //same options as InlineLoader. Passes them through.
        var defs = {
            ajaxOptions: {
                type: 'POST',
                dataType: 'json',
                onPostLoad: function(){}
            }
        };
        this._super(container, $.extend({}, defs, options));
    },
    
    load: function(url, params, successfn, failfn){
        
        if(!url) {
            $.log('AsyncLoader.load on ', this.container, ': load() needs a url, f00! Seriously.');
            return false;
        }
        
        var self = this;
        
        self.startLoading();
        
        function _genHandler(fn){
            return function(){
                var cb = fn
                
                if($.isFunction(cb))
                    cb.apply(this, arguments);
                
                self.stopLoading();
                
                if($.isFunction(self.settings.onPostLoad))
                    self.settings.onPostLoad.call(this, 'fail', arguments);
            };
        }
        
        return $.ajax($.extend(self.settings.ajaxOptions, {
            url: url,
            data: params,
            success: _genHandler($.isFunction(successfn) ? successfn : self.settings.ajaxOptions.success),
            applicationError: _genHandler($.isFunction(failfn) ? failfn : self.settings.ajaxOptions.applicationError)
        }));
    }
});

Q.SingleResourceAsyncLoader = Q.AsyncLoader.extend('SingleResourceAsyncLoader',{
    init: function(container, options){
        
        //same options as AsyncLoader. Passes them through.
        var defs = {
            url: '',
            onSuccess: function(){},
            onFail: function(){}
        };
        this._super(container, $.extend({}, defs, options));
        
        //
        this.currentRequest = null;
        this.lastParams = {};
    },
    
    load: function(params){
        this.lastParams = params || this.lastParams;
        
        var req = this._super(this.settings.url, this.lastParams, this.settings.onSuccess, this.settings.onFail);
        
        if(req && this.currentRequest){
            this.currentRequest.abort();
            this.stopLoading();
        }
        this.currentRequest = req;
    }
});

//end no conflict
})(jQuery);
//
