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

#ifndef VXGCLOUDCAMERA_CMD_SET_CAM_PARAMETER_HANDLER_H
#define VXGCLOUDCAMERA_CMD_SET_CAM_PARAMETER_HANDLER_H

#include "../interfaces/icmdhandler.h"
#include "../interfaces/iwebsocketclient.h"

#include <QString>
#include <QVariant>

class CmdSetCamParameterHandler : public ICmdHandler {
	
	public:
		virtual QString cmd();
		virtual void handle(QJsonObject obj, IWebSocketClient *wsc);
};

#endif // VXGCLOUDCAMERA_CMD_SET_CAM_PARAMETER_HANDLER_H
