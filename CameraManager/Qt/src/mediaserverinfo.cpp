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

#include "mediaserverinfo.h"
#include <QtCore/QDebug>

QString MediaServerInfo::upload_cat_prerecord(){
	return "prerecord";
};

QString MediaServerInfo::upload_cat_snapshot(){
	return "snapshot";
};

QString MediaServerInfo::upload_cat_preview(){
	return "preview";
};

QString MediaServerInfo::upload_cat_log(){
	return "log";
};

QString MediaServerInfo::upload_ftype_jpg(){
	return "jpg";
};

QString MediaServerInfo::upload_ftype_mp4(){
	return "mp4";
};

QString MediaServerInfo::upload_ftype_txt(){
	return "txt";
};
