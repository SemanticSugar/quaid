<?php
//This will create a 400 error
header('HTTP/1.0 400 Bad Request');
header('Content-type: application/json; charset=utf-8');
$errs = array();
foreach ($_POST as $key => $value)
   $errs[] = '{"field": "'.$key.'", "message": "'.$key.' is wrong"}';
echo '{ "errors": ['.join(',', $errs).'] }';
?>