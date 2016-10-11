#include "create_cmd_handlers.h"
#include "cmd_configure_handler.h"
#include "cmd_bye_handler.h"
#include "cmd_cam_update_preview_handler.h"
#include "cmd_cam_hello_handler.h"
#include "cmd_get_cam_status_handler.h"
#include "cmd_get_supported_streams_handler.h"
#include "cmd_get_cam_video_conf_handler.h"
#include "cmd_get_cam_audio_conf_handler.h"
#include "cmd_get_stream_by_event_handler.h"
#include "cmd_get_motion_detection_handler.h"
#include "cmd_set_motion_detection_handler.h"
#include "cmd_get_audio_detection_handler.h"
#include "cmd_get_cam_events_handler.h"
#include "cmd_hello_handler.h"
#include "cmd_get_stream_caps_handler.h"
#include "cmd_stream_start_handler.h"
#include "cmd_stream_stop_handler.h"
#include "cmd_backward_start_handler.h"
#include "cmd_backward_stop_handler.h"

void create_cmd_handlers(QMap<QString, ICmdHandler *> &pHandlers){
	QVector<ICmdHandler *> v;
	v.push_back(new CmdConfigureHandler());
	v.push_back(new CmdByeHandler());
	v.push_back(new CmdHelloHandler());
	v.push_back(new CmdGetCamStatusHandler());
	v.push_back(new CmdGetSupportedStreamsHandler());
	v.push_back(new CmdGetCamVideoConfHandler());
	v.push_back(new CmdGetCamAudioConfHandler());
	v.push_back(new CmdGetStreamByEventHandler());
	v.push_back(new CmdGetMotionDetectionHandler());
	v.push_back(new CmdSetMotionDetectionHandler());
	v.push_back(new CmdGetAudioDetectionHandler());
	v.push_back(new CmdGetCamEventsHandler());
	v.push_back(new CmdCamUpdatePreviewHandler());
	v.push_back(new CmdCamHelloHandler());
	v.push_back(new CmdGetStreamCapsHandler());
	v.push_back(new CmdStreamStartHandler());
	v.push_back(new CmdStreamStopHandler());
	v.push_back(new CmdBackwardStartHandler());
	v.push_back(new CmdBackwardStopHandler());

	for(int i = 0; i < v.size(); i++){
		QString cmd = v[i]->cmd();
		if(pHandlers.contains(cmd)){
			qDebug() << "[WARNING] cmd_handler for command " << cmd << " - already registered and will be skipped";	
		}else{
			pHandlers[cmd] = v[i];
		}
	}
}
