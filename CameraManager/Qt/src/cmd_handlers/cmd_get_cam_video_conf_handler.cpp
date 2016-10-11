#include "cmd_get_cam_video_conf_handler.h"

QString CmdGetCamVideoConfHandler::cmd(){
	return "get_cam_video_conf";
}

void CmdGetCamVideoConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
}
