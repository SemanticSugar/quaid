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

$.extend($, {
    
    isString: function(thing){
        return typeof thing == "string" || thing instanceof String;
    },
    
    isNumber: function(thing){
        return typeof thing == "number";
    },
    
    /**
     * Why does this check for only vanilla objects? Because I often need to.
     **/
    isObject: function(thing){
        return !$.isString(thing) && !$.isArray(thing) && ! (thing instanceof Date) && thing instanceof Object;
    },
    
    round: function(num, rlength){
        return Math.round(num*Math.pow(10,rlength))/Math.pow(10,rlength);
    },
    
    zeroPad: function(num, digits){
        
        num = ''+num;
        if(num.length >= digits)
            return num;
        
        var d = [];
        var max = (digits - num.length);
        for( var i = 0; i < max; i++ )
            d.push('0');
        return d.join('') + num;
    },
    
    /***
     ***** String manipulation functions
     ***/
    
    /**
    * returns the proper string for the number given.
    * i.e. pluralize(1, '{0} people', 'one person', 'no people :(')
    * would return 'one person'
    * 
    * {0} is replaced with the number, always, even in the one case.
    *
    * :param num: number of things to be described
    * :param ifmany: verbage for more than 1 item
    * :param ifone: verbage for 1 item
    * :param ifzero: optional; if not will use ifmany.
    **/
    pluralize: function(num, ifmany, ifone, ifzero){
        var str = ifmany;
       
        if(num == 1)
            str = ifone;
        else if(num == 0 && $.isString(ifzero))
            str = ifzero;
       
        return str.replace('{0}', num);
    },
    
    andJoin: function(strings){
        if(strings.length == 0)
            return '';
        if(strings.length == 1)
            return strings[0];
       
        return strings.slice(0, strings.length-1).join(', ') + ' and ' + strings[strings.length - 1];
    },
    
    //sort of string interpolation
    //replace('/blah/{0}/apsd/{1}', ['wow', 'omg']) returns '/blah/wow/apsd/omg'
    //replace('/blah/{bar}/apsd/{foo}', {foo: 'wow', bar: 'omg'}) returns '/blah/omg/apsd/wow'
    replace: function(str, vars){
        
        //turns out the js replace fn only replaces the first str. I am not using regexs. Obvi.
        function repl(s, replace, withThis){
            while(s.indexOf(replace) > -1)
                s = s.replace(replace, withThis);
            return s;
        }
        
        if($.isArray(vars)){
            for( var i = 0; i < vars.length; i++)
                str = repl(str, '{' + i + '}', vars[i])
        }
        else if($.isObject(vars)){
            for( var k in vars )
                str = repl(str, '{' + k + '}', vars[k])
        }
        return str;
    },
    
    /**
    * Will commify the number. 10000 becomes 10,000.
    **/
    commifyNumber: function(num, roundDigits){
       
        //will round the int if possible
        if(roundDigits){
            var factor = Math.pow(10, roundDigits);
            num = parseInt(Math.round(Math.round(num / factor) * factor));
        }
        
        num = ''+num;
        var vals = num.split('.');
        var whole = vals[0];
        
        var part = null;
        if(vals.length > 1)
            part = vals[1];
        
        var neg = num[0] == '-';
        whole = whole.replace('-', '');
        
        var result = '';
        
        whole = whole.split('').reverse();
       
        for(var i = 0; i < whole.length; i++){
            if( i != 0 && i%3 == 0 )
                result = ',' + result;
            result = whole[i] + result;
        }
       
        if(part)
            result += '.'+part;
       
        if(neg)
            result = '-' + result;
        
        return result;
    },
    
    /**
     * Taken from www.eyecon.ro date picker under MIT. Thanks Stefan Petre.
     *
     * Modified by bogle.
     **/
    parseDate: function(date, format){
        if (!date) return null;
        if (date.constructor == Date || $.isNumber(date))
            return new Date(date);
        if (!$.isString(date) || !format) return null;
        
        var parts = date.split(/\W+/);
        var against = format.split(/\W+/), d, m, y, h, min, now = new Date();
        for (var i = 0; i < parts.length; i++) {
            switch (against[i]) {
                case 'd':
                case 'e':
                    d = parseInt(parts[i],10);
                    break;
                case 'm':
                    m = parseInt(parts[i], 10)-1;
                    break;
                case 'Y':
                case 'y':
                    y = parseInt(parts[i], 10);
                    y += y > 100 ? 0 : (y < 29 ? 2000 : 1900);
                    break;
                case 'H':
                case 'I':
                case 'k':
                case 'l':
                    h = parseInt(parts[i], 10);
                    break;
                case 'P':
                case 'p':
                    if (/pm/i.test(parts[i]) && h < 12) {
                        h += 12;
                    } else if (/am/i.test(parts[i]) && h >= 12) {
                        h -= 12;
                    }
                    break;
                case 'M':
                    min = parseInt(parts[i], 10);
                    break;
            }
        }
        return new Date(
            y === undefined ? now.getFullYear() : y,
            m === undefined ? now.getMonth() : m,
            d === undefined ? now.getDate() : d,
            h === undefined ? 0 : h,
            min === undefined ? 0 : min,
            0
        );
    },
    
    /**
     * Taken from www.eyecon.ro date picker under MIT. Thanks Stefan Petre.
     **/
    formatDate: function(date, format) {
        var m = date.getMonth();
        var d = date.getDate();
        var y = date.getFullYear();
        var w = date.getDay();
        var s = {};
        var hr = date.getHours();
        var pm = (hr >= 12);
        var ir = (pm) ? (hr - 12) : hr;
        if (ir == 0) ir = 12;
        var min = date.getMinutes();
        var sec = date.getSeconds();
        var parts = format.split(''), part;
        for ( var i = 0; i < parts.length; i++ ) {
            part = parts[i];
            switch (parts[i]) {
                case 'a': //day name short
                    part = Q.daysShort[w];
                    break;
                case 'A': //day name long
                    part = Q.days[w];
                    break;
                case 'b': //month name short
                    part = Q.monthsShort[m];
                    break;
                case 'B': //month name long
                    part = Q.months[m];
                    break;
                case 'C': // century
                    part = 1 + Math.floor(y / 100);
                    break;
                case 'd': //zero padded day
                    part = $.zeroPad(d, 2);
                    break;
                case 'e': // non zero padded day
                    part = d;
                    break;
                case 'H': // zero padded 24-hour hour
                    part = $.zeroPad(hr, 2);
                    break;
                case 'I': // zero padded 12 hour hour
                    part = $.zeroPad(ir, 2);
                    break;
                case 'j': //zero padded day of the year
                    var now = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
					var then = new Date(date.getFullYear(), 0, 0, 0, 0, 0);
					var time = now - then;
					var dy = Math.floor(time / (24*60*60*1000));
                    part = $.zeroPad(dy, 3);
                    break;
                case 'k': // non zero padded 24-hour hour
                    part = hr;
                    break;
                case 'l': // non zero padded 12-hour hour
                    part = ir;
                    break;
                case 'm': //zero padded month 
                    part = $.zeroPad((1+m), 2);
                    break;
                case 'M': //zero padded min
                    part = $.zeroPad(min, 2);
                    break;
                case 'p': //am pm lower
                    part = pm ? "pm" : "am";
                    break;
                case 'P': //am pm upper
                    part = pm ? "PM" : "AM";
                    break;
                case 's': //seconds from epoch
                    part = Math.floor(date.getTime() / 1000);
                    break;
                case 'S': // seconds zero padded
                    part = $.zeroPad(sec, 2);
                    break;
                case 'u': // day of week index + 1
                    part = w + 1;
                    break;
                case 'w': // day of week number (index)
                    part = w;
                    break;
                case 'y': // year (2 digit)
                    part = ('' + y).substr(2, 2);
                    break;
                case 'Y': // 4 digit year
                    part = y;
                    break;
            }
            parts[i] = part;
        }
        return parts.join('');
    },
    
    /***
     ***** URL manipulation functions
     ***/
    
    /**
     * Takes a url, with or without params in string form, and a params dict.
     * will merge the two params together and return a new url string.
     **/
    extendUrl: function(wholeUrl, params){
        var paramStart = wholeUrl.indexOf('?');
        var url = wholeUrl;
        var oldParams = '';
        if(paramStart > -1){
            url = wholeUrl.substring(0, paramStart);
            oldParams = wholeUrl.substring(paramStart);
        }
        
        return url + '?' + $.serializeUrlParams($.extend($.parseUrlParams(oldParams), params));
    },
    
    serializeUrlParams: function(dataDict){
        return $.param(dataDict);
    },
    
    parseUrlParams: function(q){
        if(!q) return {};
        var paramStart = q.indexOf('?');
        if(paramStart > -1)
            q = q.substring(paramStart+1);
        
        var reg = /(?:^|&)([^&=]*)=?([^&]*)/g;
        
        var dataDict = {};
        
        q.replace( reg, function ( match, key, val ) {
            if (match)
                dataDict[key] = val;
        });
        
        return dataDict;
    },
    
    redirect: function(url){
        window.location.replace(url);
    },
    
    reload: function(){
        window.location.reload();
    }
});

