<?php
//This will create a 400 error
header('HTTP/1.0 400 Bad Request');
header('Content-type: application/json; charset=utf-8');
echo '{ "errors": [{"message": "this is a general error"},{"field": "first_name", "message": "first_name wrong"},{"field": "last_name", "message": "last_name bad"}] }';
?>