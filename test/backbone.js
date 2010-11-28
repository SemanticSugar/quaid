
;(function($){

$(document).ready(function(){
    
    var Q = $[$.QUAID];
    
    var core = $('#core-tests');
    
    module('Backbone');
    
    test('Basic Interitance', function(){
        var v = new Q.View({id: 1234});
        ok(v.el);
        ok(v.container.jquery);
        same(v.settings, {id: 1234})
        equals(v.id, 1234);
        $.log('v', v);
        
        var v2 = core.View({id: 2345});
        equals(v2.id, 2345);
        equals(v2.el[0].id, 'core-tests');
        equals(v2.container[0].id, 'core-tests');
        $.log('v2', v2);
    });
    
    
});

})(jQuery);