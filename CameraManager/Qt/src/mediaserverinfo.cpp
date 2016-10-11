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
