
# The Sample of Account Provider on PHP

* Authorization / User registration on AccountProvider
* Editing of camera permissions
* Authorization to VXG Cloud Video Platform through AccountProvider

## Requirements

* PHP (>= 5.3)
* MySQL (>= 5.6)
* Apache (>= 2.2)

## Before instalaltion you need generate some data:

* client_id = your_client_id (6 numbers)
* client_secret = your_client_secret (32 numbers or english characters)
* signing alg = RS256
* issuer = http://your_account_provider_host/openid
* endpoints:
	* authorize = http://your_account_provider_host/openid/authorize.php
	* token = http://your_account_provider_host/openid/token.php
	* userinfo = http://your_account_provider_host/openid/userinfo.php
	* jwks = http://your_account_provider_host/openid/jwks.php
* vendor = YOURCOMPANYNAME (lagest english characters)

*This information need for registration AccountProvider in ServiceProvider side.*
*In this step please contact with VideoExpertsGroup team.*

## Installation Database

### Connect to mysql and create database

	$ mysql -p -u root

	> CREATE DATABASE `vxgaccpphp` CHARACTER SET utf8 COLLATE utf8_general_ci;
	> CREATE USER 'vxgaccpphp_u'@'localhost' IDENTIFIED BY 'vxgaccpphp_pass';
	> GRANT ALL PRIVILEGES ON vxgaccpphp.* TO 'vxgaccpphp_u'@'localhost' WITH GRANT OPTION;
	> FLUSH PRIVILEGES;

Please *vxgaccpphp_u* and *vxgaccpphp_pass* - replace by yourself

### Create table users

	CREATE TABLE IF NOT EXISTS `users` (
	  `id` int(11) NOT NULL AUTO_INCREMENT,
	  `username` varchar(255) NOT NULL,
	  `password` varchar(255) NOT NULL,
	  `role` varchar(255) NOT NULL,
	  `dt_create` datetime NOT NULL,
	  `dt_last_login` datetime NOT NULL,
	  PRIMARY KEY (`id`)
	) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

And insert admin user with password admin

	INSERT INTO users(username, password, role, dt_create, dt_last_login) VALUES('admin', '06976539736714f7eaaa9409a643855029717a9d', 'admin', NOW(), NOW());

### Create table users_tokens

	CREATE TABLE IF NOT EXISTS `users_tokens` (
	  `id` int(11) NOT NULL AUTO_INCREMENT,
	  `userid` int(11) NOT NULL,
	  `token` varchar(255) NOT NULL,
	  `status` varchar(255) NOT NULL,
	  `data` varchar(4048) NOT NULL,
	  `start_date` datetime NOT NULL,
	  `end_date` datetime NOT NULL,
	  PRIMARY KEY (`id`)
	) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

