if(!window.CameraSettings) window.CameraSettings = {};

CameraSettings.prepareArray = function(stream_caps){
	console.log("prepareArray");
	var qualitys = [
		{'value': -4, 'name': CloudUI.polyglot.t("Extremely Low")},
		{'value': -3, 'name': CloudUI.polyglot.t("Very Low")},
		{'value': -2, 'name': CloudUI.polyglot.t("Low")},
		{'value': -1, 'name': CloudUI.polyglot.t("Economy")},
		{'value': 0, 'name': CloudUI.polyglot.t("Normal")},
		{'value': 1, 'name': CloudUI.polyglot.t("High")},
		{'value': 2, 'name': CloudUI.polyglot.t("Fine")},
		{'value': 3, 'name': CloudUI.polyglot.t("Extra Fine")},
		{'value': 4, 'name': CloudUI.polyglot.t("Ultra Fine")}
	];
	var min = stream_caps.caps[0].vbr_quality[0];
	var max = stream_caps.caps[0].vbr_quality[1];
	
	
}
