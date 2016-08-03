<?php
$curdir_helpers = dirname(__FILE__);
include_once ($curdir_helpers."/../config.php");

class APIHelpers {
	/*static function checkAuth()
	{
		if(!APISecurity::isLogged()) {
			APIHelpers::showerror(1224, 'Not authorized request');
			exit;
		}
	}*/
	
	static function createConnection(){
		if (APIHelpers::$CONN != null)
			return APIHelpers::$CONN;
		
		APIHelpers::$CONN = new PDO(
			'mysql:host='.APIHelpers::$CONFIG['db']['host'].';dbname='.APIHelpers::$CONFIG['db']['dbname'].';charset=utf8',
			APIHelpers::$CONFIG['db']['username'],
			APIHelpers::$CONFIG['db']['userpass']
		);
		return APIHelpers::$CONN;
	}
	
	static function showerror($code, $message) {
		$result = array(
			'result' => 'fail',
			'data' => array(),
		);
		$result['error']['code'] = $code;
		$result['error']['message'] = 'Error '.$code.': '.$message;
		APIHelpers::endpage($result);
		exit;
	}
	
	static function gen_guid() {
		mt_srand((double)microtime()*10000);//optional for php 4.2.0 and up.
		$charid = strtoupper(md5(uniqid(rand(), true)));
		$hyphen = chr(45);// "-"
		$uuid = substr($charid, 0, 8).$hyphen
				.substr($charid, 8, 4).$hyphen
				.substr($charid,12, 4).$hyphen
				.substr($charid,16, 4).$hyphen
				.substr($charid,20,12);
		return $uuid;	
	}
	
	static $TIMESTART = null;
	static $ACCPSESSION = null;
	static $ACCPSESSION_ORIG = null;
	static $TOKEN = null;
	static $CONN = null;
	static $CONFIG = null;
	static $REQUEST = null;

	// PHP < 5.6
	static function is_JSON() {
		call_user_func_array('json_decode',func_get_args());
		return (json_last_error()===JSON_ERROR_NONE);
	}

	static function startpage_post() {
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		APIHelpers::$TIMESTART = microtime(true);
		$json = file_get_contents('php://input');
		if(!APIHelpers::is_JSON($json)){
			APIHelpers::showerror(1188, 'Expexted json');
		}
		APIHelpers::$REQUEST = json_decode($json, true);
		$issetToken = isset(APIHelpers::$REQUEST['token']);
		if ($issetToken) {
			APIHelpers::$TOKEN = APIHelpers::$REQUEST['token'];
			$conn = APIHelpers::createConnection(APIHelpers::$CONFIG);
			try {
				$stmt = $conn->prepare('SELECT data FROM users_tokens WHERE token = ? AND status = ? AND end_date > NOW()');
				$stmt->execute(array(APIHelpers::$TOKEN,'active'));
				if ($row = $stmt->fetch())
				{
					APIHelpers::$ACCPSESSION = json_decode($row['data'],true);
					APIHelpers::$ACCPSESSION_ORIG = json_decode($row['data'],true);
				}
			} catch(PDOException $e) {
				APIHelpers::showerror(1188, $e->getMessage());
			}
		}
		return array(
			'result' => 'fail',
			'lead_time_sec' => 0,
			'data' => array(),
		);
	}
	
	static function isLogged() {
		if (APIHelpers::$ACCPSESSION != NULL) {
			return isset(APIHelpers::$ACCPSESSION['user']);
		}
		return false;
	}

	static function generatePassword($username, $password) {
		return sha1(strtoupper($username).$password);
	}
	
	static function endpage($response) {
		if (APIHelpers::$TIMESTART != null)
			$result['lead_time_sec'] = microtime(true) - APIHelpers::$TIMESTART;

		$hash_session = null;
		$hash_session_orig = null;
		if (APIHelpers::$ACCPSESSION != null && APIHelpers::$ACCPSESSION_ORIG != null)
			$hash_session = md5(json_encode(APIHelpers::$ACCPSESSION));
			$hash_session_orig = md5(json_encode(APIHelpers::$ACCPSESSION_ORIG));
		
		if ($hash_session != $hash_session_orig && $hash_session_orig != null) {
			APIHelpers::updateByToken();
		}
		
		echo json_encode($response);
	}
	
	static function saveByToken() { 
		$query = 'INSERT INTO users_tokens (userid, token, status, data, start_date, end_date) VALUES(?, ?, ?, ?, NOW(), NOW() + INTERVAL 1 DAY)';
		$params = array(
			APIHelpers::$ACCPSESSION['user']['id'],
			APIHelpers::$TOKEN,
			'active',
			json_encode(APIHelpers::$ACCPSESSION)
		);
		$stmt = APIHelpers::$CONN->prepare($query);
		$stmt->execute($params);
	}
	
	static function updateByToken() { 
		if (APIHelpers::$TOKEN == null || APIHelpers::$ACCPSESSION == null || APIHelpers::$CONN == null)
			return;
		
		$query = 'UPDATE users_tokens SET data = ?, end_date = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE token = ?';
		$params = array(
			json_encode(APIHelpers::$ACCPSESSION),
			APIHelpers::$TOKEN,
		);
		$stmt = APIHelpers::$CONN->prepare($query);
		$stmt->execute($params);
	}

	static function removeByToken($token) { 
		$query = 'DELETE FROM users_tokens WHERE token = ?';
		$stmt = APIHelpers::$CONN->prepare($query);
		$stmt->execute(array($token));
	}
}

APIHelpers::$CONFIG = $config;
