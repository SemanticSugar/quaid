
(function($) {

/**
 *
 *
 **/

Q.NotificationDisplay = Q.Module.extend('NotificationDisplay', {
	
	init: function(container, options){
        var defs = {
            id: '',
            dismissText: '',
            containerId: '',
            messageClass: '',
            onHide: function(){},
            decay: null //in milliseconds
        };
        var settings = $.extend({}, defs, options);
        
        if(!container)
            container = $('<div/>', {id: settings.id});
        
        this._super(container, settings);
        
        $.log(settings, this.container);
        
        this._setup();
    },
    
    _setup: function(){
        var self = this;
        
        this.count = 0;
        this.messageModel = [];
        
        var dismiss = $('<a/>', {
            'class': 'dismiss',
            text: this.settings.dismissText,
            href: '#'
        });
        dismiss.click(function(){
            self.hide();
            self.clear();
            return false;
        });
        this.container.append(dismiss);
        
        this.messages = $('<div/>', {
            id: this.settings.containerId
        });
        this.container.append(this.messages);
        
        this.hide();
    },
    
    _buildMessage: function(message, id, messageClass){
        var node = $('<div/>', {
            'class': this.settings.messageClass + ' message-'+id + (messageClass ? ' '+messageClass : ''),
            html: message
        });
        
        return node;
    },
    
    _removeRecent: function(){
        if(this.messageModel.length){
            var self = this;
            var m = this.messageModel[0];
            this.messageModel = this.messageModel.slice(1);
            this.$('.message-'+m.id).fadeOut(300,
                function(){
                    if(!self.messageModel.length)
                        self.hide();
                });
        }
    },
    _startDecay: function(ms){
        if(!ms) return false;
        var self = this;
        setTimeout(function(){
            self._removeRecent();
        }, ms);
        return true;
    },
    
    add: function(message, decay, messageClass){
        if(message && message.length)
            this.show();
        var m = this._buildMessage(message, this.count, messageClass);
        this.messages.append(m);
        this.messageModel.push({message: message, id: this.count++});
        if(decay != false)
            this._startDecay(this.settings.decay);
        return m;
    },
    
    show: function(){
        this.container.show();
        this.container.parent().addClass(this.settings.messageClass);
    },
    hide: function(){
        if($.isFunction(this.settings.onHide))
            this.settings.onHide.call(this);
        this.container.hide();
        this.container.parent().removeClass(this.settings.messageClass);
    },
    
    clear: function(){
        this.messages.children().remove();
        this.messageModel = [];
    }
});

Q.ErrorDisplay = Q.NotificationDisplay.extend('ErrorDisplay', {
	init: function(container, options){
        var defs = {
            id: 'error-display',
            dismissText: 'dismiss',
            containerId: 'errors',
            messageClass: 'error'
        };
        this._super(container, $.extend({}, defs, options));
    }
});
Q.WarningDisplay = Q.NotificationDisplay.extend('WarningDisplay', {
	init: function(container, options){
        var defs = {
            id: 'warning-display',
            dismissText: 'dismiss',
            containerId: 'warnings',
            messageClass: 'warning',
            decay: 10000
        };
        this._super(container, $.extend({}, defs, options));
    }
});
Q.MessageDisplay = Q.NotificationDisplay.extend('MessageDisplay', {
	init: function(container, options){
        var defs = {
            id: 'message-display',
            dismissText: 'close',
            containerId: 'messages',
            messageClass: 'message',
            decay: 10000
        };
        this._super(container, $.extend({}, defs, options));
    }
});

var FUNCTIONS = {
    notify: Q.MessageDisplay,
    warn: Q.WarningDisplay,
    error: Q.ErrorDisplay
};

//display installation
var oldAppError = Q.handleApplicationErrors;
Q.handleApplicationErrors = function(errors){
    if(Q.error){
        for(var i = 0; i < errors.length; i++)
            Q.error(errors[i].message);
        Q.asyncErrors.handle(errors);
    }
    else
        oldAppError(errors);
};

$(document).ready(function(){
    var displays = $('#notification-display');
    $.log(displays);
    for( var k in FUNCTIONS ){
        var o = Q[k.toUpperCase()] = new FUNCTIONS[k]();
        displays.append(o.container);
        
        (function(obj){
            Q[k] = function(message, decay, clazz){
                obj.add(message, decay, clazz);
            };
        })(o);
    }
});

})(jQuery);	