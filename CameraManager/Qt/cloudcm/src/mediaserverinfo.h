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

#ifndef MEDIASERVERINFO_H
#define MEDIASERVERINFO_H
#include <QString>

class MediaServerInfo
{
	public:
	
		static QString upload_cat_prerecord();
		static QString upload_cat_snapshot();
		static QString upload_cat_preview();
		static QString upload_cat_log();
		
		static QString upload_ftype_jpg();
		static QString upload_ftype_mp4();
		static QString upload_ftype_txt();
			
	private:
};

#endif // MEDIASERVERINFO_H
