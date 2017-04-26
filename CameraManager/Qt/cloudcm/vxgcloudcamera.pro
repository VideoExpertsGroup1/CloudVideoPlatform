QT += \
	core \
	websockets \
	network \

QT -= gui

TARGET  = vxgcloudcamera
CONFIG   += console
CONFIG   -= app_bundle

TEMPLATE = app
DESTDIR = bin/
OBJECTS_DIR = tmp/
MOC_DIR = tmp/

SOURCES += \
	src/main.cpp \
	src/accpclient/accpclient.cpp \
	src/websocketclient.cpp \
	src/cloudstreamersettings.cpp \
	src/process.cpp \
	src/mediaserverinfo.cpp \
	src/memorycardstatus.cpp \
	src/cmd_handlers/create_cmd_handlers.cpp \
	src/cmd_handlers/cmd_configure_handler.cpp \
	src/cmd_handlers/cmd_bye_handler.cpp \
	src/cmd_handlers/cmd_get_cam_status_handler.cpp \
	src/cmd_handlers/cmd_get_supported_streams_handler.cpp \
	src/cmd_handlers/cmd_get_cam_video_conf_handler.cpp \
	src/cmd_handlers/cmd_get_cam_audio_conf_handler.cpp \
	src/cmd_handlers/cmd_set_cam_audio_conf_handler.cpp \
	src/cmd_handlers/cmd_get_stream_by_event_handler.cpp \
	src/cmd_handlers/cmd_get_stream_config_handler.cpp \
	src/cmd_handlers/cmd_get_motion_detection_handler.cpp \
	src/cmd_handlers/cmd_set_motion_detection_handler.cpp \
	src/cmd_handlers/cmd_get_audio_detection_handler.cpp \
	src/cmd_handlers/cmd_get_cam_events_handler.cpp \
	src/cmd_handlers/cmd_set_cam_events_handler.cpp \
	src/cmd_handlers/cmd_cam_update_preview_handler.cpp \
	src/cmd_handlers/cmd_hello_handler.cpp \
	src/cmd_handlers/cmd_cam_hello_handler.cpp \
	src/cmd_handlers/cmd_get_stream_caps_handler.cpp \
	src/cmd_handlers/cmd_stream_start_handler.cpp \
	src/cmd_handlers/cmd_stream_stop_handler.cpp \
	src/cmd_handlers/cmd_backward_stop_handler.cpp \
	src/cmd_handlers/cmd_backward_start_handler.cpp \
	src/cmd_handlers/cmd_set_cam_parameter_handler.cpp \
	src/cmd_handlers/cmd_cam_get_log_handler.cpp \
	src/cmd_handlers/cmd_cam_upgrade_firmware_handler.cpp \
	src/cmd_handlers/cmd_cam_ptz_handler.cpp \
	src/cmd_handlers/cmd_set_stream_config_handler.cpp \


HEADERS += \
	src/accpclient/accpclient.h \
	src/websocketclient.h \
	src/cloudstreamersettings.h \
	src/process.h \
	src/mediaserverinfo.h \
	src/memorycardstatus.h \
	src/interfaces/iprocess.h \
	src/interfaces/icmdhandler.h \
	src/interfaces/iwebsocketclient.h \
	src/cmd_handlers/create_cmd_handlers.h \
	src/cmd_handlers/cmd_configure_handler.h \
	src/cmd_handlers/cmd_bye_handler.h \
	src/cmd_handlers/cmd_get_cam_status_handler.h \
	src/cmd_handlers/cmd_get_supported_streams_handler.h \
	src/cmd_handlers/cmd_get_cam_video_conf_handler.h \
	src/cmd_handlers/cmd_get_cam_audio_conf_handler.h \
	src/cmd_handlers/cmd_set_cam_audio_conf_handler.h \
	src/cmd_handlers/cmd_get_stream_by_event_handler.h \
	src/cmd_handlers/cmd_get_stream_config_handler.h \
	src/cmd_handlers/cmd_get_motion_detection_handler.h \
	src/cmd_handlers/cmd_set_motion_detection_handler.h \
	src/cmd_handlers/cmd_get_audio_detection_handler.h \
	src/cmd_handlers/cmd_get_cam_events_handler.h \
	src/cmd_handlers/cmd_set_cam_events_handler.h \
	src/cmd_handlers/cmd_cam_update_preview_handler.h \
	src/cmd_handlers/cmd_hello_handler.h \
	src/cmd_handlers/cmd_cam_hello_handler.h \
	src/cmd_handlers/cmd_get_stream_caps_handler.h \
	src/cmd_handlers/cmd_stream_start_handler.h \
	src/cmd_handlers/cmd_stream_stop_handler.h \
	src/cmd_handlers/cmd_backward_stop_handler.h \
	src/cmd_handlers/cmd_backward_start_handler.h \
	src/cmd_handlers/cmd_set_cam_parameter_handler.h \
	src/cmd_handlers/cmd_cam_get_log_handler.h \
	src/cmd_handlers/cmd_cam_upgrade_firmware_handler.h \
	src/cmd_handlers/cmd_cam_ptz_handler.h \
	src/cmd_handlers/cmd_set_stream_config_handler.h \

