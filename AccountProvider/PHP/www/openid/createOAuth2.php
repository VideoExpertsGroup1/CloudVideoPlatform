<?php

require_once(__DIR__.'/OAuth2/Autoloader.php');
require_once(__DIR__.'/../api/config.php');

OAuth2\Autoloader::register();

$dsn = 'mysql:dbname='.$config['db']['dbname'].';host='.$config['db']['host'];
$username = $config['db']['username'];
$password = $config['db']['userpass'];

$storage = new OAuth2\Storage\Pdo(array('dsn' => $dsn, 'username' => $username, 'password' => $password));

$server = new OAuth2\Server($storage, array(
	'use_openid_connect' => true,
	'allow_implicit' => true,
	'issuer' => $config['openid']['issuer'],
));

$scope = new OAuth2\Scope(array(
  'supported_scopes' => array('profile', 'openid', 'preferred_username', 'email')
));

$server->setScopeUtil($scope);

$server->addGrantType(new OAuth2\GrantType\ClientCredentials($storage));
$server->addGrantType(new OAuth2\OpenID\GrantType\AuthorizationCode($storage));
