window.AccpConfig = {};

AccpConfig.use_cnvrclient2 = true;

if(AccpConfig.use_cnvrclient2){
	AccpConfig.base_url = "http://cnvrclient2.videoexpertsgroup.com/";
}else{
	AccpConfig.base_url = window.location.protocol + "//" + window.location.host + "/";
}
