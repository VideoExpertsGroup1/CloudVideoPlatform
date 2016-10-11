#include "cmd_bye_handler.h"

QString CmdByeHandler::cmd(){
	return "bye";
}

void CmdByeHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	if(obj.contains("reason")){
		if(obj["reason"].toString() == "RECONNECT")
			wsc->settings()->servercm_needreconnect(true);
	}
}
