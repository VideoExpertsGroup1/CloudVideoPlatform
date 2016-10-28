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

#include "cmd_get_motion_detection_handler.h"

QString CmdGetMotionDetectionHandler::cmd(){
	return "get_motion_detection";
}

void CmdGetMotionDetectionHandler::handle(QJsonObject obj, IWebSocketClient *wsc){
	
	QJsonObject motion_detection_conf = wsc->makeCommand("motion_detection_conf");
	motion_detection_conf["refid"] = obj["msgid"].toInt();
	motion_detection_conf["cam_id"] = wsc->settings()->camera_id();
	
	// number of detection cells by X and Y coordinate
	motion_detection_conf["columns"] = 23;
	motion_detection_conf["rows"] = 15;
	
	QJsonObject caps;
	caps["max_regions"] = 8;
	caps["sensitivity"] = "region"; // optional (“region”, “frame”), default “region”; indicates if sensitivity can be set for region or for whole frame only
	caps["region_shape"] = "rect"; // optional (“rect”, “any”), default “any”; specifies limitation of region shape
	motion_detection_conf["caps"] = caps;
	
	QJsonArray regions;
	
	for(int i = 0; i < 8; i++){
		QJsonObject motion;
		motion["enabled"] = true;
		motion["name"] = "motion" + QString::number(i);
		motion["map"] = "MGUwMDAxZmUwMDAzZmMwMDA3ZjgwMDBmZjAwMDFmZTBlNDAw";
		/* map: string. Bitstring where “1” denotes an active cell and a “0” an inactive cell.
		 * The first cell is in the upper left corner. Then the cell order goes first from
		 * left to right and then from up to down. If the number of cells is not a multiple
		 * of 8 the last byte is padded with zeros. String is packed with Packbit algorithm
		 * and after that encoded with Base64.
		*/
		motion["sensitivity"] = 5;
		regions.append(motion);
	}
	motion_detection_conf["regions"] = regions;
	wsc->sendMessage(motion_detection_conf);
}
