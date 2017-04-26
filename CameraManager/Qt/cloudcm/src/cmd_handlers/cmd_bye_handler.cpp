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
