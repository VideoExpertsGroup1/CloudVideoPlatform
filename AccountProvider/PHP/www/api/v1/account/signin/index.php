<?php
/*
 * API_NAME: Signin
 * API_METHOD: POST
 * API_DESCRIPTION: Method for login user in the system
 * API_ACCESS: all
 * API_INPUT: email - string, Identificator of the user
 * API_INPUT: password - string, Password of a user
 * API_OKRESPONSE: { "result":"ok", "token":"76558894-0AA9-11E4-09F0-D353D3CF86D5" }
 */

$curdir = dirname(__FILE__);
$apilib = $curdir.'/../../../lib/api.helpers.php';
include_once ($apilib);

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
	$response['result'] = 'ok';
	APIHelpers::$TOKEN = APIHelpers::gen_guid();
	setcookie('AccpToken', APIHelpers::$TOKEN, 2000000000, '/');
	APIHelpers::saveByToken();
	$response['data']['token'] = APIHelpers::$TOKEN;
}else{
	APIHelpers::showerror(1001, 'Could not authorize. Wrong parameters "username" and/or "password"');
}

APIHelpers::endpage($response);
