
;(function($){

var Q = $[$.QUAID];

$(document).ready(function(){
    
    function len(d){
        var count = 0;
        for(var k in d) count++;
        return count;
    }
    
    var core = $('#core-tests');
    
    module('Validation');
    
    test('asyncErrors', function(){
        
        equals(len(Q.asyncErrors.errors), 0);
        
        var err = [{field: 'last_name', message: 'Wrong last name'}];
        Q.asyncErrors.add(err);
        
        equals(len(Q.asyncErrors.errors), 1);
        same(Q.asyncErrors.errors, {'last_name': {message: 'Wrong last name', val: 'bob'}});
        
        //make sure it clears 
        var err = [{field: 'first_name', message: 'Wrong FIRST name'}];
        Q.asyncErrors.add(err);
        
        //should grab the current value of the element
        equals(len(Q.asyncErrors.errors), 1);
        same(Q.asyncErrors.errors, {'first_name': {message: 'Wrong FIRST name', val: 'jim'}});
        
        Q.asyncErrors.clear();
        equals(len(Q.asyncErrors.errors), 0);
    });
    
    test('rule normalize', function(){
        //test rule normalization
        var opts = {
            rules:{
                omg: 'required',
                wowza: {required: true, whatev: false},
                rawr: {required: true, asyncError: false},
                whatev: {required: true, asyncError: true}
            }
        };
        
        var newOpts = Q.getValidationOptions(opts);
        
        same(newOpts, {
            rules: {
                omg: {required: true, asyncError: true},
                wowza: {required: true, whatev: false, asyncError: true},
                rawr: {required: true, asyncError: false},
                whatev: {required: true, asyncError: true}
            }
        });
    });
    test('$.ajax 500 errors', function(){
        expect(4);
        
        //test 500 errors
        var url = 'data/server_error.php';
        
        Q.handleServerError = function(){
            ok(true, 'Q.handleServerError');
        };
        function error(){
            ok(true, 'error');
            start();
        }
        function success(){
            ok(false, 'success');
        }
        function applicationError(){
            ok(true, 'applicationError');
        }
        
        stop();
        $.post(url, {}, success, 'json');
        $.ajax({
            type: 'POST',
            url: url,
            data: {},
            success: success,
            error: error,
            applicationError: applicationError,
            dataType: 'json'
        });
    });
    
    test('$.ajax 404 errors', function(){
        expect(2);
        
        //test 500 errors
        var url = 'data/not_found.php';
        
        Q.handleServerError = function(){
            ok(false, 'Q.handleServerError');
        };
        function error(){
            ok(true, 'error');
            start();
        }
        function success(){
            ok(false, 'success');
        }
        function applicationError(){
            ok(true, 'applicationError');
        }
        
        stop();
        $.ajax({
            type: 'POST',
            url: url,
            data: {},
            success: success,
            error: error,
            applicationError: applicationError,
            dataType: 'json'
        });
    });
    
    test('$.ajax 400 app errors', function(){
        
        var url = 'data/app_error.php';
        
        Q.handleServerError = function(){
            ok(false, 'Q.handleServerError');
        };
        function error(){
            ok(true, 'error should be called!');
        }
        function success(){
            ok(false, 'success');
        }
        function applicationError(type, errors){
            ok(true, 'applicationError');
            equals(type, 'applicationerror');
            equals(errors.general.length, 1, 'has general errors');
            equals(errors.field.length, 2, 'has field errors');
            equals(len(Q.asyncErrors.errors), 2, 'errors made it into the validation construct');
            ok('last_name' in Q.asyncErrors.errors, 'last name in errors');
            ok('first_name' in Q.asyncErrors.errors, 'firstname in errors');
            start();
        }
        
        stop();
        $.ajax({
            type: 'POST',
            url: url,
            data: {},
            success: success,
            error: error,
            applicationError: applicationError,
            dataType: 'json'
        });
    });
    
    test('$.ajax 200 app errors', function(){
        
        var url = 'data/app_error_200.php';
        
        Q.handleServerError = function(){
            ok(false, 'Q.handleServerError');
        };
        function error(){
            ok(false, 'error');
        }
        function success(){
            ok(false, 'success');
        }
        function applicationError(type, errors){
            ok(true, 'applicationError');
            equals(type, 'applicationerror');
            $.log(errors);
            equals(errors.general.length, 1, 'has general errors');
            equals(errors.field.length, 2, 'has field errors');
            equals(len(Q.asyncErrors.errors), 2, 'errors made it into the validation construct');
            ok('last_name' in Q.asyncErrors.errors, 'last name in errors');
            ok('first_name' in Q.asyncErrors.errors, 'firstname in errors');
            start();
        }
        
        stop();
        $.ajax({
            type: 'POST',
            url: url,
            data: {},
            success: success,
            error: error,
            applicationError: applicationError,
            dataType: 'json'
        });
    });
});

})(jQuery);