<?php

include_once('createOAuth2.php');
include_once('loginpage.php');

$request = OAuth2\Request::createFromGlobals();
$response = new OAuth2\Response();

// validate the authorize request
if (!$server->validateAuthorizeRequest($request, $response)) {
	error_log('authorize Not valid request');
	header(sprintf('HTTP/%s %s %s', $response->version, $response->getStatusCode(), $response->getStatusText()));
	header('Content-Type: application/json');
	echo($response->getResponseBody('json'));
	return;
}

$is_authorized = isset($_COOKIE['AccpToken']);
$user_id = -1;

if($is_authorized){
	$token = $_COOKIE['AccpToken'];
	$conn = new PDO('mysql:host='.$config['db']['host'].';dbname='.$config['db']['dbname'].';charset=utf8',
			$config['db']['username'],
			$config['db']['userpass']);
	$query = 'SELECT * FROM users_tokens WHERE token = ? and status = "active"';
	$stmt = $conn->prepare($query);
	$stmt->execute(array($token));
	if ($row = $stmt->fetch()) {
		$user_id = $row['userid'];
		$data = json_decode($row['data'], true);
		if(isset($data['acls'])){
			$acls = $data['acls'];
			$extendIdToken = array(
				'svc_access' => array(
					'account' => $user_id,
					'admin' => true,
					'acl' => $acls
				)
			);
			$server->handleAuthorizeRequest($request, $response, $is_authorized, $user_id, $extendIdToken);
			header('Location: '.$response->getHttpHeader('Location'));	
		}else{
			showpageAuthorize();
			return;
		}
	}else{
		showpageAuthorize();
		return;
	}
}else{
	showpageAuthorize();
	return;
}
