
;(function($){

$(document).ready(function(){
    
    var Q = $[$.QUAID];
    
    var core = $('#core-tests');
    
    module('Core');
    
    test('Basic Interitance', function(){
        var Meow = Class.extend({
            init: function(s){
                this.s = s;
            },
            noise: function(){
                return 'meow';
            }
        });
        
        var Rawr = Meow.extend({
            init: function(s){
                this._super(s);
            },
            noise: function(){
                return this._super() + '_rawr';
            }
        });
        
        var m = new Meow(123);
        var r = new Rawr(345);
        
        equals(m.s, 123);
        equals(m.noise(), 'meow');
        
        equals(r.s, 345);
        equals(r.noise(), 'meow_rawr');
    });
    
    var Meow = Class.extend('Meow', {
        foo: 'yeah!',
        init: function(container, settings){
            var defs = {
                one: 'one',
                two: 2
            };
            this._super(container, settings, defs);
        },
        noise: function(){
            return 'meow';
        }
    });
    
    test('Magic jQuery node function: null', function(){
        var div = $('#no-exist_');
        
        var obj = div.Meow({});
        
        equals(obj, null);
    });
    
    test('Magic jQuery node function: One object', function(){
        var div = $('<div/>', {id: 'my-div'});
        core.append(div);
        
        var obj = div.Meow({one: 1, three: 'three'});
        
        same(Meow, $[$.CLASS_NAMESPACE].Meow);
        
        equals(obj.foo, Meow.prototype.foo);
        equals(obj.settings.one, 1);
        equals(obj.settings.two, 2);
        equals(obj.settings.three, 'three');
        
        equals(obj.container[0].id, 'my-div');
        
        div.remove();
    });
    
    test('Magic jQuery node function: Multiple objects', function(){
        core.append($('<div/>', {id: 'my-div0'}));
        core.append($('<div/>', {id: 'my-div1'}));
        core.append($('<div/>', {id: 'my-div2'}));
        core.append($('<div/>', {id: 'my-div3'}));
        core.append($('<div/>', {id: 'my-div4'}));
        var divs = core.find('div');
        
        equals(divs.length, 5);
        
        var objs = divs.Meow({two: 'two'});
        
        equals(objs.length, 5);
        
        for(var i = 0; i < divs.length; i++){
            equals(objs[i].settings.two, 'two');
            equals(objs[i].container[0].id, 'my-div'+i);
        }
        
        divs.remove();
    });
    
    test('Dont allow multiple class definitions', function(){
        Q.Blah = Class.extend('Blah', {
            init: function(){}
        });
        
        try{
            Q.Blah = Class.extend('Blah', {
                init: function(){}
            });
            
            ok(false, 'should not allow multi-definitions');
        }
        catch(err){
            ok(true, 'does not allow multi-definitions');
        }
    });
    
    
    
    module('Log');
    
    test('Logging basics', function(){
        
        $.debug('Debug message');
        $.info('INFO!'); 
        $.warn('a warning');
        $.error('An error!');
        $.log('standard log');
        
        $.log.level = $.log.LEVEL_ORDER.indexOf($.log.ERROR);
        $.log('Should show this');
        $.debug('NOT THIS');
        $.info('NOT THIS'); 
        $.warn('NOT THIS');
        $.error('This');
        $.log('And this');
        
        $.log.level = 0;
    });
    
    test('Logging levels', function(){
        ok($.isFunction($.log), '$.log is there');
        ok($.isFunction($.error), '$.error is there');
        ok($.isFunction($.warn), '$.warn is there');
        ok($.isFunction($.info), '$.info is there');
        ok($.isFunction($.debug), '$.debug is there');
        
        function calledMap(){
            var cm = {};
            for(var i = 0; i < $.log.LEVEL_ORDER.length; i++)
                cm[$.log.LEVEL_ORDER[i]] = false;
            return cm;
        }
        
        var cm = calledMap();
        //monkey patch for our own (evil) devices. Muaahahahahahhaaaahahhahahah!
        $.log._specialLog = function(level, args){
            cm[level] = true;
        }
        
        $.log.level = 0;
        
        $.debug('.');
        $.info('.'); 
        $.warn('.');
        $.error('.');
        
        for(var i = 0; i < $.log.LEVEL_ORDER.length; i++)
            if($.log.LEVEL_ORDER[i] != $.log.LOG)
                equals(cm[$.log.LEVEL_ORDER[i]], true);
        
        cm = calledMap();
        $.log.level = $.log.LEVEL_ORDER.indexOf($.log.WARNING);
        
        $.debug('.');
        $.info('.'); 
        $.warn('.');
        $.error('.');
        
        equals(cm[$.log.LOG], false);
        equals(cm[$.log.DEBUG], false);
        equals(cm[$.log.INFO], false);
        equals(cm[$.log.WARNING], true);
        equals(cm[$.log.ERROR], true);
    });
    
    
    module('Util')
    
    test('isString', function(){
        equals($.isString('.'), true);
        equals($.isString(new String('asd')), true);
        equals($.isString({}), false);
        equals($.isString(2), false);
        equals($.isString([]), false);
    });
    
    test('isObject', function(){
        equals($.isObject('.'), false);
        equals($.isObject([]), false);
        equals($.isObject(new Date()), false);
        equals($.isObject(2), false);
        equals($.isObject({a:2}), true);
    });
    
    test('isNumber', function(){
        equals($.isNumber('.'), false);
        equals($.isNumber([]), false);
        equals($.isNumber(2), true);
        equals($.isNumber({a:2}), false);
    });
    
    test('round', function(){
        equals($.round(2.1666667, 2), 2.17);
        equals($.round(-4.33333, 2), -4.33);
        equals($.round(2, 2), 2);
    });
    
    test('pluralize', function(){
        equals($.pluralize(1, '{0} people', '{0} person', 'nobody'), '1 person');
        equals($.pluralize(4, '{0} people', '{0} person', 'nobody'), '4 people');
        equals($.pluralize(0, '{0} people', '{0} person', 'nobody'), 'nobody');
        equals($.pluralize(0, '{0} people', '{0} person'), '0 people');
    });
    
    test('andJoin', function(){
        equals($.andJoin([]), '');
        equals($.andJoin(['booty']), 'booty');
        equals($.andJoin(['things', 'stuff']), 'things and stuff');
        equals($.andJoin(['things', 'stuff', 'crap']), 'things, stuff and crap');
        equals($.andJoin(['things', 'stuff', 'crap', 'blah']), 'things, stuff, crap and blah');
    });
    
    test('replace', function(){
        equals($.replace('this is {0}! I said it: {0}! {1}', ['neat']), 'this is neat! I said it: neat! {1}');
        equals($.replace('this is {0}! I said it: {0}! {1}', ['neat', 'cool']), 'this is neat! I said it: neat! cool');
        equals($.replace('rawr {0} {1}', 4), 'rawr {0} {1}');
        equals($.replace('rawr {ok} {wow}', {ok: 'yeah'}), 'rawr yeah {wow}');
        equals($.replace('rawr {ok} {wow}', {ok: 'yeah', wow: 'rad'}), 'rawr yeah rad');
    });
    
    test('commifyNumber', function(){
        equals($.commifyNumber(0), '0');
        equals($.commifyNumber(10000), '10,000');
        equals($.commifyNumber(-110000), '-110,000');
        equals($.commifyNumber(1234567.567), '1,234,567.567');
        equals($.commifyNumber('50345'), '50,345');
        
        equals($.commifyNumber(123456, 2), '123,500');
        equals($.commifyNumber(123456, 0), '123,456');
        equals($.commifyNumber(123456, 5), '100,000');
    });
    
    test('parseDate', function(){
        equals($.parseDate(), null);
        equals($.parseDate({}, 'm-d-y'), null);
        
        same($.parseDate(new Date(1999,3,3)), new Date(1999,3,3));
        same($.parseDate('7.29.2007', 'm.d.Y'), new Date(2007,6,29));
        same($.parseDate('7.29.2007 14:34', 'm.d.Y H:M'), new Date(2007,6,29, 14, 34));
        same($.parseDate('7.29.2007 2:34 pm', 'm.d.Y H:M p'), new Date(2007,6,29, 14, 34));
        
        same($.parseDate('7.29.2007', 'm.d.Y H:M'), new Date(2007,6,29));
    });
    
    test('parseDate', function(){
        var format = 'a A b B C d e H I j k l m M p P s S u w y Y';
        var res = 'Sat Saturday Apr April 20 03 3 01 01 093 1 1 04 04 am AM 923130240 00 7 6 99 1999';
        same($.formatDate(new Date(1999,3,3,1,4), format), res);
        
        var res = 'Sun Sunday Jul July 21 27 27 16 04 207 16 4 07 50 pm PM 1059349800 00 1 0 03 2003';
        same($.formatDate(new Date(2003,6,27,16,50), format), res);
    });
    
    test('extendUrl', function(){
        equals($.extendUrl('http://somedom.com/wow/?this=that&omg=omg&wow=yeah', {omg: 'wow'}), 'http://somedom.com/wow/?this=that&omg=wow&wow=yeah');
        equals($.extendUrl('http://somedom.com/wow/?this=this', {'this':'that'}), 'http://somedom.com/wow/?this=that');
    });
    
    test('serializeUrlParams', function(){
        equals($.serializeUrlParams({'this': 'that', omg: 'omg', wow: 'yeah'}), 'this=that&omg=omg&wow=yeah');
        equals($.serializeUrlParams({}), '');
    });
    
    test('parseUrlParams', function(){
        same($.parseUrlParams('this=that&omg=omg&wow=yeah'), {'this': 'that', omg: 'omg', wow: 'yeah'});
        same($.parseUrlParams('?this=that&omg=omg&wow=yeah'), {'this': 'that', omg: 'omg', wow: 'yeah'});
        same($.parseUrlParams('http://something.com/?this=that&omg=omg&wow=yeah'), {'this': 'that', omg: 'omg', wow: 'yeah'});
        same($.parseUrlParams(''), {});
        same($.parseUrlParams(null), {});
    });
    
    
    module('DataInterpreters');
    
    var DI = Q.DataInterpreters;
    
    test('_parseInterpreter', function(){
        var res = DI._parseInterpreter('sOmething_good');
        equals(res.fn, 'sOmething_good');
        equals(res.num, null);
        
        res = DI._parseInterpreter('sOmething_g00d');
        equals(res.fn, 'sOmething_g');
        equals(res.num, null);
        
        res = DI._parseInterpreter('m(12)');
        equals(res.fn, 'm');
        equals(res.num, 12);
        
        res = DI._parseInterpreter('m(abc)');
        equals(res.fn, 'm');
        equals(res.num, null);
    });
    
    test('get', function(){
        var val = DI.get('decimal', 3.456789);
        equals(val, '3.4568');
        
        val = DI.get('decimal(1)', 3.456789);
        equals(val, '3.5');
    });
    
    test('number', function(){
        var val = DI.number(3.456789);
        equals(val, '3');
        
        val = DI.number(213456);
        equals(val, '213,456');
    });
    
    test('decimal', function(){
        var val = DI.decimal(3.456789, 2);
        equals(val, '3.46');
        
        val = DI.decimal(213456.34567, 3);
        equals(val, '213,456.346');
    });
    
    test('percent', function(){
        var val = DI.percent(0.2345, 2);
        equals(val, '0.23%');
        
        val = DI.percent(213456.34567, 3);
        equals(val, '213,456.346%');
    });
    
    test('dollar', function(){
        var val = DI.dollar(0.2345);
        equals(val, '$0.23');
        
        val = DI.dollar(213456.34567);
        equals(val, '$213,456.35');
    });
    
    test('bool', function(){
        var val = DI.bool(true);
        equals(val, 'Yes');
        
        val = DI.bool(0);
        equals(val, 'No');
        
        val = DI.bool(null);
        equals(val, 'No');
    });
    
    test('date', function(){
        var val = DI.date('7.23.2004');
        same(val, 'Jul 23, 2004');
        
        val = DI.date('12-31-2008');
        same(val, 'Dec 31, 2008');
        
        val = DI.date('12/32/2008');
        same(val, 'Jan 1, 2009');
        
        val = DI.date(new Date(2005, 10, 20, 2, 45));
        same(val, 'Nov 20, 2005');
        
        val = DI.date(2356778);
        same(val, 'Dec 31, 1969');
    });
    
    test('datetime', function(){
        var val = DI.datetime('7.23.2004');
        same(val, 'Jul 23, 2004 00:00');
        
        val = DI.datetime('12-31-2008');
        same(val, 'Dec 31, 2008 00:00');
        
        val = DI.datetime('12/32/2008');
        same(val, 'Jan 1, 2009 00:00');
        
        val = DI.datetime(new Date(2005, 10, 20, 2, 5));
        same(val, 'Nov 20, 2005 02:05');
        
        val = DI.datetime(2356778);
        same(val, 'Dec 31, 1969 16:39');
    });
});

})(jQuery);