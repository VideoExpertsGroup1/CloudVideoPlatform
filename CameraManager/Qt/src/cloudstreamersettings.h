#ifndef CLOUDSTREAMER_H
#define CLOUDSTREAMER_H

#include <QString>
#include <QSettings>
#include <QVariant>

class CloudStreamerSettings {
	
	public:
		CloudStreamerSettings(QString sFilename, QString sFilenameSession);
		
		int servercm_wss_port();
		int servercm_ws_port();
		QString servercm_host();
		QString servercm_reconnection_host();
		void servercm_reconnection_host(QString host); // setter
		bool servercm_needreconnect();
		void servercm_needreconnect(bool);
		
		QString servercm_upload_url();
		void servercm_upload_url(QString);
		QString servercm_sid();
		void servercm_sid(QString);
		QString servercm_media_server();
		void servercm_media_server(QString);
		
		QString wss_url();
		QString ws_url();
		
		QString accp_base_url_login();
		QString accp_base_url_reg_tokens();
		QString accp_username();
		QString accp_password();
		QString accp_reg_token();
		void accp_reg_token(QString);
		
		QString cm_uuid();
		void cm_uuid(QString); // setter
		QString cm_timezone();
		void cm_timezone(QString);
		QString cm_vendor();
		QString cm_version();
		QString cm_pwd();
		void cm_pwd(QString);
		QString cm_connid();
		void cm_connid(QString);
		bool cm_isRegistered();
		
		QString camera_brand();
		QString camera_ip();
		QString camera_model();
		QString camera_serial_number();
		QString camera_version();
		QString camera_media_url();
		QString camera_initial_mode();
		void camera_media_url(QString);
		int camera_id();
		void camera_id(int);
		QString camera_mode();
		void camera_mode(QString);

		bool camevents_memorycard_active();
		void camevents_memorycard_active(bool val);
		bool camevents_enabled();
		void camevents_enabled(bool val);

		QString streams_video_stream_command();
		QString streams_preview_command();
		
		int stream_counter();
		void stream_counter(int val);
		
	private:
		void loadSessionIni();
		void saveSessionIni();
		int readIntFromSettings(QSettings &sett, QString settName, int defaultValue);
		QString readStringFromSettings(QSettings &sett, QString settName, QString defaultValue);
		bool readBooleanFromSettings(QSettings &sett, QString settName, bool defaultValue);
		
		QString m_sFilename;
		QString m_sFilenameSession;
		
		int m_nServerCm_Wss_port;
		int m_nServerCm_Ws_port;
		QString m_sServerCm_host;
		QString m_sServerCm_reconnectionHost;
		bool m_bServerCm_needreconnect;
		QString m_sServerCm_upload_url;
		QString m_sServerCm_media_server;
		QString m_sServerCm_sid;
		
		QString m_sCm_uuid;
		QString m_sCm_timezone;
		QString m_sCm_vendor;
		QString m_sCm_version;
		QString m_sCm_pwd;
		QString m_sCm_connid;
		
		QString m_sAccp_BaseURL_Login;
		QString m_sAccp_BaseURL_RegTokens;
		QString m_sAccp_UserName;
		QString m_sAccp_Password;
		QString m_sAccp_RegToken;

		QString m_sCamera_brand;
		QString m_sCamera_ip;
		QString m_sCamera_model;
		QString m_sCamera_serial_number;
		QString m_sCamera_version;
		QString m_sCamera_media_url;
		QString m_sCamera_initial_mode;
		int m_nCamera_id;
		QString m_sCamera_mode;
		
		bool m_bCamEvents_enabled;
		bool m_bCamEvents_memorycard_active;
		
		QString m_sStreams_video_stream_command;
		QString m_sStreams_preview_command;
		
		int m_nStream_counter;
};

#endif // CLOUDSTREAMER_H
