#include "cloudstreamersettings.h"
#include <QFile>
#include <QtCore/QDebug>
#include <QCoreApplication>

CloudStreamerSettings::CloudStreamerSettings(QString sFilename, QString sFilenameSession){
	m_sFilename = sFilename;
	m_sFilenameSession = sFilenameSession;
	m_nStream_counter = 0;
	// default settings
	m_nServerCm_Wss_port = 8883;
	m_nServerCm_Ws_port = 8888;
	m_sServerCm_host = "unknown";
	m_bCamEvents_enabled = false;
	m_bCamEvents_memorycard_active = false;

	qDebug() << "[INFO] load settings";
	
	if(QFile::exists(m_sFilename)){
		QSettings sett(m_sFilename, QSettings::IniFormat);
		
		m_nServerCm_Wss_port = readIntFromSettings(sett, "SERVER_CM/wss_port", 8883);
		m_nServerCm_Ws_port = readIntFromSettings(sett, "SERVER_CM/ws_port", 8888);
		m_sServerCm_host = readStringFromSettings(sett, "SERVER_CM/host", "");
		
		m_sAccp_BaseURL_Login = readStringFromSettings(sett, "ACCP/base_url_login", "");
		m_sAccp_BaseURL_RegTokens = readStringFromSettings(sett, "ACCP/base_url_reg_tokens", "");
		m_sAccp_UserName = readStringFromSettings(sett, "ACCP/username", "");
		m_sAccp_Password = readStringFromSettings(sett, "ACCP/password", "");
		
		m_sCm_uuid = readStringFromSettings(sett, "CM/uuid", "");
		m_sCm_timezone = readStringFromSettings(sett, "CM/timezone", "");
		m_sCm_vendor = readStringFromSettings(sett, "CM/vendor", "");
		m_sCm_version = readStringFromSettings(sett, "CM/version", "");
		
		m_sCamera_brand = readStringFromSettings(sett, "CAMERA/brand", "");
		m_sCamera_ip = readStringFromSettings(sett, "CAMERA/ip", "");
		m_sCamera_model = readStringFromSettings(sett, "CAMERA/model", "");
		m_sCamera_serial_number = readStringFromSettings(sett, "CAMERA/serial_number", "");
		m_sCamera_version = readStringFromSettings(sett, "CAMERA/version", "");
		m_sCamera_initial_mode = readStringFromSettings(sett, "CAMERA/initial_mode", "cloud");
		
		m_bCamEvents_enabled = readBooleanFromSettings(sett, "CAMEVENTS/enabled", false);
		m_bCamEvents_memorycard_active = readBooleanFromSettings(sett, "CAMEVENTS/memorycard_active", false);
		m_sStreams_video_stream_command = readStringFromSettings(sett, "STREAMS/video_stream_command", "");
		m_sStreams_preview_command = readStringFromSettings(sett, "STREAMS/preview_command", "");
	}else{
		qDebug() << "[WARNING] File " << m_sFilename << " not found";
	}

	loadSessionIni(); // load sid pwd connid
	saveSessionIni();
};

// ---------------------------------------------------------------------

