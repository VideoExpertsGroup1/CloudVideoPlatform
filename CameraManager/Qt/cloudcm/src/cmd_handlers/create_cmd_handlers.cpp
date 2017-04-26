//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

#include "create_cmd_handlers.h"
#include "cmd_configure_handler.h"
#include "cmd_bye_handler.h"
#include "cmd_cam_update_preview_handler.h"
#include "cmd_cam_hello_handler.h"
#include "cmd_get_cam_status_handler.h"
#include "cmd_get_supported_streams_handler.h"
#include "cmd_get_cam_video_conf_handler.h"
#include "cmd_get_stream_config_handler.h"
#include "cmd_get_cam_audio_conf_handler.h"
#include "cmd_set_cam_audio_conf_handler.h"
#include "cmd_get_stream_by_event_handler.h"
#include "cmd_get_motion_detection_handler.h"
#include "cmd_set_motion_detection_handler.h"
#include "cmd_get_audio_detection_handler.h"
#include "cmd_get_cam_events_handler.h"
#include "cmd_set_cam_events_handler.h"
#include "cmd_hello_handler.h"
#include "cmd_get_stream_caps_handler.h"
#include "cmd_stream_start_handler.h"
#include "cmd_stream_stop_handler.h"
#include "cmd_backward_start_handler.h"
#include "cmd_backward_stop_handler.h"
#include "cmd_set_cam_parameter_handler.h"
#include "cmd_cam_get_log_handler.h"
#include "cmd_cam_upgrade_firmware_handler.h"
#include "cmd_cam_ptz_handler.h"
#include "cmd_set_stream_config_handler.h"

void create_cmd_handlers(QMap<QString, ICmdHandler *> &pHandlers){
	QVector<ICmdHandler *> v;
	v.push_back(new CmdConfigureHandler());
	v.push_back(new CmdByeHandler());
	v.push_back(new CmdHelloHandler());
	v.push_back(new CmdGetCamStatusHandler());
	v.push_back(new CmdGetSupportedStreamsHandler());
	v.push_back(new CmdGetCamVideoConfHandler());
	v.push_back(new CmdGetCamAudioConfHandler());
	v.push_back(new CmdSetCamAudioConfHandler());
	v.push_back(new CmdGetStreamByEventHandler());
	v.push_back(new CmdGetStreamConfigHandler());
	v.push_back(new CmdGetMotionDetectionHandler());
	v.push_back(new CmdSetMotionDetectionHandler());
	v.push_back(new CmdGetAudioDetectionHandler());
	v.push_back(new CmdGetCamEventsHandler());
	v.push_back(new CmdSetCamEventsHandler());
	v.push_back(new CmdCamUpdatePreviewHandler());
	v.push_back(new CmdCamHelloHandler());
	v.push_back(new CmdGetStreamCapsHandler());
	v.push_back(new CmdStreamStartHandler());
	v.push_back(new CmdStreamStopHandler());
	v.push_back(new CmdBackwardStartHandler());
	v.push_back(new CmdBackwardStopHandler());
	v.push_back(new CmdSetCamParameterHandler());
	v.push_back(new CmdCamGetLogHandler());
	v.push_back(new CmdCamUpgradeFirmwareHandler());
	v.push_back(new CmdCamPtzHandler());
	v.push_back(new CmdSetStreamConfigHandler());

	for(int i = 0; i < v.size(); i++){
		QString cmd = v[i]->cmd();
		if(pHandlers.contains(cmd)){
			qDebug() << "[WARNING] cmd_handler for command " << cmd << " - already registered and will be skipped";	
		}else{
			pHandlers[cmd] = v[i];
		}
	}
}
