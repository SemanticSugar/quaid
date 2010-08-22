
;(function($){

var Q = $[$.QUAID];

$(document).ready(function(){
    
    var img = 'img/16x16_arrows.gif';
    
    module('Widget');
    
    var div = null;
    
    function setup(params){
        params = params || {};
        div = $('<div/>', params);
        $('body').append(div);
    }
    
    function tear(){
        if(div)
            div.remove();
    }
    
    test('Loader', function(){
        setup();
        
        var l = div.Loader({
            image: img
        });
        
        //lazy load this thing...
        equals(l.loader, undefined);
        equals(l.isLoading(), false);
        equals(l.loadingCount, 0);
        
        l.startLoading();
        ok(l.loader, 'Loader is a real object!');
        equals(l.isLoading(), true);
        equals(l.loadingCount, 1);
        
        l.startLoading();
        equals(l.loadingCount, 2);
        equals(l.isLoading(), true);
        
        l.stopLoading();
        equals(l.loadingCount, 1);
        equals(l.isLoading(), true);
        
        l.stopLoading();
        equals(l.loadingCount, 0);
        equals(l.isLoading(), false);
        
        //again for safe measure
        l.stopLoading();
        equals(l.loadingCount, 0);
        equals(l.isLoading(), false);
        
        equals(div.css('position'), 'relative');
        
        tear();
    });
    
    test('Loader positioned', function(){
        setup({style : 'position: absolute; width: 300px; height: 250px; border: 1px solid #ccc;'});
        
        var l = div.Loader({
            image: img,
            location: 'center'
        });
        
        l.startLoading();
        
        //make sure it keeps the position def
        equals(div.css('position'), 'absolute');
        
        //lets leave it up to make sure the mofo is in the center.
        //tear();
    });
    
    test('AsyncLoader', function(){
        expect(6);
        setup();
        
        var l = div.AsyncLoader({
            image: img,
            onPostLoad: function(){
                equals(l.isLoading(), false);
                start();
            }
        });
        
        equals(l.isLoading(), false);
        equals(l.load(), false);
        equals(l.isLoading(), false);
        
        stop();
        l.load('data/json.php', {something: 'yeah'}, function(data){
            ok(data, 'success fn called with data!');
        }, function(){
            ok(false, 'fail not ok...')
        });
        equals(l.isLoading(), true);
        
        tear();
    });
    
    test('AsyncLoader only url', function(){
        setup();
        
        var l = div.AsyncLoader({
            image: img,
            onPostLoad: function(){
                equals(l.isLoading(), false);
                start();
            }
        });
        
        stop();
        l.load('data/json.php');
        equals(l.isLoading(), true);
        
        tear();
    });
    
    test('AsyncLoader failure', function(){
        expect(4);
        setup();
        
        var l = div.AsyncLoader({
            image: img,
            onPostLoad: function(){
                equals(l.isLoading(), false);
                start();
            }
        });
        
        stop();
        l.load('data/app_error.php', {something: 'yeah'}, function(data){
            ok(false, 'success bad');
        }, function(errtype, errors){
            equals(errtype, 'applicationerror');
            ok(errors);
        });
        equals(l.isLoading(), true);
        
        tear();
    });
    
    test('SingleResourceAsyncLoader params', function(){
        expect(3);
        setup();
        
        var l = div.SingleResourceAsyncLoader({
            image: img,
            onPostLoad: function(){
                equals(l.isLoading(), false, "should not be loading anymore");
                start();
            },
            url: 'data/json.php',
            onSuccess: function(data){
                ok(data.results.slow, 'was the last async call?');
            },
            onFail: function(errtype, errors){
                ok(false, 'shouldnt fail');
            }
        });
        
        stop();
        l.load({slow: '1'});
        l.load();
        equals(l.isLoading(), true, 'load called 3 times, is loading...');
        
        tear();
    });
    
    test('SingleResourceAsyncLoader abort requests', function(){
        expect(3);
        setup();
        
        var l = div.SingleResourceAsyncLoader({
            image: img,
            onPostLoad: function(){
                //yeah, this is slow. But if someone screwes up and doesnt abort the requests,
                //the slow ones will not be captured here.
                setTimeout(function(){
                    equals(l.isLoading(), false, "should not be loading anymore");
                    start();
                }, 1200);
            },
            url: 'data/json.php',
            onSuccess: function(data){
                $.log(data);
                ok(! data.results.slow, 'was the last async call?');
            },
            onFail: function(errtype, errors){
                ok(false, 'shouldnt fail');
            }
        });
        
        stop();
        l.load({slow: '1'});
        l.load({slow: '1'});
        l.load({});
        equals(l.isLoading(), true, 'load called 3 times, is loading...');
        
        tear();
    });
});

})(jQuery);