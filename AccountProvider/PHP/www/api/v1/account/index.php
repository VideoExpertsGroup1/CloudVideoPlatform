<?php
/*
 * API_NAME: api/v1/account/
 * API_METHOD: GET,POST
 * API_DESCRIPTION: Method for logout user in the system
 * API_ACCESS: authorized
 */

$curdir = dirname(__FILE__);
$apilib = $curdir.'/../../lib/api.helpers.php';
include_once ($apilib);

if(!isset($_COOKIE['sessionid'])){
	APIHelpers::error_unauthorized();
	exit;
}

if(APIHelpers::isGetRequest()){
	$token = $_COOKIE['sessionid'];
	$response = APIHelpers::startpage_get();
	$conn = APIHelpers::createConnection();
	$query = 'SELECT * FROM users_tokens WHERE token = ?';
	$stmt = $conn->prepare($query);
	
	$stmt->execute(array($token));

	if ($row = $stmt->fetch()) {
		// {"username": "evgenii", "last_name": "Sopov", "phone": "", "postcode": "", "address": "", "city": "", "first_name": "Evgenii", "contact_way": "email", "language": "en", "country": "", "region": "", "email": "evgenii@videoexpertsgroup.com"}
		$response['username'] = 'someuser';
	}else{
		APIHelpers::error_unauthorized();
	}
	APIHelpers::endpage($response);

}else if(APIHelpers::isPostRequest()){
	$response = APIHelpers::startpage_post();
	$request = APIHelpers::$REQUEST;

	if(isset($_COOKIE['sessionid'])){
		$conn = APIHelpers::createConnection();
		$query = 'SELECT * FROM users_tokens WHERE token = ?';
		$stmt = $conn->prepare($query);
		
		error_log("sessionid: " + $token);

		$stmt->execute(array($token));

		if ($row = $stmt->fetch()) {
			// $row['id']
			// $row['role']
			$response['result'] = 'ok';
		}else{
			$response['result'] = 'fail';
		}
	}else{
		APIHelpers::error_unauthorized();
	}

	APIHelpers::endpage($response);
} else {
	APIHelpers::error_unsupperted_method();
}
