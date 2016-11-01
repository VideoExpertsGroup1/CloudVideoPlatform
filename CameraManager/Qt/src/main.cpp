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

#include <QtCore/QCoreApplication>
#include "websocketclient.h"
#include "cloudstreamersettings.h"
#include "accpclient/accpclient.h"
#include <iostream>

int main(int argc, char *argv[])
{
	QCoreApplication a(argc, argv);
	CloudStreamerSettings *pSettings = new CloudStreamerSettings("vxgcloudcamera.ini", "vxgcloudcamera.session.ini");

	if(!pSettings->cm_isRegistered()){
		// NEW CAMERA MANAGER
		AccpClient accp(pSettings);
		accp.login(pSettings->accp_username(), pSettings->accp_password());

		accp.reg_tokens();
		QString sRegToken = accp.create_reg_token();

		if(sRegToken == ""){
			qDebug() << "Could not create reg token";
			return 0;
		}
		pSettings->accp_reg_token(sRegToken);
	}
	
	WebSocketClient client(pSettings);
	
	// QObject::connect(&client, &WebSocketClient::closed, &a, &QCoreApplication::quit);

	return a.exec();
}
