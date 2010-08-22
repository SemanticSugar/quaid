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
(function($){
//

var Q = $[$.QUAID];

$.SimpleConsole = {
    cookieOpts: { path: '/', expires: 10 },
    messageMarkup: '<div class="console-message"></div>',
    markup: '<div id="console">' +
                '<a id="console-expand-link" href="#">[-]</a>' +
                '<h3 id="console-head">Console</h3>' +
                '<div id="console-body"></div>' +
            '</div>'
};

Q.SimpleConsole = Class.extend('SimpleConsole', {
    init: function(container, settings){
        this.console = null;
        var console = $('#console');
        if(console.length > 0)
            this.console = console;
        this._super(container, settings);
    },
    
    _makeConsoleIfNecessary: function(){
        if(this.console)
            return this.console;
        
        console = $($.SimpleConsole.markup);
        console.hide();
        $('body').append(console);
        this.console = console;
        
        this.body = console.find('#console-body');
        this.toggle = console.find('#console-expand-link');
        
        $this = this;
        this.toggle.click(function(){
            var left = parseInt($this.console.css('left'));
            $this.changeConsoleDisplay(left < 0);
            return false;
        });
        
        if($.cookie){
            var remember = $.cookie('console');
            this.changeConsoleDisplay(remember == 'show');
        }
        
        return console;
    },
    
    _humanify: function(thing){
        try{
            if(typeof(thing) == "string")
                return "'" + thing + "'";
            else if($.isFunction(thing)){
                var fnstr = (thing+'');
                return fnstr.substring(0, fnstr.indexOf('{'));
            }
            else if($.isArray(thing)){
                //for(var i = 0; i < thing.length; i++)
                //    thing[i] = this._humanify(thing[i]);
                return '[' + thing.join(', ') + ']';
            }
            else if(thing instanceof Object){
                var pair = null;
                for( var x in thing ){
                    pair = [x, thing[x]];
                }
                
                var str = '{';
                if(pair && pair.length == 2)
                    str += pair[0] + ': ' + pair[1]/*this._humanify(pair[1])*/ + ' ... ';
                str += '}';
                
                return str;
            }
            return thing;
        }
        catch(err){
            return ''+thing;
        }
    },
    
    _getOutput: function(thing){
        var str = '';
        
        if($.isArray(thing)){
            str = this._humanify(thing);
        }
        else if(thing instanceof Object){
            
            str = 'Object: {<br>';
            
            for(k in thing){
                
                data = thing[k];
                
                str += '&nbsp;&nbsp;' + k + ': ' + this._humanify(data) + ',<br>';
            }
            
            str += '}<br>';
        }
        else
            str += thing;
        
        return str;
    },
    
    _setConsoleCookie: function(val){
        if($.cookie)
            $.cookie('console', val, $.SimpleConsole.cookieOpts);
    },
    
    changeConsoleDisplay: function (doShow){
        var consoleWid = this.console.width();
        if(doShow){
            this._setConsoleCookie('show');
            this.toggle.text('[-]');
            this.console.animate({left: 0}, 200);
        }
        else{
            this._setConsoleCookie('hide');
            this.toggle.text('[+]');
            this.console.animate({left: 32 - consoleWid}, 200);
        }
    },
    
    log: function(){
        
        this._makeConsoleIfNecessary();
        
        var data = '';
        
        for(var i = 0; i < arguments.length; i++)
            data += this._getOutput(arguments[i]) + ' ';
        
        data = $($.SimpleConsole.messageMarkup).html(data);
        if(this.body){
            this.body.append(data);
            this.body.animate({scrollTop: 99999}, 20);
        }
        this.console.show();
        
    }
});

//end no conflict
})(jQuery);
//

