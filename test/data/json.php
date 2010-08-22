<?php
error_reporting(0);
header('Content-type: application/json; charset=utf-8');

if($_POST['slow'] == '1'){
    sleep(1);
    echo '{ "status": "success", "results": {"slow": true, "message": "This data was slow to get"} }';
}
else{
    echo '{ "status": "success", "results": {"lang": "en", "length": 25} }';
}

?>