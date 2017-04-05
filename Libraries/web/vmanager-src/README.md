# vmanager package

## Build

1. Install npm + nodejs
2. Run command `npm install` - for install requariments
3. Run command `npm run build` - for prepare web and custom verions

All sources wil be in folder "dist"

## Parameters of vmanager web-page

* timeline_in_utc - will be show timeline in utc time
* usehlslive - For live stream will be use hls
* mobile - special modification for mobile based on android app
* camid - open player for camera id (must be set goto_first_camera)
* demo - enable demo mode (will be opened first camera or 'camid')
* fc - goto first camera (if set camid then open will be camera with camid)
* fcno - disable goto first camera
* scvp_host - set url to svcp
* customswf - will be loadded "swf/video-js-custom-vxg.swf"
* hls - force open hls for live

## Translates

### Default source translates
* src/lang/en.json
* src/lang/ru.json
* src/lang/<other>.json
* src/lang/ko.json

### Custom translates
* In folder src/lang/<vendorname>/
* In folder src/lang/VXG/
* In folder src/lang/VXG_DEV/
* ...
* In folder src/lang/VXG_DOC/


## cc.js (custom config) example


	window.cc = {
		title: "Video Experts Group",
		subtitle: "Cloud Video Platform",
		clips: true,
		clips_tags: false,
		shared_clips: false,
		account_sharing_clips: false, // deprecated
		timeline_menu_condition_of_cache: false,
		timeline_recordsHeight: 5, // ui for timeline
		timeline_recordsY: 10, // ui for timeline
		vendor: 'PKG_COMMON', // vendor
		goto_first_camera: false, // if you wish show only player
		is_package_sample: true, // if sample package
		clip_creation_delete_after: null, // in sec
		clip_min_length: 5, // in sec
		clip_max_length: null, // in sec
		plugins_ui: [ // loading some plugins
			'js/CloudUI.plugin.CamerasList6x2.min.js'
		]
	};
	document.title = cc.title;
