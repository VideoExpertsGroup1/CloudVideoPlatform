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

		bool audioconf_caps_mic();
		void audioconf_caps_mic(bool val);
		bool audioconf_caps_spkr();
		void audioconf_caps_spkr(bool val);
		bool audioconf_caps_backward();
		void audioconf_caps_backward(bool val);
		QStringList audioconf_caps_echo_cancel();
		void audioconf_caps_echo_cancel(QStringList val);
		bool audioconf_spkr_mute();
		void audioconf_spkr_mute(bool val);
		int audioconf_spkr_vol();
		void audioconf_spkr_vol(int val);
		int audioconf_mic_gain();
		void audioconf_mic_gain(int val);
		bool audioconf_mic_mute();
		void audioconf_mic_mute(bool val);
		QString audioconf_echo_cancel();
		void audioconf_echo_cancel(QString val);

		QStringList videoconf_caps_vert_flip();
		void videoconf_caps_vert_flip(QStringList val);
		QStringList videoconf_caps_horz_flip();
		void videoconf_caps_horz_flip(QStringList val);
		QStringList videoconf_caps_tdn();
		void videoconf_caps_tdn(QStringList val);
		QStringList videoconf_caps_ir_light();
		void videoconf_caps_ir_light(QStringList val);
		QString videoconf_vert_flip();
		void videoconf_vert_flip(QString val);
		QString videoconf_horz_flip();
		void videoconf_horz_flip(QString val);
		QString videoconf_tdn();
		void videoconf_tdn(QString val);
		QString videoconf_ir_light();
		void videoconf_ir_light(QString val);

		QString streams_video_stream_command();
		QString streams_preview_command();
		
		int stream_counter();
		void stream_counter(int val);
		
	private:
		void loadSessionIni();
		void saveSessionIni();
		void loadAudioConf(QSettings &sett);
		void loadVideoConf(QSettings &sett);
		
		int readIntFromSettings(QSettings &sett, QString settName, int defaultValue);
		QString readStringFromSettings(QSettings &sett, QString settName, QString defaultValue);
		QStringList readStringListFromSettings(QSettings &sett, QString settName, QStringList defaultValue);
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
		
		bool m_bAudioConf_caps_mic;
		bool m_bAudioConf_caps_spkr;
		bool m_bAudioConf_caps_backward;
		QStringList m_slistAudioConf_caps_echo_cancel;
		bool m_bAudioConf_spkr_mute;
		int m_nAudioConf_spkr_vol;
		int m_nAudioConf_mic_gain;
		bool m_bAudioConf_mic_mute;
		QString m_sAudioConf_echo_cancel;

		QStringList m_slistVideoConf_caps_vert_flip;
		QStringList m_slistVideoConf_caps_horz_flip;
		QStringList m_slistVideoConf_caps_tdn;
		QStringList m_slistVideoConf_caps_ir_light;
		QString m_sVideoConf_vert_flip;
		QString m_sVideoConf_horz_flip;
		QString m_sVideoConf_tdn;
		QString m_sVideoConf_ir_light;
		
		QString m_sStreams_video_stream_command;
		QString m_sStreams_preview_command;
		
		int m_nStream_counter;
};

#endif // CLOUDSTREAMER_H
