;/******************************************************************************
 *
 *  Contains Debug stuff.
 *  
 ******************************************************************************/

(function($) {
	
Q.DebugBar = Q.Module.extend('DebugBar', {
	
	init: function(container, options){
        var self = this;
		
        var defs = {
            explainUrl: '/debug/explain',
            formatters: {
                queries: 'number',
                query_time: 'decimal(3)',
                total_time: 'decimal(3)'
            }
        };
        
        var settings = $.extend({}, defs, options);
        
        var node = Q.DebugBar.render.call(this, settings);
        container.append(node);
        
        this.container = container;
        this.settings = settings;
        
        this.totalQueries = container.find('.total-info .total-queries, .mini.total-queries');
        this.totalQueryTime = container.find('.total-info .total-query-time');
        this.totalTime = container.find('.total-info .total-time');
        
        this.requests = container.find('#requests');
        
        this.requests.click(function(e){
            var targ = $(e.target);
            if(targ.is('.debug-explain')){
                self._explain(targ);
                return false;
            }
        });
        
        this.FULL_COOKIE_KEY = 'full_debugbar';
        this.SIZE_COOKIE_KEY = 'debugbar_height';
        
        // initially resize the bar.
        var initialSize = self._getCookie(self.SIZE_COOKIE_KEY);
        if(!initialSize){
            initialSize = 300;
            self._setCookie(self.SIZE_COOKIE_KEY, initialSize);
        }
        container.css({height: initialSize+'px'});
        
        this._updateRequestContainerSize(container.height())
        
        // make it resizable
        container.resizable({
            handles: 'n',
            resize: function(e, ui){
                container.css({height: ui.size.height+'px', top: null, width: null});
                self._updateRequestContainerSize(ui.size.height);
                return false;
            },
            stop: function(){
                self._updateRequestContainerSize(container.height());
                self._setCookie(self.SIZE_COOKIE_KEY, container.height());
            }
        });
        
        //minification handlage
        var fullCookie = this._getCookie(this.FULL_COOKIE_KEY);
        this._changeMinification(fullCookie);
        container.find('.total-info, .mini').bind('dblclick', function(){
            var cookie = self._getCookie(self.FULL_COOKIE_KEY);
            self._changeMinification(cookie == 'show' ? 'hide' : 'show');
        });
        
        //setup the initial request line!
        this._setupRequest(container.find('.request'));
    },
    
    _setCookie: function(key, val){
        if($.cookie)
            $.cookie(key, val, { path: '/', expires: 50 });
    },
    
    _getCookie: function(key){
        if($.cookie)
            return $.cookie(key);
        return 'show';
    },
    
    _updateRequestContainerSize: function(containerHeight){
        this.requests.css({height: containerHeight - 27 + 'px'});
    },
    
    _changeMinification: function(mode){
        mode = mode || 'hide';
        
        var mini = this.container.find('.mini');
        var full = this.container.find('.full');
        
        if(mode == 'show'){
            var size = this._getCookie(this.SIZE_COOKIE_KEY);
            this.container.css({height: size});
            mini.hide();
            full.show();
        }
        else{
            //remove all the resizable junk.
            this.container.css({height: 'auto', top: null, width: null});
            full.hide();
            mini.show();
        }
        
        this._setCookie(this.FULL_COOKIE_KEY, mode);
    },
    
    _explain: function(el) {
        
        if(el.data('hasrun')) return;
        
        var query = el.find('.query-text').text();
        
        $.post(this.settings.explainUrl, {q: query}, function(data) {
            
            var elt = $('<div class="query-explanation">'+ data +'</div>');
            var q = $('<div class="query-full-text">'+ query +'</div>');
            
            //our expando wrapper.
            var exp = $('<div/>');
            exp.append(elt).append(q);
            el.after(exp);
            
            el.toggler({
                linkText: null,
                animationSpeed: 0,
                toToggle: exp,
                initiallyHidden: false
            });
            
            el.data('hasrun', true);
            
        }, 'text');
        
    }, //end explain
    
    _setupRequest: function(req){
        req.find('.info').toggler({
            linkText: null,
            toToggle: req.find('.queries, .detail'),
            animationSpeed: 0,
            onToggle: function(link, content, fn, event){
                var targ = $(event.target);
                if(targ.is('a')) return false;
                return true;
            }
        });
    },
    
    _handleDbQueries: function(data){
        var df = Q.DataFormatters.get;
        $.debug(data.requested_url, ': ', df('number', data.queries), ' queries, ', df('decimal(3)', data.query_time), ' query seconds, ', df('decimal(3)', data.total_time), ' total seconds');
        
        function update(elem, d, fn, interp){
            var val = fn(elem.eq(0).text().replace(',', ''));
            val += d;
            elem.text(df(interp, val));
        }
        
        update(this.totalQueries, data.queries, parseInt, 'number');
        update(this.totalQueryTime, data.query_time, parseFloat, 'decimal(3)');
        update(this.totalTime, data.total_time, parseFloat, 'decimal(3)');
        
        var req = $(data.request_html);
        this._setupRequest(req);
        
        this.requests.append(req);
        
        //ghetto length restriction.
        var url = req.find('.requested-url');
        var t = url.text().trim();
        if(t.length > 80){
            url.attr('title', t);
            url.text(Array.prototype.slice.call(t, 0, 80).join('') + '...');
        }
    },
    
    _handleException: function(data){
        if(!this._errorLink)
            this._errorLink = this.container.find('.last-error');
        
        this._errorLink.show();
        this._errorLink.attr('href', data.url);
        
        var error = $('<div/>',{
            'class': 'request async-error async-request'
        });
        
        var info = $('<div/>',{
            'class': 'info'
        });
        info.append($('<a/>',{
            'class': 'error-link',
            href: data.url,
            text: 'view error',
            target: 'applicationerror'
        }));
        info.append($('<div/>',{
            'class': 'data-chunk first',
            text: data.message
        }));
        
        var detail = $('<div/>',{
            'class': 'detail'
        });
        detail.append($('<div/>',{ 'class': 'data message', text: data.message }));
        detail.append($('<div/>',{ 'class': 'data file', text: data.file }));
        detail.append($('<div/>',{ 'class': 'data line', text: 'Line #' + data.line }));
        
        detail.append($('<pre/>',{ 'class': 'trace', html: data.trace.join('<br/>') }));
        
        error.append(info);
        error.append(detail);
        
        this._setupRequest(error);
        this.requests.append(error);
        
        alert([data.message, data.file, 'Line #' + data.line].join('\n'));
    },
    
    addRequest: function(data){
        if(data.queries)
            this._handleDbQueries(data);
        else if(data.exception_type)
            this._handleException(data);
    }
});

Q.DebugBar.render = function(settings){
    /**
     * data = {
        'queries': 10,
        'query_time': 0.234,
        'total_time': 0.256,
        'requested_url': '/blah',
        'query_data': [{'query': q, 'time': t} for q, t in queries]
       }
     */
    var template = '<span class="mini total-queries" title="Double-click to open">{queries}</span> \
        <div class="full"> \
            <div class="total-info" title="Double-click to minify"> \
                <a href="#" class="last-error" target="applicationerror">last error</a> \
                <span class="data-chunk first"> \
                    <span class="total-queries data">{queries}</span> queries \
                </span> \
                <span class="data-chunk"> \
                    Query Time: <span class="total-query-time data">{query_time}</span> sec \
                </span> \
                <span class="data-chunk"> \
                    Total Time: <span class="total-time data">{total_time}</span> sec \
                </span> \
            </div> \
            <div id="requests"></div> \
        </div>';
    
    var d = {};
    for(var k in settings.data){
        d[k] = settings.data[k];
        if(settings.formatters[k])
            d[k] = Q.DataFormatters.get(settings.formatters[k], settings.data[k]);
    }
    return $($.replace(template, d));
};

//install itself.
Q.handleServerError = function(data, xhr, status, errorThrown){
    if(data && data.debug && data.debug.exception_type && Q.DEBUG)
        Q.DEBUG.addRequest(data.debug);
    else
        alert('Oops. An error occurred. Our team has been notified!');
};

Q.handleSuccess = function(data, options){
    // dump the data into the query analyzer.
    if(data.debug && Q.DEBUG){
        Q.DEBUG.addRequest(data.debug);
    }
};


$(document).ready(function(){
    Q.DEBUG = $('#fancy-debug-bar').DebugBar();
    Q.ERROR_DISPLAY = $('#error-display').ErrorDisplay();
});

//end conflict resolution	
})(jQuery);				