<?php

include_once('../api/config.php');


$response = array(
	"keys" => array(),
);

$conn = new PDO('mysql:host='.$config['db']['host'].';dbname='.$config['db']['dbname'].';charset=utf8',
	$config['db']['username'],
	$config['db']['userpass']);

$query = 'SELECT * FROM oauth_public_keys LIMIT 0,1';
$stmt = $conn->prepare($query);
$stmt->execute();

if ($row = $stmt->fetch()) {
	$pub_key = openssl_pkey_get_public($row['public_key']);
	$keyData = openssl_pkey_get_details($pub_key);
	$response['keys'][] = array(
		"kty" => "RSA",
		"n" => base64_encode($keyData["rsa"]["n"]),
		"e" => base64_encode($keyData["rsa"]["e"]),
		"kid" => "1"
	);
}

header('Content-Type: application/json');
error_log(json_encode($response));
echo(json_encode($response));

