<?php
//This will create a 500 error
header('HTTP/1.0 500 Server Error');
header('Content-type: application/json; charset=utf-8');
echo '{ "status": "fail" }';
?>