$.extend(Q, {
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    daysMin: ["S", "M", "T", "W", "T", "F", "S", "S"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

/**
 * control char keycodes. Useful, I promise!
 **/
Q.controlChars = [
    8, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 46
];

//These are called (when specified) on data that comes back from the server.
Q.DataInterpreters = {
    
	dateParseFormat: 'm.d.Y H:M',
    datetimeFormat: 'b e, Y H:M',
    dateFormat: 'b e, Y',
    
    _parseInterpreter: function(interp){
        var re = /([A-Za-z_]+)(\(([0-9]+)\))?/;
        var res = {};
        var r = re.exec(interp);
        res.fn = r[1];
        res.num = r[3] ? parseInt(r[3]) : null;
        return res;
    },
    
    get: function(fn, val){
        var DI = Q.DataInterpreters;
        var res = DI._parseInterpreter(fn);
        
        if(res.fn in DI){
            var params = [val];
            if(res.num) params.push(res.num);
            
            return DI[res.fn].apply(this, params);
        }
        return val;
    },
    
	number: function(data){
        if($.isString(data)) return data;
		return !data ? '0' : $.commifyNumber(parseInt(data));
	},
    
    decimal: function(data, decimals){
        if($.isString(data)) return data;
		return !data ? '0' : $.commifyNumber($.round(data, decimals == undefined ? 4 : decimals) + '');
	},
    
	percent: function(data, decimals){return Q.DataInterpreters.decimal(data, decimals) + '%';},
	
	dollar: function(data){
        if($.isString(data)) return data;
		return !data ? '$0.00' : '$' + Q.DataInterpreters.decimal(data, 2);
	},
	
	date: function(data){
		if(!data)
			return 'N/A';
        
		var date = $.parseDate(data, Q.DataInterpreters.dateParseFormat);
		
		return $.formatDate(date, Q.DataInterpreters.dateFormat);
	},
    
    datetime: function(data){
		if(!data)
			return 'N/A';
        
		var date = $.parseDate(data, Q.DataInterpreters.dateParseFormat);
		
		return $.formatDate(date, Q.DataInterpreters.datetimeFormat);
	},
	
	bool: function(data){
		return data ? 'Yes' : 'No';
	},
    
    checkbox: function(data){
        return '<input class="checkbox" type="checkbox" '+ (data ? 'checked="checked"' : '') +'/>';
    }
};

//end no conflict
})(jQuery);
//

