#include "cmd_get_cam_audio_conf_handler.h"

QString CmdGetCamAudioConfHandler::cmd(){
	return "get_cam_audio_conf";
}

void CmdGetCamAudioConfHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject cam_audio_conf = wsc->makeCommand("cam_audio_conf");
	cam_audio_conf["refid"] = obj["msgid"].toInt();
	cam_audio_conf["cam_id"] = wsc->settings()->camera_id();
	cam_audio_conf["mic_gain"] = 50;
	cam_audio_conf["mic_mute"] = false;
	cam_audio_conf["spkr_vol"] = 50;
	cam_audio_conf["spkr_mute"] = false;
	cam_audio_conf["echo_cancel"] = "";

	QJsonObject caps;
	caps["mic"] = true;
	caps["spkr"] = true;
	caps["backward"] = true;

	QJsonArray echo_cancel;
	echo_cancel.append("");
	echo_cancel.append("S1");
	echo_cancel.append("S2");
	caps["echo_cancel"] = echo_cancel;
	cam_audio_conf["caps"] = caps;
	wsc->sendMessage(cam_audio_conf);
}
