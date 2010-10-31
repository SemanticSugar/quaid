
;(function($){

var Q = $[$.QUAID];

$(document).ready(function(){
    
    //'int' not defined in here...
    var def = {
        text: 'text',
        decimal: '2.3',
        area: 'some text here',
        select: 'option2',
        checkbox1: false,
        checkbox2: true,
        radio: 'val3'
    };
    
    var core = $('#core-tests');
    
    function tear(){
        $('#form').data('Form', null);
        $('#form form').data('Form', null);
        
        $('#form-form').unbind();
        $.data($('#form-form')[0], 'validator', null);
        
        $('#form').data('AsyncForm', null);
        $('#form form').data('AsyncForm', null);
        
        Q.asyncErrors.clear();
    }
    
    module('Form');
    
    
    test('Form class doesnt have to be form...', function(){
        var f = $('#form').Form();
        equals(f.form[0].id, $('#form form')[0].id);
        var f = $('#form form').Form();
        equals(f.form[0].id, 'form-form');
        tear();
    });
    
    test('Form defaults no initial load', function(){
        var f = $('#form').Form({
            defaultData: def,
            resetInitially: false
        });
        
        equals(f.val('text'), 'omg');
        tear();
    });
    
    test('Form defaults load them', function(){
        var f = $('#form').Form({
            defaultData: def,
            resetInitially: true
        });
        
        for(var k in def){
            equals(f.val(k), def[k]);
        }
        equals(f.val('int'), '');
        
        tear();
    });
    
    test('Form.load()', function(){
        expect(5);
        
        var data = {
            text: 'omg wow!',
            area: '42',
            checkbox1: true
        };
        
        var f = $('#form').Form({
            defaultData: def,
            resetInitially: true,
            onLoad: function(d){
                ok(this);
                same(d, data);
            }
        });
        
        f.load(data);
        
        for(var k in data){
            equals(f.val(k), data[k]);
        }
        
        tear();
    });
    
    test('Form validation', function(){
        expect(4);
        
        var valid = {
            rules: {
                text: {required: true},
                area: 'required'
            }
        };
        
        var f = $('#form').Form({
            validationOptions: valid
        });
        
        f.val('text', '');
        f.val('area', '');
        
        f.submit();
        
        equals(f.val('text'), '');
        equals(f.val('area'), '');
        ok(f.getElement('text').hasClass('error'));
        ok(f.getElement('area').hasClass('error'));
        
        tear();
    });
    
    test('Form dataTypes', function(){
        
        var f = $('#form').Form({
            dataTypes: {
                'int': 'int',
                'decimal': 'decimal'
            }
        });
        
        ok(f.getElement('int').data('IntBox').TYPE, 'IntBox');
        ok(f.getElement('decimal').data('DecimalBox').TYPE, 'DecimalBox');
        
        tear();
    });
    
    test('AsyncForm success', function(){
        expect(3);
        
        var f = $('#form').AsyncForm({
            validationOptions: {
                rules:{text: 'required'}
            },
            onSuccess: function(data){
                equals(this.TYPE, 'AsyncForm');
                same(data, {
                    results: {"lang": "en", "length": 25}
                });
                start();
            }
        });
        
        //fail first
        f.val('text', '');
        f.submit();
        ok(f.getElement('text').hasClass('error'));
        
        //succeed
        f.val('text', 'asdasd');
        stop();
        f.submit();
        
        tear();
    });
    
    test('AsyncForm fail', function(){
        expect(2);
        
        var f = $('#form').AsyncForm({
            validationOptions: {
                rules:{text: 'required'}
            },
            onSuccess: function(){
                ok(false, 'success bad!')
            },
            onFail: function(){
                equals(this.TYPE, 'AsyncForm');
                start();
            }
        });
        
        $('#form-form').attr('action', 'data/app_error.php');
        
        //fail from server
        f.val('text', 'asdasd');
        stop();
        f.submit();
        ok(f.loader.isLoading(), 'the loader is working!');
        
        tear();
    });
});

})(jQuery);