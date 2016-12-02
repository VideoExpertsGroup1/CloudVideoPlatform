<?php
/*
 * API_NAME: api/v1/account/login/
 * API_METHOD: POST
 * API_DESCRIPTION: Method for login user in the system
 * API_ACCESS: all
 * API_INPUT: email - string, Identificator of the user
 * API_INPUT: password - string, Password of a user
 */

$curdir = dirname(__FILE__);
include_once ($curdir.'/../../../lib/api.helpers.php');

if(!APIHelpers::isPostRequest()){
	APIHelpers::error_unsupperted_method();
	exit;
}

$response = APIHelpers::startpage_post();
$request = APIHelpers::$REQUEST;

if(!isset($request['username']) || !isset($request['password'])){
	APIHelpers::showerror(1001, 'Could not found expected parameters: "username" and/or "password"');
}

$conn = APIHelpers::createConnection();

$query = 'SELECT * FROM users WHERE username = ? AND password = ?';
$username = strtolower($request['username']);
$password = strtolower($request['password']);
$hash_password = APIHelpers::generatePassword($username, $password);
$stmt = $conn->prepare($query);
$stmt->execute(array($username,$hash_password));
APIHelpers::$TOKEN = null;

if ($row = $stmt->fetch()) {
	APIHelpers::$ACCPSESSION = array(
		'user' => array(
			'id' => $row['id'],
			'username' => $row['username'],
			'role' => $row['role'],
		),
	);
	
	$response['svcp_auth_web_url'] = 'http://web.skyvr.videoexpertsgroup.com/svcauth/init?iss=http%3A//emagin.videoexpertsgroup.com/openid&vendor=VXG&uatype=web';
	$response['svcp_auth_app_url'] = 'http://web.skyvr.videoexpertsgroup.com/svcauth/init?iss=http%3A//emagin.videoexpertsgroup.com/openid&vendor=VXG&uatype=app';
	APIHelpers::$TOKEN = APIHelpers::gen_guid();
	setcookie('sessionid', APIHelpers::$TOKEN, 2000000000, '/');
	APIHelpers::saveByToken();
}else{
	APIHelpers::error_unauthorized();
	exit;
}

APIHelpers::endpage($response);
