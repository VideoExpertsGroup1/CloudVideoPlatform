<?php
/*
 * API_NAME: Set ACLs
 * API_METHOD: POST
 * API_DESCRIPTION: Method for set acls to session
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
		$data = json_decode($row['data'], true);
		$data['acls'] = $request['acls'];
		
		$stmt2 = $conn->prepare('UPDATE users_tokens SET data = ? WHERE token = ?');
		$stmt2->execute(array(json_encode($data), $token));

		$response['result'] = 'ok';
	}else{
		$response['result'] = 'fail';
	}
}

APIHelpers::endpage($response);
