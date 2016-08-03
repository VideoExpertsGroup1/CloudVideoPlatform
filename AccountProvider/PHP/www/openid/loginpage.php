<?php

include_once('../api/lib/api.helpers.php');

if(isset($_POST['username']) && isset($_POST['password'])){
	$username = $_POST['username'];
	$password = $_POST['password'];

	$conn = APIHelpers::createConnection();
	$query = 'SELECT * FROM users WHERE username = ? AND password = ?';
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
		APIHelpers::$TOKEN = APIHelpers::gen_guid();
		setcookie('AccpToken', APIHelpers::$TOKEN, 2000000000, '/');
		APIHelpers::saveByToken();
		$_COOKIE['AccpToken'] = APIHelpers::$TOKEN;
	}
}

function showpageAuthorize(){
	$r = array();
	foreach($_GET as $p => $v){
		$r[] = $p.'='.$v;
	}
	$gets = "?".implode("&", $r);	
	echo('
	<html>
		<head>
			<meta http-equiv="content-type" content="text/html; charset=UTF-8">
			<title>Sample Accp PHP</title>
			<link rel="stylesheet" type="text/css" href="../css/index.css">
			<script type="text/javascript" src="../js/jquery-3.1.0.min.js"></script>
			<script type="text/javascript" src="../js/AccpApi.js"></script>
			<script type="text/javascript" src="../js/CloudApi.js"></script>
			<script type="text/javascript" src="../js/index.js"></script>
			<script type="text/javascript">
				$( document ).ready(function() {
					AccpApi.checkAuthorization().done(function(response){
						if(response["result"] == "ok"){
							AccpClient.showACLs();
						}else{
							AccpClient.showLoginForm("'.$gets.'");
						}
					})
				});
			</script>
		</head>
		<body class="spec-background">
			<div class="vxgaccp-table-content">
				<div class="vxgaccp-cell-content">
				</div>
			</div>
		</body>
	</html>');
};
