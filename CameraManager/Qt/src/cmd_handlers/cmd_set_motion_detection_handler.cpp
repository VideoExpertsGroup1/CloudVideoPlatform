#include "cmd_set_motion_detection_handler.h"

QString CmdSetMotionDetectionHandler::cmd(){
	return "set_motion_detection";
}

void CmdSetMotionDetectionHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO save motions
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}
