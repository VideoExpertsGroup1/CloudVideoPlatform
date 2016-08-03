<?php
/*
 * API_NAME: Signup
 * API_METHOD: POST
 * API_DESCRIPTION: Method for login user in the system
 * API_ACCESS: all
 * API_INPUT: username - string, Identificator of the user
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

$username = strtolower($request['username']);

$conn = APIHelpers::createConnection();
$query = 'SELECT * FROM users WHERE username = ?';
$stmt = $conn->prepare($query);
$stmt->execute(array($username));
if ($row = $stmt->fetch()) {
	APIHelpers::showerror(1002, 'This user already registered');
}

$password = strtolower($request['password']);
$hash_password = APIHelpers::generatePassword($username, $password);

$query = 'INSERT users(username,password,role,dt_create,dt_last_login) VALUES(?,?,?,NOW(),NOW())';
$stmt = $conn->prepare($query);
$stmt->execute(array($username, $hash_password, 'user'));

$response['result'] = 'ok';

APIHelpers::endpage($response);
