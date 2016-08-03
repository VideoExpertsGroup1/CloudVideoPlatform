<?php

include_once('createOAuth2.php');

$request = OAuth2\Request::createFromGlobals();
$response = new OAuth2\Response();


$token = $server->getAccessTokenData(OAuth2\Request::createFromGlobals());
if($token == null){
	error_log('userinfo token is null');
	header(sprintf('HTTP/%s %s %s', 1, 404, 'NOT FOUND'));
	header('Content-Type: application/json');
	echo(json_encode(array('error' => 'Not found token')));
	return;
}

$user_id = $token['user_id'];

$conn = new PDO('mysql:host='.$config['db']['host'].';dbname='.$config['db']['dbname'].';charset=utf8',
	$config['db']['username'],
	$config['db']['userpass']);
			
$query = 'SELECT * FROM users WHERE id = ?';
$stmt = $conn->prepare($query);
$stmt->execute(array($user_id));

if ($row = $stmt->fetch()) {
	$response = array(
		'name' => $row['username'],
		'given_name' => '', //$user['FirstName'],
		'family_name' => '', // $user['LastName'],
		'sub' => $row['id'],
		'nickname' => '',
		'preferred_username' => '', // $user['FirstName'].' '.$user['LastName'],
		'profile' => '',
		'picture' => '',
		'website' => '',
		'gender' => '',
		'birthdate' => '',
		'zoneinfo' => '',
		'locale' => 'en',
		'updated_at' => $row['dt_create'],
		'email' => 'some@mail.mail', // $user['email_id'],
		'email_verified' => true, // true,
		'phone_number' => '', //$row['mobile_no'],
		'phone_number_verified' => '',
		'address' => array(
				'formatted' => '', //$row['address'],
				'street_address' => '', //$row['address2'],
				'locality' => '', //$row['city'],
				'region' => '', //$row['state'],
				'postal_code' => '', // $row['zipcode'],
				'country' => 'Earth',
		)
	);
	header('Content-Type: application/json');
	echo(json_encode($response));
}
