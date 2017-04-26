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

#ifndef CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H
#define CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H

#include <QString>
#include <QJsonObject>
#include "iwebsocketclient.h"

class ICmdHandler {
	public:
		virtual QString cmd() = 0;
		virtual void handle(QJsonObject obj, IWebSocketClient *wsc) = 0;
};

#endif // CLOUDSTREAMER_INTERFACES_ICMDHANDLER_H
