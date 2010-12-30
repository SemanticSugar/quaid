<?php
header('HTTP/1.0 200 OK');
header('Content-type: application/json; charset=utf-8');
$errs = array();
foreach ($_POST as $key => $value)
   $errs[] = '{"field": "'.$key.'", "message": "'.$key.' is OK!"}';
echo '{ "results": ['.join(',', $errs).'] }';
?>