int CloudStreamerSettings::readIntFromSettings(QSettings &sett, QString settName, int defaultValue){
	int nResult = defaultValue;
	if(sett.contains(settName)){
		nResult = sett.value(settName, nResult).toInt();
	}else{
		qDebug() << "[WARNING] " << settName << " - not found in " << m_sFilename << "\n\t Will be used default value: " << defaultValue;
	}
	return nResult;
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::readStringFromSettings(QSettings &sett, QString settName, QString defaultValue){
	QString sResult = defaultValue;
	if(sett.contains(settName)){
		sResult = sett.value(settName, sResult).toString();
	}else{
		qDebug() << "[WARNING] " << settName << " - not found in " << m_sFilename << "\n\t Will be used default value: " << defaultValue;
	}
	return sResult;
}

// ---------------------------------------------------------------------

bool CloudStreamerSettings::readBooleanFromSettings(QSettings &sett, QString settName, bool defaultValue){
	bool bResult = defaultValue;
	if(sett.contains(settName)){
		bResult = sett.value(settName, bResult).toBool();
	}else{
		qDebug() << "[WARNING] " << settName << " - not found in " << m_sFilename << "\n\t Will be used default value: " << defaultValue;
	}
	return bResult;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::loadSessionIni(){
	if(QFile::exists(m_sFilenameSession)){
		QSettings sett_session(m_sFilenameSession, QSettings::IniFormat);
		
		m_nServerCm_Wss_port = readIntFromSettings(sett_session, "SERVER_CM/wss_port", 8883);
		m_nServerCm_Ws_port = readIntFromSettings(sett_session, "SERVER_CM/ws_port", 8888);
		m_sServerCm_host = readStringFromSettings(sett_session, "SERVER_CM/host", "");
		m_sServerCm_sid = readStringFromSettings(sett_session, "SERVER_CM/sid", "");

		m_sAccp_BaseURL_Login = readStringFromSettings(sett_session, "ACCP/base_url_login", "");
		m_sAccp_BaseURL_RegTokens = readStringFromSettings(sett_session, "ACCP/base_url_reg_tokens", "");		
		m_sAccp_UserName = readStringFromSettings(sett_session, "ACCP/username", "");
		m_sAccp_Password = readStringFromSettings(sett_session, "ACCP/password", "");
		
		m_sCm_uuid = readStringFromSettings(sett_session, "CM/uuid", "");
		m_sCm_timezone = readStringFromSettings(sett_session, "CM/timezone", "");
		m_sCm_vendor = readStringFromSettings(sett_session, "CM/vendor", "");
		m_sCm_version = readStringFromSettings(sett_session, "CM/version", "");
		m_sCm_pwd = readStringFromSettings(sett_session, "CM/pwd", "");
		m_sCm_connid = readStringFromSettings(sett_session, "CM/connid", "");
		
		m_sCamera_brand = readStringFromSettings(sett_session, "CAMERA/brand", "");
		m_sCamera_ip = readStringFromSettings(sett_session, "CAMERA/ip", "");
		m_sCamera_model = readStringFromSettings(sett_session, "CAMERA/model", "");
		m_sCamera_serial_number = readStringFromSettings(sett_session, "CAMERA/serial_number", "");
		m_sCamera_version = readStringFromSettings(sett_session, "CAMERA/version", "");
		m_sCamera_initial_mode = readStringFromSettings(sett_session, "CAMERA/initial_mode", "cloud");
		m_nCamera_id = readIntFromSettings(sett_session, "CAMERA/id", 0);

		m_sStreams_video_stream_command = readStringFromSettings(sett_session, "STREAMS/video_stream_command", "");
		m_sStreams_preview_command = readStringFromSettings(sett_session, "STREAMS/preview_command", "");
		
		m_bCamEvents_memorycard_active = readBooleanFromSettings(sett_session, "CAMEVENTS/memorycard_active", false);
	}
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::saveSessionIni(){
	
	QSettings sett(m_sFilenameSession, QSettings::IniFormat);

	sett.setValue("SERVER_CM/wss_port", m_nServerCm_Wss_port);
	sett.setValue("SERVER_CM/ws_port", m_nServerCm_Ws_port);
	sett.setValue("SERVER_CM/host", m_sServerCm_host);
	sett.setValue("SERVER_CM/reconnectionHost", m_sServerCm_reconnectionHost);
	sett.setValue("SERVER_CM/needreconnect", m_bServerCm_needreconnect);
	sett.setValue("SERVER_CM/upload_url", m_sServerCm_upload_url);
	sett.setValue("SERVER_CM/media_server", m_sServerCm_media_server);
	sett.setValue("SERVER_CM/sid", m_sServerCm_sid);

	sett.setValue("ACCP/base_url_login", m_sAccp_BaseURL_Login);
	sett.setValue("ACCP/base_url_reg_tokens", m_sAccp_BaseURL_RegTokens);
	sett.setValue("ACCP/username", m_sAccp_UserName);
	sett.setValue("ACCP/password", m_sAccp_Password);
	sett.setValue("ACCP/reg_token", m_sAccp_RegToken);
	
	sett.setValue("CM/uuid", m_sCm_uuid);
	sett.setValue("CM/timezone", m_sCm_timezone);
	sett.setValue("CM/vendor", m_sCm_vendor);
	sett.setValue("CM/version", m_sCm_version);
	sett.setValue("CM/connid", m_sCm_connid);
	sett.setValue("CM/pwd", m_sCm_pwd);

	sett.setValue("CAMERA/brand", m_sCamera_brand);
	sett.setValue("CAMERA/ip", m_sCamera_ip);
	sett.setValue("CAMERA/model", m_sCamera_model);
	sett.setValue("CAMERA/serial_number", m_sCamera_serial_number);
	sett.setValue("CAMERA/version", m_sCamera_version);
	sett.setValue("CAMERA/media_url", m_sCamera_media_url);
	sett.setValue("CAMERA/initial_mode", m_sCamera_initial_mode);
	sett.setValue("CAMERA/id", m_nCamera_id);
	sett.setValue("CAMERA/mode", m_sCamera_mode);

	sett.setValue("CAMEVENTS/enabled", m_bCamEvents_enabled);
	sett.setValue("CAMEVENTS/memorycard_active", m_bCamEvents_memorycard_active);

	sett.setValue("STREAMS/video_stream_command", m_sStreams_video_stream_command);
	sett.setValue("STREAMS/preview_command", m_sStreams_preview_command);
}

// ---------------------------------------------------------------------

int CloudStreamerSettings::servercm_wss_port(){
	return m_nServerCm_Wss_port;
};

// ---------------------------------------------------------------------

int CloudStreamerSettings::servercm_ws_port(){
	return m_nServerCm_Ws_port;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::servercm_host(){
	return m_sServerCm_host;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::servercm_reconnection_host(){
	return m_sServerCm_reconnectionHost;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::servercm_reconnection_host(QString val){
	m_sServerCm_reconnectionHost = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

bool CloudStreamerSettings::servercm_needreconnect(){
	return m_bServerCm_needreconnect;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::servercm_needreconnect(bool val){
	m_bServerCm_needreconnect = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::wss_url(){
	return "wss://" + m_sServerCm_host + ":" + QString::number(m_nServerCm_Wss_port);
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::ws_url(){
	return "ws://" + m_sServerCm_host + ":" + QString::number(m_nServerCm_Ws_port);
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::accp_base_url_login(){
	return m_sAccp_BaseURL_Login;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::accp_base_url_reg_tokens(){
	return m_sAccp_BaseURL_RegTokens;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::accp_username(){
	return m_sAccp_UserName;
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::accp_password(){
	return m_sAccp_Password;
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::accp_reg_token(){
	return m_sAccp_RegToken;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::accp_reg_token(QString val){
	m_sAccp_RegToken = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_uuid(){
	return m_sCm_uuid;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::cm_uuid(QString val){
	m_sCm_uuid = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_timezone(){
	return m_sCm_timezone;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::cm_timezone(QString val){
	m_sCm_timezone = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_vendor(){
	return m_sCm_vendor;
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_version(){
	return m_sCm_version;
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_pwd(){
	return m_sCm_pwd;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::cm_pwd(QString val){
	m_sCm_pwd = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::cm_connid(){
	return m_sCm_connid;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::cm_connid(QString val){
	m_sCm_connid = val;
	saveSessionIni();
}

// ---------------------------------------------------------------------

bool CloudStreamerSettings::cm_isRegistered(){
	return m_sCm_connid != "";
}

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_brand(){
	return m_sCamera_brand;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_ip(){
	return m_sCamera_ip;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_model(){
	return m_sCamera_model;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_serial_number(){
	return m_sCamera_serial_number;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_version(){
	return m_sCamera_version;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_media_url(){
	return m_sCamera_media_url;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_initial_mode(){
	return m_sCamera_initial_mode;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::camera_media_url(QString val){
	m_sCamera_media_url = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

int CloudStreamerSettings::camera_id(){
	return m_nCamera_id;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::camera_id(int val){
	m_nCamera_id = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::camera_mode(){
	return m_sCamera_mode;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::camera_mode(QString val){
	m_sCamera_mode = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

bool CloudStreamerSettings::camevents_memorycard_active(){
	return m_bCamEvents_memorycard_active;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::camevents_memorycard_active(bool val){
	m_bCamEvents_memorycard_active = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

bool CloudStreamerSettings::camevents_enabled(){
	return m_bCamEvents_enabled;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::camevents_enabled(bool val){
	m_bCamEvents_enabled = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::servercm_upload_url(){
	return m_sServerCm_upload_url;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::servercm_upload_url(QString val){
	m_sServerCm_upload_url = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::servercm_sid(){
	return m_sServerCm_sid;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::servercm_sid(QString val){
	m_sServerCm_sid = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::servercm_media_server(){
	return m_sServerCm_media_server;
};

// ---------------------------------------------------------------------

void CloudStreamerSettings::servercm_media_server(QString val){
	m_sServerCm_media_server = val;
	saveSessionIni();
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::streams_video_stream_command(){
	return m_sStreams_video_stream_command;
};

// ---------------------------------------------------------------------

QString CloudStreamerSettings::streams_preview_command(){
	return m_sStreams_preview_command;
};

// ---------------------------------------------------------------------

int CloudStreamerSettings::stream_counter(){
	return m_nStream_counter;
}

// ---------------------------------------------------------------------

void CloudStreamerSettings::stream_counter(int val){
	m_nStream_counter = val;
}

// ---------------------------------------------------------------------

		
