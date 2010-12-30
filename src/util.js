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

$.extend($, /** @lends $ */{
    
    /** <p>Is thing a string?</p> */
    isString: function(thing){
        return typeof thing == "string" || thing instanceof String;
    },
    
    /** <p>Is thing a number?</p> */
    isNumber: function(thing){
        return typeof thing == "number";
    },
    
    /** <p>Is thing a vanilla object?</p> */
    isObject: function(thing){
        return !$.isString(thing) && !$.isArray(thing) && ! (thing instanceof Date) && thing instanceof Object;
    },
    
    /**
     * <p>Will get a jQuery object from method. This is useful for plugins that pass in
     * elements as options. You can call this with your this context, and it will get passed to
     * the user's function if method is a function.</p>
     * @param method Can be a string, jquery object, or a function that returns a jquery object.
     **/
    getjQueryObject: function(method){
        if(!method)
            return null;
        
        if(method.jquery)
            return method;
        
        else if($.isString(method))
            return $(method);
        
        else if($.isFunction(method))
            return method.call(this);
        
        return null;
    },
    
    /**
     * <p>Will round a number to a certain number of decimal places.</p>
     * @param num Your number to round
     * @param rlength The number of decimals to round to.
     */
    round: function(num, rlength){
        return Math.round(num*Math.pow(10,rlength))/Math.pow(10,rlength);
    },
    
    /**
     * <p>Will zero pad a number to keep a certain number of minimum digits.
     * i.e. zero padding 234 to 5 digits would result in 00234</p>
     * @param num Your number to pad
     * @param rlength The number of min digits
     * @returns a string with the zero padded number
     */
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
     * <p>returns the proper string for the number given.
     * i.e. pluralize(1, '{0} people', 'one person', 'no people :(')
     * would return 'one person'</p>
     * 
     * <p>{0} is replaced with the number, always, even in the one case.</p>
     *
     * @param num number of things to be described
     * @param ifmany verbage for more than 1 item
     * @param ifone verbage for 1 item
     * @param ifzero (optional) if not will use ifmany.
     **/
    pluralize: function(num, ifmany, ifone, ifzero){
        var str = ifmany;
       
        if(num == 1)
            str = ifone;
        else if(num == 0 && $.isString(ifzero))
            str = ifzero;
       
        return str.replace('{0}', num);
    },
    
    /**
     * <p>Joins a list of string with commas and an 'and' between the last 2 elements.
     * i.e. $.andJoin([2, 3, 5]) => '2, 3 and 5'</p>
     *
     * @param list a list of things to be joined
     * @returns an and joined string
     **/
    andJoin: function(strings){
        if(strings.length == 0)
            return '';
        if(strings.length == 1)
            return strings[0];
       
        return strings.slice(0, strings.length-1).join(', ') + ' and ' + strings[strings.length - 1];
    },
    
    /**
     * <p>Sort of string interpolation.</p>
     * <pre class="code">
     * replace('/blah/{0}/apsd/{1}', ['wow', 'omg']); // returns '/blah/wow/apsd/omg'
     * replace('/blah/{bar}/apsd/{foo}', {foo: 'wow', bar: 'omg'}); // returns '/blah/omg/apsd/wow'
     * </pre>
     * @param str the string to replace
     * @param vars the vars to put into the string in either list or dict form
     * @returns a str with the variables contained in vars replaced
     **/
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
     * <p>Will commify the number. 10000 becomes 10,000.</p>
     * 
     * @param num the number
     * @param roundDigits (optional) will make commifyNumber round the integer. i.e.
     *   12345 with roundDigits == 2 would net 12,300
     * @returns a commified number
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
     * <p>Will parse a string date into a Date object.</p>
     * <p>From www.eyecon.ro date picker under MIT. Thanks Stefan Petre.</p>
     * 
     * @param date the string date
     * @param format
     * @returns a Date object
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
     * <p>Will format a Date object into a string.</p>
     * <p>From www.eyecon.ro date picker under MIT. Thanks Stefan Petre.</p>
     * 
     * @param date the Date object
     * @param format
     * @returns a string date
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
     * <p>Takes a url, with or without params in string form, and a params dict.
     * will merge the two params together and return a new url string.</p>
     * 
     * @param wholeUrl the entire url (or just the query string)
     * @param params an object with the stuff you want to override
     * @returns a new URL
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
    
    /**
     * <p>Converts an object to a url query string. Synonym for jQuery's builtin $.param().</p>
     * 
     * @param dataDict an object with your query string options.
     * @returns a query string
     **/
    serializeUrlParams: function(dataDict){
        return $.param(dataDict);
    },
    
    /**
     * <p>Parses out the params from a query string. Deserialization.</p>
     * 
     * @param q the query string (or whole url) from which you wish to extract params.
     * @returns a object containing the url's params
     **/
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
    
    /**
     * <p>Redirect to some other url. Nothing fancy.</p>
     **/
    redirect: function(url, history){
        if(history == false)
            window.location.replace(url);
        else{
            //a form adds the current page to the history
            var form = $('<form/>', {
                action: url,
                method: 'get',
                html: '&nbsp;'
            });
            $('body').append(form);
            
            if(url.indexOf('?') > -1){
                var p = $.parseUrlParams(url);
                for(var k in p){
                    form.append($('<input/>', {
                        type: 'hidden',
                        name: k,
                        value: p[k]
                    }));
                }
            }
            
            form.submit().hide();
        }
    },
    
    /**
     * <p>Reload the current page.</p>
     **/
    reload: function(){
        window.location.reload();
    }
});

