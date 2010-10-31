
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
    
    var oldServerHandle = Q.handleServerError;
    var oldAppErrorHandle = Q.handleApplicationErrors;
    function tear(){
        Q.handleServerError = oldServerHandle;
        Q.handleApplicationErrors = oldAppErrorHandle;
        Q.asyncErrors.clear();
    }
    
    test('asyncErrors', function(){
        
        equals(len(Q.asyncErrors.fieldErrors), 0);
        equals(Q.asyncErrors.errors.length, 0);
        
        var err = [{field: 'last_name', message: 'Wrong last name'}, {code: 123, message: 'general error'}];
        Q.asyncErrors.add(err);
        
        equals(len(Q.asyncErrors.fieldErrors), 1);
        equals(Q.asyncErrors.errors.length, 2);
        same(Q.asyncErrors.fieldErrors, {'last_name': {message: 'Wrong last name', val: 'bob',
             original: err[0]
        }});
        
        //make sure it clears 
        err = [{field: 'first_name', message: 'Wrong FIRST name'}];
        Q.asyncErrors.add(err);
        
        //should grab the current value of the element
        equals(len(Q.asyncErrors.fieldErrors), 1);
        same(Q.asyncErrors.fieldErrors, {'first_name': {message: 'Wrong FIRST name', val: 'jim',
             original: err[0]
        }});
        
        err = Q.asyncErrors.getUnhandledErrors();
        equals(err.length, 3);
        
        Q.asyncErrors.handle(err[0]);
        err = Q.asyncErrors.getUnhandledErrors();
        equals(err.length, 2);
        
        Q.asyncErrors.handle(err);
        err = Q.asyncErrors.getUnhandledErrors();
        equals(err.length, 0);
        
        tear();
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
        
        tear();
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
            tear();
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
            tear();
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
        expect(11);
        
        var url = 'data/app_error.php';
        
        Q.handleApplicationErrors = function(errors){
            ok(true, 'Q.handleApplicationErrors');
            equals(errors.length, 3, 'one un handled error');
            tear();
            start();
        };
        
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
            equals(errors.general.length, 1, 'has general errors');
            equals(errors.field.length, 2, 'has field errors');
            equals(Q.asyncErrors.errors.length, 3, 'has all errors in global error repo');
            equals(Q.asyncErrors.getUnhandledErrors().length, 3, 'has one unhandled error');
            equals(len(Q.asyncErrors.fieldErrors), 2, 'errors made it into the validation construct');
            ok('last_name' in Q.asyncErrors.fieldErrors, 'last name in errors');
            ok('first_name' in Q.asyncErrors.fieldErrors, 'firstname in errors');
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
        expect(11);
        
        var url = 'data/app_error_200.php';
        
        Q.handleApplicationErrors = function(errors){
            ok(true, 'Q.handleApplicationErrors');
            equals(errors.length, 3, 'one un handled error');
            tear();
        };
        
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
            equals(Q.asyncErrors.errors.length, 3, 'has all errors in global error repo');
            equals(Q.asyncErrors.getUnhandledErrors().length, 3, 'has one unhandled error');
            equals(len(Q.asyncErrors.fieldErrors), 2, 'errors made it into the validation construct');
            ok('last_name' in Q.asyncErrors.fieldErrors, 'last name in errors');
            ok('first_name' in Q.asyncErrors.fieldErrors, 'firstname in errors');
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