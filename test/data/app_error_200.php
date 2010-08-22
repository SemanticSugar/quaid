<?php
//This will create a 200 with an error cond
header('Content-type: application/json; charset=utf-8');
echo '{ "status": "fail", "errors": [{"message": "this is a general error"},{"field": "first_name", "message": "first_name wrong"},{"field": "last_name", "message": "last_name bad"}] }';
?>