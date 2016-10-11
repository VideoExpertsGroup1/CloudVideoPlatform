#include "cmd_configure_handler.h"

QString CmdConfigureHandler::cmd(){
	return "configure";
}

void CmdConfigureHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	if(obj.contains("server")){
		// qDebug() << "WebSocket opening...";
		wsc->settings()->servercm_reconnection_host(obj["server"].toString());
	}
	
	if(obj.contains("uuid")){
		wsc->settings()->cm_uuid(obj["uuid"].toString());
	}
	
	if(obj.contains("pwd")){
		wsc->settings()->cm_pwd(obj["pwd"].toString());
	}
	
	if(obj.contains("connid")){
		wsc->settings()->cm_connid(obj["connid"].toString());
	}
	
	if(obj.contains("tz")){
		wsc->settings()->cm_timezone(obj["tz"].toString());
	}
}
