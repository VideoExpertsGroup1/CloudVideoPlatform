<?php
/*
 * API_NAME: Check Authorization
 * API_METHOD: POST
 * API_DESCRIPTION: Method for check authorization
 * API_ACCESS: all
 */

$curdir = dirname(__FILE__);
$apilib = $curdir.'/../../../lib/api.helpers.php';
include_once ($apilib);

$response = APIHelpers::startpage_post();
$request = APIHelpers::$REQUEST;

if(isset($_COOKIE['AccpToken'])){
	$token = $_COOKIE['AccpToken'];

	$conn = APIHelpers::createConnection();
	$query = 'SELECT * FROM users_tokens WHERE token = ?';
	$stmt = $conn->prepare($query);
	
	error_log("AccpToken: " + $token);

	$stmt->execute(array($token));

	if ($row = $stmt->fetch()) {
		// $row['id']
		// $row['role']
		$response['result'] = 'ok';
	}else{
		$response['result'] = 'fail';
	}
}

APIHelpers::endpage($response);