### Create tables for oauth2/openid

	CREATE TABLE oauth_access_tokens (
	  access_token         VARCHAR(40)    NOT NULL COMMENT 'System generated access token',
	  client_id            VARCHAR(80)             COMMENT 'OAUTH_CLIENTS.CLIENT_ID',
	  user_id              VARCHAR(80)             COMMENT 'OAUTH_USERS.USER_ID',
	  expires              TIMESTAMP      NOT NULL COMMENT 'When the token becomes invalid',
	  scope                VARCHAR(4000)           COMMENT 'Space-delimited list of scopes token can access',
	  PRIMARY KEY (access_token)
	);

	CREATE TABLE oauth_authorization_codes (
	  authorization_code   VARCHAR(40)    NOT NULL COMMENT 'System generated authorization code',
	  client_id            VARCHAR(80)             COMMENT 'OAUTH_CLIENTS.CLIENT_ID',
	  user_id              VARCHAR(80)             COMMENT 'OAUTH_USERS.USER_ID',
	  redirect_uri         VARCHAR(2000)           COMMENT 'URI to redirect user after authorization',
	  expires              TIMESTAMP      NOT NULL COMMENT 'When the code becomes invalid',
	  scope                VARCHAR(4000)           COMMENT 'Space-delimited list scopes code can request',
	  id_token             TEXT                    COMMENT 'JSON web token used for OpenID Connect',
	  PRIMARY KEY (authorization_code)
	);

	CREATE TABLE oauth_clients (
	  client_id            VARCHAR(80)   NOT NULL COMMENT 'A unique client identifier',
	  client_secret        VARCHAR(80)            COMMENT 'Used to secure Client Credentials Grant',
	  redirect_uri         VARCHAR(2000)          COMMENT 'Redirect URI used for Authorization Grant',
	  grant_types          VARCHAR(80)            COMMENT 'Space-delimited list of permitted grant types',
	  scope                VARCHAR(4000)          COMMENT 'Space-delimited list of permitted scopes',
	  user_id              VARCHAR(80)            COMMENT 'OAUTH_USERS.USER_ID',
	  PRIMARY KEY (client_id)
	);

	CREATE TABLE oauth_jti (
	  issuer              VARCHAR(80)   NOT NULL,
	  subject             VARCHAR(80),
	  audience            VARCHAR(80),
	  expires             TIMESTAMP     NOT NULL,
	  jti                 VARCHAR(2000) NOT NULL
	);

	CREATE TABLE oauth_jwt (
	  client_id           VARCHAR(80)   NOT NULL,
	  subject             VARCHAR(80),
	  public_key          VARCHAR(2000) NOT NULL
	);

	CREATE TABLE oauth_public_keys (
	  client_id            VARCHAR(80),
	  public_key           VARCHAR(2000),
	  private_key          VARCHAR(2000),
	  encryption_algorithm VARCHAR(100) DEFAULT "RS256"
	);

	CREATE TABLE oauth_refresh_tokens (
	  refresh_token        VARCHAR(40)    NOT NULL COMMENT 'System generated refresh token',
	  client_id            VARCHAR(80)             COMMENT 'OAUTH_CLIENTS.CLIENT_ID',
	  user_id              VARCHAR(80)             COMMENT 'OAUTH_USERS.USER_ID',
	  expires              TIMESTAMP      NOT NULL COMMENT 'When the token becomes invalid',
	  scope                VARCHAR(4000)           COMMENT 'Space-delimited list scopes token can access',
	  PRIMARY KEY (refresh_token)
	);

	CREATE TABLE oauth_scopes (
	  scope                VARCHAR(80)    NOT NULL COMMENT 'Name of scope, without spaces',
	  is_default           BOOLEAN                 COMMENT 'True to grant scope',
	  PRIMARY KEY (scope)
	);

	CREATE TABLE oauth_users (
	  username            VARCHAR(80),
	  password            VARCHAR(80),
	  first_name          VARCHAR(80),
	  last_name           VARCHAR(80),
	  email               VARCHAR(80),
	  email_verified      BOOLEAN,
	  scope               VARCHAR(4000)
	);

### Fill oauth2/openid tables

Previously you need ganerate private and public keys (for linux):

	$ cd /var/www/
	$ sudo openssl genrsa -out privkey.pem 2048
	$ sudo openssl rsa -in privkey.pem -pubout -out pubkey.pem
	
Insert to oauth_clients

	INSERT INTO oauth_clients(client_id, client_secret, redirect_uri) VALUES('your_client_id', 'your_client_secret', 'http://web.skyvr.videoexpertsgroup.com/svcauth/bycode');

Insert to oauth_public_keys (Configure public/private keys)

	INSERT INTO oauth_public_keys(client_id, encryption_algorithm) VALUES('your_client_id', 'RS256');
	UPDATE oauth_public_keys SET public_key = LOAD_FILE('/var/www/pubkey.pem') WHERE client_id = 'your_client_id';
	UPDATE oauth_public_keys SET private_key = LOAD_FILE('/var/www/privkey.pem') WHERE client_id = 'your_client_id';


## Configure PHP

* Copy files from www/* to /var/www/html folder
* Rename file /var/www/html/api/config.php.inc to /var/www/html/api/config.php
* Update config: /var/www/html/api/config.php
