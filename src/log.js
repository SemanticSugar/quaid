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

$.log = function(){
    if( $.log.enabled ){
        if( !$.log.logFn.apply(null, arguments) )
            if($.isFunction($.log.failoverFn))
                $.log.failoverFn(arguments);
    }
};

$.log.enabled = true;
$.log.failoverToFirebugLite = true;
$.log.firebugLiteUrl = 'https://getfirebug.com/firebug-lite-beta.js';

//index into the $.log.LEVEL_ORDER array
$.log.level = 0;

$.log.DEBUG = 'DEBUG:';
$.log.INFO = 'INFO:';
$.log.WARNING = 'WARNING:';
$.log.ERROR = 'ERROR:';
$.log.LOG = 'LOG:';

$.log.LEVEL_ORDER = [$.log.DEBUG, $.log.INFO, $.log.WARNING, $.log.ERROR, $.log.LOG];

//here is a log prefix to console function name map.
$.log.LEVEL_FUNCTIONS = {};
$.log.LEVEL_FUNCTIONS[$.log.DEBUG] = 'debug';
$.log.LEVEL_FUNCTIONS[$.log.INFO] = 'info';
$.log.LEVEL_FUNCTIONS[$.log.WARNING] = 'warn';
$.log.LEVEL_FUNCTIONS[$.log.ERROR] = 'error';
$.log.LEVEL_FUNCTIONS[$.log.LOG] = 'log';

$.log.logFn = function(){
    if( window.console && window.console.log && $.isFunction(window.console.log)){
        
        var ind;
        var fn = window.console.log;
        var args = [];
        
        //copy to real array
        for(var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        
        //figure out if we need to call a different log fn on the console.
        if(arguments.length > 0 && (ind = $.log.LEVEL_ORDER.indexOf(arguments[0])) > -1){
            var fn2 = window.console[$.log.LEVEL_FUNCTIONS[$.log.LEVEL_ORDER[ind]]];
            if($.isFunction(fn2)){
                fn = fn2;
                args = args.slice(1);
            }
        }
        
        //actually log
        fn.apply(window.console, args);
        return true;
    }
    return false;
};

//basically calls $.log with some prefix like $.log('DEBUG:', your_args);
$.log._specialLog = function(prefix, args){
    var a = [prefix];
    for(var i = 0; i < args.length; i++)
        a.push(args[i]);
    $.log.apply(this, a);
};

//create all the special functions: $.debug, $.info, etc...
for(var i = 0; i < $.log.LEVEL_ORDER.length; i++){
    var fn = $.log.LEVEL_FUNCTIONS[$.log.LEVEL_ORDER[i]];
    if(fn != 'log')
        (function(index){$[fn] = function(){
            if(index >= $.log.level)
                $.log._specialLog($.log.LEVEL_ORDER[index], arguments)
        };}(i));
}

$.log.failoverFn = function(args){
    
    function pollLogFn(doneFn){
        var interval = setInterval(function(){
            if($.log.logFn.apply(null, args)){
                clearInterval(interval);
                $.isFunction(doneFn) && doneFn();
            }
        }, 100);
    }
        
    if($.log.failoverToFirebugLite){
        
        //dynamically load firebug lite. It is HEAVY in IE on the VM.
        if(!$.log.loading){
            
            $.log.loading = true;
            var script = $('<script/>', {
                type: 'text/javascript',
                src: $.log.firebugLiteUrl
            });
            
            //why doesnt this work for me?
            /*var script_tag = script[0];
            script_tag.onload = script_tag.onreadystatechange = function() {
                if(!this.readyState || this.readyState == "loaded" || this.readyState == "complete") {
                    $.log.logFn.apply(null, args);
                }
            };*/
            
            $('body').append(script);
            
            //ghetto way to get the first log message in there.
            pollLogFn(function(){$.log.loading = false;});
        }
        else
            pollLogFn();
    }
    else if($.SimpleConsole){
        window.console = $('body').SimpleConsole();
        $.log.logFn.apply(null, args);
    }
    //else, do nothing.
};

//end no conflict
})(jQuery);
//

