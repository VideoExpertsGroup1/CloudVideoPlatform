<?php

include_once('createOAuth2.php');

// Handle a request for an OAuth2.0 Access Token and send the response to the client
$response = $server->handleTokenRequest(OAuth2\Request::createFromGlobals());
$header = sprintf('HTTP/%s %s %s', $response->version, $response->getStatusCode(), $response->getStatusText());
header($header);
header('Content-Type: application/json');
echo($response->getResponseBody('json'));
