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
