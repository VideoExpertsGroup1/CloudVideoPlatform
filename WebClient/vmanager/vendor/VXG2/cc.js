window.cc = {
	title: "Video Experts Group",
	subtitle: "Smart choice for smart camera",
	secure_password: true,
	clips: true,
	clips_tags: false,
	shared_clips: false,
	account_sharing_clips: false, // deprecated
	extend_account_settings: function(app, settings_template){
	},
	timeline_menu_condition_of_cache: false,
	timeline_recordsHeight: 20,
	timeline_recordsY: 0,
	vendor: 'VXG2',
	goto_first_camera: false,
	clip_creation_delete_after: null, // in sec
	clip_min_length: 5, // in sec
	clip_max_length: null // in sec
};
document.title = cc.title;
