#include "cmd_get_cam_status_handler.h"

QString CmdGetCamStatusHandler::cmd(){
	return "get_cam_status";
}

void CmdGetCamStatusHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
	
	QJsonObject cam_status = wsc->makeCommand("cam_status");
	cam_status["refid"] = obj["msgid"].toString();
	cam_status["cam_id"] = wsc->settings()->camera_id();
	cam_status["ip"] = wsc->settings()->camera_ip();
	cam_status["activity"] = true;
	cam_status["streaming"] = true;
	cam_status["status_led"] = false;
	wsc->sendMessage(cam_status);
}
