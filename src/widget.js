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

Q.Loader = Class.extend('Loader',/** @lends Q.Loader */{
        /**
         * <p>Default options.</p>
         * <pre class="code">
         * image: '16x16_arrows.gif', //path to your loading gif
         * location: {position: 'absolute', right: 5, top: 5}, //css opts; can be 'center'
         * opacity: 0.4 //opacity of the container while loading
         * </pre>
         */
        defaults: {
            image: '16x16_arrows.gif',
            location: {position: 'absolute', right: 5, top: 5},
            opacity: 0.4 //opacity of the container while loading     
        }
    },/** @lends Q.Loader# */{
    /**
     * @class
     * <p>An object that will display a loading gif. Creates
     * its own markup. Called on the container within which you would like to see
     * the loader.</p>
     *
     * <p>It will handle multiple requests. You can call startLoading() multiple times
     * before calling stopLoading(). startLoading() effectively increments a counter
     * and stopLoading() decrement the counter. The image will be shown when the counter
     * is non-zero and hidden when zero.</p>
     * 
     * <p>This is useful if more than one link can be clicked and start parallel
     * requests that need the same loader.</p>
     *
     * <p>Note that your container probably has got to have position set to something
     * like relative. If it is a position: static the plugin will set it to relative so
     * you aren't confused when it looks like the image isn't showing up then emailing me
     * saying it doesn't work.</p>
     * 
     * @example
     *
     * var myLoader = $('#my-container').Loader();
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
     * @augments Q.Class
     * @param container The jQuery object
     * @param options Your config.
     * @constructs
     **/
    init: function(container, options){
        
        this._super(container, options, Q.Loader.defaults);//this._class.defaults);
        
        //startLoading counts up, stopLoading counts
        //down. When count > 0, loader shown; when == 0, loader hides.
        this.loadingCount = 0;
        
        this.loaderCreated = false;
    },
    
    /**
     * Creates the image markup and jams it in the container element.
     * @private
     */
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
    
    /**
     * Shows the loading image
     * @private
     */
    _show: function(){
        if(!this.loaderCreated)
            this._createLoader();
        
        if(!this.isLoading()){
            this.oldOpacity = this.container.css('opacity');
            this.container.css('opacity', '' + this.settings.opacity)
            this.loader.css('display', 'block');
        }
    },
    
    /**
     * Hides the loading image
     * @private
     */
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
    
    /**
     * <p>Sets the location (really any css params) of the loading image. Can be used at any time.</p>
     * 
     * @param locCssObj An object that will be applied to the loadimg image via jQuery.css()
     */
    setLocation: function(locCssObj){
        this.settings.location = locCssObj;
        if(this.loader)
            this.loader.css(locCssObj);
    },
    
    /**
     * <p>Lets you know if the loading image is loading or not.</p>
     * 
     * @returns a bool 
     */
    isLoading: function(){
        if(this.loader)
            return this.loader.css('display') == 'block';
        return false;
    },
    
    /**
     * <p>Will increment the loading count and show the loader if not already shown.</p>
     */
    startLoading: function(){
        this.loadingCount++;
        
        this._show();
    },
    
    /**
     * <p>Will decrement the loading count and potentially hide the loader.</p>
     */
    stopLoading: function(){
        this.loadingCount = Math.max(0, this.loadingCount-1);
        
        if(this.loadingCount == 0)
            this._hide();
    }
});

Q.AsyncLoader = Q.Loader.extend('AsyncLoader', /** @lends Q.AsyncLoader */{
        /**
         * <p>Default options. Extends {@link Q.Loader} defaults.</p>
         * <pre class="code">
         * ajaxOptions: { //ajaxOptions passed into $.ajax
         *     type: 'POST',
         *     dataType: 'json',
         *     onPostLoad: function(){}
         * }
         * </pre>
         */
        defaults: {
            ajaxOptions: {
                type: 'POST',
                dataType: 'json'
            },
            onPostLoad: null
        }
    },/** @lends Q.AsyncLoader# */{
    /**
     * @class
     * <p>Connects an async request to a loading image. Exposes a load() function
     * that you can pass a url, params and callbacks to.</p>
     *
     * @augments Q.Loader
     * @param container The jQuery object
     * @param options Your config.
     * @constructs
     **/
    init: function(container, options){
        //must deep copy because of the ajaxOptions...
        this._super(container, $.extend(true, {}, this._class.defaults, options));
    },
    
    /**
     * <p>Loads data from the server, shows/hides the loading image, calls your callbacks, makes you coffee.</p>
     *
     * @param url The url to make the request to
     * @param params An object filled with params to the server
     * @param successfn success callback. If not specified, will use the callback
     * specified in the ajaxOptions. Signature function(data){}
     * @param failfn fail callback. If not specified, will use the callback
     * specified in the ajaxOptions. Signature: function(error_type, errors){}
     */
    load: function(url, params, successfn, failfn){
        
        if(!url) {
            $.log('AsyncLoader.load on ', this.container, ': load() needs a url, f00! Seriously.');
            return false;
        }
        
        var self = this;
        
        self.startLoading();
        
        function _genHandler(str, fn){
            return function(){
                var cb = fn
                
                if($.isFunction(cb))
                    cb.apply(this, arguments);
                
                self.stopLoading();
                
                if($.isFunction(self.settings.onPostLoad))
                    self.settings.onPostLoad.call(this, str, arguments);
            };
        }
        
        return $.ajax($.extend(self.settings.ajaxOptions, {
            url: url,
            data: params,
            success: _genHandler('success', $.isFunction(successfn) ? successfn : self.settings.ajaxOptions.success),
            applicationError: _genHandler('fail', $.isFunction(failfn) ? failfn : self.settings.ajaxOptions.applicationError)
        }));
    }
});

Q.SingleResourceAsyncLoader = Q.AsyncLoader.extend('SingleResourceAsyncLoader', /** @lends Q.SingleResourceAsyncLoader */{
        /**
         * <p>Default options. Extends {@link Q.AsyncLoader} defaults.</p>
         * <pre class="code">
         * url: '', //Your resource to load
         * onSuccess: function(data){}, //when request is successful
         * onFail: function(error_type, errors){}
         * </pre>
         */
        defaults: {
            url: '',
            onSuccess: null,
            onFail: null
        }
    }, /** @lends Q.SingleResourceAsyncLoader# */{
    /**
     * @class 
     *
     * <p>Will deal with race conditions. Extends the AsyncLoader.</p>
     *
     * <p>Basically, it provides a load() function. You call init with your url and
     * your call backs. THen you call load() with your params. It will handle race conditions.
     * This is super useful when youre loading data into some interface object that can only accept
     * one set of data at a time, but the user can induce multiple requests.
     * i.e. a dynamically loaded table, a dynamic graph, etc.</p>
     *
     * @augments Q.AsyncLoader
     * @param container The jQuery object
     * @param options Your config.
     * @constructs
     **/
    init: function(container, options){
        
        var defs = {
            url: '',
            onSuccess: null,
            onFail: null
        };
        this._super(container, $.extend({}, this._class.defaults, options));
        
        this.currentRequest = null;
        this.lastParams = {};
    },
    
    /**
     * <p>Connects an async request to a loading image.</p>
     *
     * @param params An object filled with params to pass to the server
     */
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
