#include "cmd_set_cam_audio_conf_handler.h"

QString CmdSetCamAudioConfHandler::cmd(){
	return "set_motion_detection";
}

void CmdSetCamAudioConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}
