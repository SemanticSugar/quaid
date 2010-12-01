
(function($) {

/**
 *
 *
 **/
Q.ErrorDisplay = Q.Module.extend('ErrorDisplay', {
	
	init: function(container, options){
        var self = this;
		
        var defs = {};
        
        var settings = $.extend({}, defs, options);
        this._super(container, settings);
        
        this._setup();
    },
    
    _setup: function(){
        var self = this;
        
        var dismiss = $('<a/>', {
            'class': 'dismiss',
            text: 'dismiss',
            href: '#'
        });
        dismiss.click(function(){
            self.hide();
            self.clear();
            return false;
        });
        this.container.append(dismiss);
        
        this.errors = $('<div/>', {
            id: 'errors'
        });
        this.container.append(this.errors);
        
        this.hide();
    },
    
    _buildError: function(error){
        var node = $('<div/>', {
            'class': 'error',
            text: error.message
        });
        
        return node;
    },
    
    show: function(){ this.container.show(); },
    hide: function(){ this.container.hide(); },
    
    clear: function(){
        this.errors.children().remove();
    },
    
    handleErrors: function(errors){
        if(errors.length)
            this.show();
        for(var i = 0; i < errors.length; i++)
            this.errors.append(this._buildError(errors[i]));
    }
});

//display installation
var oldAppError = Q.handleApplicationErrors;
Q.handleApplicationErrors = function(errors){
    if(Q.ERROR_DISPLAY){
        Q.ERROR_DISPLAY.handleErrors(errors);
        Q.asyncErrors.handle(errors);
    }
    else
        oldAppError(errors);
};
$(document).ready(function(){
    window.ERROR_DISPLAY = $('#error-display').ErrorDisplay();
});

//global js error catching
Q.WindowErrorUrl = null; //'/api/v1/error/jserror'
var oldwinerr = window.onerror;
window.onerror = function(err, file, line){
    if($.isFunction(window.onerror)) window.onerror.apply(this, arguments);
    
    if(Q.WindowErrorUrl){
        var flash = 'None';
        if($.flash.available)
            flash = $.replace('{0}.{1}.r{2}', [$.flash.version.major, $.flash.version.minor, $.flash.version.release])
        
        var errorJson = {
            error: err || 'Unknown',
            file: file || 'Unknown',
            line: line || 0,
            user_agent: navigator.userAgent,
            url: document.location.href,
            flash: flash
        };
        
        setTimeout(function(){
            $.postJSON(Q.WindowErrorUrl, {error: $.toJSON(errorJson)});
        }, 100);
    }
};

})(jQuery);	