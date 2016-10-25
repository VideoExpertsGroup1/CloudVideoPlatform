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

#include "cmd_set_motion_detection_handler.h"

QString CmdSetMotionDetectionHandler::cmd(){
	return "set_motion_detection";
}

void CmdSetMotionDetectionHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	// TODO save motions
	// "{\"regions\": [{\"map\": \"\", \"sensitivity\": 5, \"enabled\": false, \"region\": \"motion1\"}, {\"map\": \"MGUwMDAxZmUwMDAzZmMwMDA3ZjgwMDBmZjAwMDFmZTBlNDAw\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion2\"}, {\"map\": \"ZTQwMDBjMWZlMDAwM2ZjMDAwN2Y4MDAwZmYwMDAxZmVmZjAw\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion3\"}, {\"map\": \"MGNmZjAwMDFmZTAwMDNmYzAwMDdmODAwMGZmMGUyMDA=\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion4\"}, {\"map\": \"ZWQwMDBjN2Y4MDAwZmYwMDAxZmUwMDAzZmMwMDA3ZjhmNjAw\", \"sensitivity\": 5, \"enabled\": false, \"region\": \"motion5\"}, {\"map\": \"ZWUwMDBjN2Y4MDAwZmYwMDAxZmUwMDAzZmMwMDA3ZjhmNTAw\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion6\"}, {\"map\": \"ZmUwMDBjMGZmMDAwMWZlMDAwM2ZjMDAwN2Y4MDAwZmZlNTAw\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion7\"}, {\"map\": \"ZTkwMDBjM2ZjMDAwN2Y4MDAwZmYwMDAxZmUwMDAzZmNmYTAw\", \"sensitivity\": 5, \"enabled\": true, \"region\": \"motion8\"}],
	// \"msgid\": 8, \"cmd\": \"set_motion_detection\", \"cam_id\": 7902}"
	
	wsc->sendMessage(wsc->makeCommandDone(cmd(), obj["msgid"].toInt(), "OK"));	
}