$.extend(Q, /** @lends Q */{
    /** <p>Long form day string list starting from 'Sunday' and ending with 'Sunday'</p> */
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    
    /** <p>Short form day string list starting from 'Sun' and ending with 'Sun'</p> */
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    
    /** <p>First letter of day starting with 'S' for sunday and ending with sunday's 'S'</p> */
    daysMin: ["S", "M", "T", "W", "T", "F", "S", "S"],
    
    /** <p>Long form month string list starting with 'January'</p> */
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    
    /** <p>Short form month string list starting with 'Jan'</p> */
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

/**
 * <p>A list of the integer keycodes for non-printable control characters.</p>
 */
Q.controlChars = [
    8, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 46
];

/**
 * @namespace
 * <p>Functions for formatting data into something a human might like to look at.</p>
 * <p>These are useful to invoke on data that comes back from the server.</p>
 */
Q.DataFormatters = {
    
    /** <p>The parse format for the date() and datetime() formatter.</p> */
    dateParseFormat: 'm.d.Y H:M',
    /** <p>The output format for the datetime() formatter.</p> */
    datetimeFormat: 'b e, Y H:M',
    /** <p>The output format for the date() formatter.</p> */
    dateFormat: 'b e, Y',
    
    /**
     * <p>Will parse a string like 'decimal(3)' into a dict like {fn:'decimal', num:3}.
     * This is used by the get() function. This format is useful for plugins that need to
     * use the data formatters as an option. i.e. lets pretend you are writing a table
     * plugin. The plugin user could specify formatters for each column like so:</p>
     *
     * <pre class="code">
     * var tableOptions = {
     *     columnFormats: {
     *         num_column: 'number',
     *         other_column: 'percent(4)',
     *         decimal_column: 'decimal(2)',
     *     }
     * };
     * </pre>
     *
     * @param interp a string like 'decimal(2)'
     * @returns an object like {fn:'decimal', num:3}
     */
    _parseInterpreter: function(interp){
        var re = /([A-Za-z_]+)(\(([0-9]+)\))?/;
        var res = {};
        var r = re.exec(interp);
        res.fn = r[1];
        res.num = r[3] ? parseInt(r[3]) : null;
        return res;
    },
    
    /**
     * <p>Takes a string and a raw value. Will call _parseInterpreter() on the string and call
     * the resulting formatter with the passed in raw value as a parameter. i.e.</p>
     *
     * <pre class="code">
     * var DF = Q.DataFormatters;
     * DF.get('decimal(2)', 1.234545); //will call DF.decimal(1.234545, 2); resulting in '1.23'
     * DF.get('number', 12345); //will call DF.number(12345); resulting in '12,345'
     * </pre>
     *
     * @param fn a string containing a name of one of the formatters i.e. 'number'
     * @param val the raw value to format
     *
     * @returns the result of the formatter call if the formatter can be found.
     * The raw value if the formatter cannot be found.
     */
    get: function(fn, val){
        var DI = Q.DataFormatters;
        var res = DI._parseInterpreter(fn);
        
        if(res.fn in DI){
            var params = [val];
            if(res.num) params.push(res.num);
            
            return DI[res.fn].apply(this, params);
        }
        return val;
    },
    
    /**
     * <p>Commifies a number.</p>
     * @param data the raw value
     * @returns a string of a commified number
     */
    number: function(data){
        if($.isString(data)) return data;
        return !data ? '0' : $.commifyNumber(parseInt(data));
    },
    
    /**
     * <p>Commifies and rounds a decimal number.</p>
     * @param data the raw value
     * @param decimals the number of decmals to round to
     * @returns a string of a commified number with rounded decimals. i.e. 11234.23456 -> '11,234.23'
     */
    decimal: function(data, decimals){
        if($.isString(data)) return data;
        var d = !data ? '0' : $.commifyNumber($.round(data, decimals == undefined ? 4 : decimals) + '');
        
        var dec = d.indexOf('.');
        if(decimals > 0){
            var num = decimals;
            if(dec > -1)
                num = Math.max(0, decimals - (d.length-1-dec));
            else
                d += '.';
            
            d = d + $.zeroPad('', num);
        }
        
        return d;
    },
    
    /**
     * <p>Commifies and rounds a decimal number. Adds a percent sign.</p>
     * @param data the raw value
     * @param decimals the number of decmals to round to
     * @returns a string of a commified number with rounded decimals. i.e. 2.23456 -> '2.23%'
     */
    percent: function(data, decimals){return Q.DataFormatters.decimal(data, decimals) + '%';},
    
    /**
     * <p>Commifies and rounds a decimal number, rounds to 2 places, prepends a $.</p>
     * @param data the raw value
     * @returns a string of a commified number with rounded decimals. i.e. 1232.23456 -> '$1,232.23'
     */
    dollar: function(data){
        if($.isString(data)) return data;
        return !data ? '$0.00' : '$' + Q.DataFormatters.decimal(data, 2);
    },
    
    /**
     * <p>Parses a date and converts it to another date format. Maybe your server returs dates in
     * '3-23-10' and you want it to show as 'Mar 23, 2010'. Will parse the input string with
     * Q.DataFormats.dateParseFormat and output in Q.DataFormats.dateFormat.</p>
     * @param data A date string or Date object.
     * @returns a string date
     */
    date: function(data){
        if(!data)
            return 'N/A';
        
        var date = $.parseDate(data, Q.DataFormatters.dateParseFormat);
        
        return $.formatDate(date, Q.DataFormatters.dateFormat);
    },
    
    /**
     * <p>Parses a date and converts it to another date format. Maybe your server returs dates in
     * '3-23-10 19:45' and you want it to show as 'Mar 23, 2010 19:45'. Will parse the input string with
     * Q.DataFormats.dateParseFormat and output in Q.DataFormats.datetimeFormat.</p>
     * @param data A date time string or Date object.
     * @returns a string date
     */
    datetime: function(data){
        if(!data)
            return 'N/A';
        
        var date = $.parseDate(data, Q.DataFormatters.dateParseFormat);
        
        return $.formatDate(date, Q.DataFormatters.datetimeFormat);
    },
    
    /**
     * <p>Takes a boolean returns a 'Yes' or a 'No'.</p>
     * @param data a bool
     * @returns a string 
     */
    bool: function(data){
        return data ? 'Yes' : 'No';
    },
    
    /**
     * <p>Takes a boolean returns a checkbox html string.</p>
     * @param data a bool
     * @returns a string 
     */
    checkbox: function(data){
        return '<input class="checkbox" type="checkbox" '+ (data ? 'checked="checked"' : '') +'/>';
    }
};

//end no conflict
})(jQuery);
//

