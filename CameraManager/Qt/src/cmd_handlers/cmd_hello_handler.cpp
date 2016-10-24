#include "cmd_hello_handler.h"

QString CmdHelloHandler::cmd(){
	return "hello";
}

void CmdHelloHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));
	
	wsc->settings()->servercm_upload_url(obj["upload_url"].toString());
	wsc->settings()->servercm_sid(obj["sid"].toString());
	wsc->settings()->servercm_media_server(obj["media_server"].toString());	
	
	// need handle params
	// ca - just save certificate to file

	// TODO check is camera already registered
	QJsonObject data = wsc->makeCommand("cam_register");
	data["ip"] = wsc->settings()->camera_ip();
	data["uuid"] = wsc->settings()->cm_uuid();
	data["brand"] = wsc->settings()->camera_brand();
	data["model"] = wsc->settings()->camera_model();
	data["sn"] = wsc->settings()->camera_serial_number();
	data["type"] = "cm";
	data["version"] = wsc->settings()->camera_version();
	data["initial_mode"] = wsc->settings()->camera_initial_mode();
	
	if(wsc->settings()->camera_initial_mode() == "p2p"){
		QJsonObject p2p;
		QJsonObject local;
		local["main_port"] = 80;
		local["web_port"] = 80;
		local["rtmp_port"] = 1953;
		local["rtsp_port"] = 883;
		p2p["local"] = local;
		data["p2p"] = p2p;
	}
	wsc->sendMessage(data);
}
