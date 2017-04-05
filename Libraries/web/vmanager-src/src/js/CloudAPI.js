window.SkyVR = {};
window.CloudAPI = window.SkyVR;
// window.CloudAPI = window.CloudAPI || {};
window.CloudAPI.description = "API Lib For CloudAPI. Network Layer Between FrontEnd And BackEnd.";

window.CloudAPI.config = {
	url: "",
	url_cameras: "",
	url_api: "",
	cameraID: "",
	user_name: "",
	vendor: ""
};

window.CloudAPI.lang = function(){
	return CloudAPI.sLang || CloudAPI.locale();
};

window.CloudAPI.locale = function() {
	langs = ['en', 'ko', 'ru']
	CloudAPI.sLang = 'en';
	if(CloudAPI.containsPageParam('lang') && langs.indexOf(CloudAPI.pageParams['lang']) >= -1){
		CloudAPI.sLang = CloudAPI.pageParams['lang'];
	} else if (navigator) {
		var navLang = 'en';
		navLang = navigator.language ? navigator.language.substring(0,2) : navLang;
		navLang = navigator.browserLanguage ? navigator.browserLanguage.substring(0,2) : navLang;
		navLang = navigator.systemLanguage ? navigator.systemLanguage.substring(0,2) : navLang;
		navLang = navigator.userLanguage ? navigator.userLanguage.substring(0,2) : navLang;
		CloudAPI.sLang =  langs.indexOf(navLang) >= -1 ? navLang : CloudAPI.sLang;
	} else {
		CloudAPI.sLang = 'en';
	}
	return CloudAPI.sLang;
};

window.CloudAPI.setToCookie = function(name, value) {
	var date = new Date( new Date().getTime() + (7 * 24 * 60 * 60 * 1000) ); // cookie on week
	document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/; expires="+date.toUTCString();
}

window.CloudAPI.getFromCookie = function(name) {
	var matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : '';
}

window.CloudAPI.removeFromCookie = function(name) {
	document.cookie = encodeURIComponent(name) + "=; path=/;";
}

window.CloudAPI.cache = {
	cameras: {},
	timezones: {}
};

window.CloudAPI.cache.cameraInfo = function(camid){
	if(camid)
		return CloudAPI.cache.cameras[camid];
	else if(CloudAPI.isCameraID())
		return CloudAPI.cache.cameras[SkyVR.cameraID()];
};

// symlink
window.CloudAPI.cache.getCameraInfo = CloudAPI.cache.cameraInfo;

window.CloudAPI.cache.mergeObjects = function(obj1, obj2){
	// rewrite options
	for(var k in obj2){
		var t = typeof obj2[k];
		if(t == "boolean" || t == "string" || t == "number"){
			if(obj1[k] != obj2[k]){
				if(obj1[k]){
					console.log("Changed " + k);
				}
				obj1[k] = obj2[k];
			}
		}else if(Array.isArray(obj2[k])){
			obj1[k] = obj2[k];
		}else if(t == "object"){
			if(!obj1[k]) obj1[k] = {};
			obj1[k] = CloudAPI.cache.mergeObjects(obj1[k], obj2[k]);
		}
	}
	return obj1;
}

window.CloudAPI.cache.updateCameraInfo = function(cam){
	var camid = cam.id;
	if(!CloudAPI.cache.cameras[camid]){
		CloudAPI.cache.cameras[camid] = {};
	};
	CloudAPI.cache.cameras[camid] = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[camid], cam);
}

window.CloudAPI.cache.setCameraInfo = function(cam){
	var camid = cam.id;
	if(SkyVR.cache.cameras[camid] == undefined){
		SkyVR.cache.cameras[camid] = {};
	};
	var changed_p2p_settings = cam['p2p_streaming'] && cam['p2p_streaming'] == true ? true : false; // need request
	
	var prev_cam = CloudAPI.cache.cameras[camid];
	CloudAPI.cache.cameras[camid] = CloudAPI.cache.mergeObjects(prev_cam, cam);

	// TODO clean rewrite options (exclude p2p and p2p_settings and video and audio struct)
	CloudAPI.cache.cameras[camid]['lastTimeUpdated'] = Date.now();
	// console.log("[CLOUDAPI] SkyVR.cache.cameras[" + camid + "]: ", SkyVR.cache.cameras[camid]);
	return changed_p2p_settings;
};
window.CloudAPI.cache.setP2PSettings = function(cameraID, p2p_settings){
	if(SkyVR.cache.cameras[cameraID] == undefined){
		SkyVR.cache.cameras[cameraID] = {};
	}
	/*for(var k in cam){
	var t = typeof cam[k];
	// console.log("Type: " + t);
	if(t == "boolean" || t == "string" || t == "number"){
		if(SkyVR.cache.cameras[camid][k] != cam[k]){
			if(SkyVR.cache.cameras[camid][k])
				console.log("Changed " + k);
			SkyVR.cache.cameras[camid][k] = cam[k];
		}*/
	SkyVR.cache.cameras[cameraID].p2p = p2p_settings;
	SkyVR.cache.cameras[cameraID].p2p_settings = SkyVR.cache.cameras[cameraID].p2p;
	// console.log("[CLOUDAPI] setP2PSettings. SkyVR.cache.cameras[" + cameraID + "]: ", SkyVR.cache.cameras[cameraID]);
};
window.CloudAPI.cache.setMemoryCard = function(cameraID, memory_card){
	if(SkyVR.cache.cameras[cameraID] == undefined){
		SkyVR.cache.cameras[cameraID] = {};
	}
	SkyVR.cache.cameras[cameraID].memory_card = memory_card;
};
window.CloudAPI.cache.updateCameraAudio = function(cameraID, audio_struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]["audio"]){
		CloudAPI.cache.cameras[cameraID]["audio"] = {};
	}
	SkyVR.cache.cameras[cameraID].audio = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[cameraID].audio, audio_struct);
};
window.CloudAPI.cache.cameraAudio = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	return CloudAPI.cache.cameras[cameraID].audio;
};
window.CloudAPI.cache.updateCameraVideo = function(cameraID, video_struct){
	if(!SkyVR.cache.cameras[cameraID]){
		SkyVR.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]["video"]){
		CloudAPI.cache.cameras[cameraID]["video"] = {};
	}
	var video = CloudAPI.cache.cameras[cameraID]["video"];
	CloudAPI.cache.cameras[cameraID]["video"] = CloudAPI.cache.mergeObjects(video, video_struct);
};
window.CloudAPI.cache.cameraVideo = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	return CloudAPI.cache.cameras[cameraID].video;
}
window.CloudAPI.cache.cameraVideoStreamName = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	var video = CloudAPI.cache.cameras[cameraID].video;
	if(video.streams){
		for(var v in video.streams){
			return v;
		}
	}
	return;
};
window.CloudAPI.cache.cameraVideoStreams = function(cameraID){
	cameraID = cameraID || CloudAPI.cameraID();
	if(!CloudAPI.cache.cameras[cameraID]){
		return {};
	};
	var video = CloudAPI.cache.cameras[cameraID].video;
	if(video.streams){
		return video.streams;
	}
	return;
};
window.CloudAPI.cache.setLimits = function(cameraID, struct_limits){
	if(!SkyVR.cache.cameras[cameraID]){
		SkyVR.cache.cameras[cameraID] = {};
	};
	SkyVR.cache.cameras[cameraID].limits = struct_limits;
};
window.CloudAPI.cache.updateCameraVideoStream = function(cameraID, vs_id, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']){
		CloudAPI.cache.cameras[cameraID]['video'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']['streams']){
		CloudAPI.cache.cameras[cameraID]['video']['streams'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id]){
		CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id];
	CloudAPI.cache.cameras[cameraID]['video']['streams'][vs_id] = CloudAPI.cache.mergeObjects(prev, struct);
}
window.CloudAPI.cache.setAudioStream = function(cameraID, as_id, struct){
	if(!SkyVR.cache.cameras[cameraID]){
		SkyVR.cache.cameras[cameraID] = {};
	};
	if(!SkyVR.cache.cameras[cameraID]['audio']){
		SkyVR.cache.cameras[cameraID]['audio'] = {};
	};
	if(!SkyVR.cache.cameras[cameraID]['audio']['streams']){
		SkyVR.cache.cameras[cameraID]['audio']['streams'] = {};
	};
	SkyVR.cache.cameras[cameraID]['audio']['streams'][as_id] = struct;
}
window.CloudAPI.cache.setMediaStreams = function(cameraID, media_streams_struct){
	if(!SkyVR.cache.cameras[cameraID]){
		SkyVR.cache.cameras[cameraID] = {};
	};
	SkyVR.cache.cameras[cameraID]['media_streams'] = media_streams_struct;
};
window.CloudAPI.cache.updateEventProcessingEventsMotion = function(cameraID, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']){
		CloudAPI.cache.cameras[cameraID]['event_processing'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'];
	CloudAPI.cache.cameras[cameraID]['event_processing']['events']['motion'] = CloudAPI.cache.mergeObjects(prev, struct);
};
window.CloudAPI.cache.updateCameraEventProcessingEventsSound = function(cameraID, struct){
	if(!CloudAPI.cache.cameras[cameraID]){
		CloudAPI.cache.cameras[cameraID] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']){
		CloudAPI.cache.cameras[cameraID]['event_processing'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events'] = {};
	};
	if(!CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound']){
		CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'] = {};
	};
	var prev = CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'];
	CloudAPI.cache.cameras[cameraID]['event_processing']['events']['sound'] = CloudAPI.cache.mergeObjects(prev, struct);
};

window.CloudAPI.parsePageParams = function() {
	var loc = window.location.search.slice(1);
	var arr = loc.split("&");
	var result = {};
	var regex = new RegExp("(.*)=([^&#]*)");
	for(var i = 0; i < arr.length; i++){
		if(arr[i].trim() != ""){
			p = regex.exec(arr[i].trim());
			// console.log("results: " + JSON.stringify(p));
			if(p == null){
				result[decodeURIComponent(arr[i].trim().replace(/\+/g, " "))] = '';
			}else{
				result[decodeURIComponent(p[1].replace(/\+/g, " "))] = decodeURIComponent(p[2].replace(/\+/g, " "));
			};
		};
	};
	return result;
};
window.CloudAPI.pageParams = CloudAPI.parsePageParams();
window.CloudAPI.containsPageParam = function(name){
	return (typeof CloudAPI.pageParams[name] !== "undefined");
};
window.CloudAPI.generateNewLocation = function(page){
	var params = [];
	if(CloudAPI.containsPageParam("lang"))
		params.push("lang=" +encodeURIComponent(CloudAPI.pageParams["lang"]));
	if(CloudAPI.containsPageParam("vendor"))
		params.push("vendor=" +encodeURIComponent(CloudAPI.pageParams["vendor"]));
	if(CloudAPI.containsPageParam("mobile"))
		params.push('mobile=' + encodeURIComponent(CloudAPI.pageParams['mobile']))
	params.push("p=" +encodeURIComponent(page));
	return "?" + params.join("&");
}

window.CloudAPI.changeLocationState = function(newPageParams){
	var url = '';
	var params = [];
	if(CloudAPI.containsPageParam("lang"))
		params.push('lang=' + encodeURIComponent(CloudAPI.pageParams['lang']))
	if(CloudAPI.containsPageParam("url"))
		params.push('lang=' + encodeURIComponent(CloudAPI.pageParams['url']))
	if(CloudAPI.containsPageParam("fcno"))
		params.push('fcno=' + encodeURIComponent(CloudAPI.pageParams['fcno']))
	if(CloudAPI.containsPageParam("vendor"))
		params.push('vendor=' + encodeURIComponent(CloudAPI.pageParams['vendor']))
	if(CloudAPI.containsPageParam("demo"))
		params.push('demo=' + encodeURIComponent(CloudAPI.pageParams['demo']))
	if(CloudAPI.containsPageParam("hls"))
		params.push('hls=' + encodeURIComponent(CloudAPI.pageParams['hls']))
	if(CloudAPI.containsPageParam("svcp_host"))
		params.push('svcp_host=' + encodeURIComponent(CloudAPI.pageParams['svcp_host']))
	if(CloudAPI.containsPageParam("mobile"))
		params.push('mobile=' + encodeURIComponent(CloudAPI.pageParams['mobile']))
	for(var p in newPageParams){
		params.push(encodeURIComponent(p) + "=" + encodeURIComponent(newPageParams[p]));
	}
	var new_url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.join("&");
	try{
		if(window.history.pushState)
			window.history.pushState(newPageParams, document.title, new_url);
		else
			console.error("window.history.pushState - function not found");
	}catch(e){
		console.error("changeLocationState: Could not change location to " + new_url);
	}
	CloudAPI.pageParams = CloudAPI.parsePageParams();
}

window.CloudAPI.setURL = function(url){
	if(CloudAPI.config.url != url){
		CloudAPI.config.url = url;
		CloudAPI.config.url_api = url+"api/v2/";
		CloudAPI.config.url_cameras = url+"api/v2/cameras/";
		CloudAPI.config.url_admin_cameras = url+"api/v2/admin/cameras/";
		CloudAPI.config.url_camsess = url+"api/v2/camsess/";
		CloudAPI.config.url_server = url+"api/v2/server/";
		CloudAPI.config.url_account = url+"api/v2/account/";
		CloudAPI.config.url_cmngrs = url+"api/v2/cmngrs/";
		CloudAPI.config.url_storage = url+"api/v2/storage/";
		CloudAPI.config.url_clips = url+"api/v2/storage/clips/";
		CloudAPI.config.anonToken = {
			token: '',
			type: 'anon',
			expire: '',
			expireTimeUTC: 0
		};
		// console.log(localStorage);
		if(localStorage.getItem('SkyVR_anonToken'))
			CloudAPI.config.anonToken = JSON.parse(localStorage.getItem('SkyVR_anonToken'));
		CloudAPI.config.apiToken = {
			token: '',
			type: 'api',
			expire: '',
			expireTimeUTC: 0
		};
		CloudAPI.config.shareToken = {};
		var old_token = CloudAPI.getFromStorage('SkyVR_apiToken');
		if(old_token){
			var apiToken = JSON.parse(old_token)
			if(apiToken.expireTimeUTC > Date.now()){
				CloudAPI.config.apiToken = apiToken;
			}
		}
		CloudAPI.setToStorage('CloudAPI_svcp_host', url);
	};
};


CloudAPI.isExpiredApiToken = function(){
	if(CloudAPI.config.apiToken.expireTimeUTC){
		if(CloudAPI.config.apiToken.expireTimeUTC > Date.now()){
			return false;
		}else{
			return true;
		}
	}else{
		return true;
	}
}

CloudAPI.applyApiToken = function(){
	$.ajaxSetup({
		crossDomain: true,
		cache: false,
		beforeSend: function(xhr,settings) {
			if(CloudAPI.config.apiToken && CloudAPI.config.apiToken.token) {
				xhr.setRequestHeader('Authorization', 'SkyVR ' + CloudAPI.config.apiToken.token);
			}
		}
	});
}
$.support.cors = true;

CloudAPI.updatePageProgressCaption = function(){
	
	var loading_translate = {
		'en' : 'Loading...',
		'ru' : 'Загрузка...',
		'ko' : '카메라 정보 가져오는 중...',
		'it' : 'Caricamento in corso...'
	}
	
	try{
		if(document.getElementById('progress-caption')){
			if(loading_translate[CloudAPI.lang()]){
				document.getElementById('progress-caption').innerHTML = loading_translate[CloudAPI.lang()];
			}else{
				document.getElementById('progress-caption').innerHTML = loading_translate["en"];
			}
		}
	}catch(e){
	}
}

window.CloudAPI.loadVendorScripts = function(vendor, path){
	if(vendor != ''){
		var js = document.createElement("script");
		js.type = "text/javascript";
		js.src = (path ? path : './') + 'vendor/' + vendor + "/cc.js";
		document.head.appendChild(js);
		
		js.onload = function(){
			CloudAPI.updatePageProgressCaption(); // TODO move to CloudUI
			if(CloudAPI.containsPageParam("customswf")){
				cc.custom_videojs_swf = "swf/video-js-custom-vxg.swf";
			}

			if(CloudAPI.onLoadedVendorScript){
				CloudAPI.onLoadedVendorScript();
			}
		}

		js.onerror = function(){
			console.error("Not found vendor use default");
			CloudAPI.config.vendor = 'VXG';
			CloudAPI.loadVendorScripts(CloudAPI.config.vendor, path);
		}

		var cc_css = document.createElement("link");
		cc_css.rel = "stylesheet";
		cc_css.href = (path ? path : './') + "vendor/" + vendor + "/cc.min.css";
		document.head.appendChild(cc_css);
		
		var cc_css2 = document.createElement("link");
		cc_css2.rel = "stylesheet";
		cc_css2.href = (path ? path : './') + "vendor/" + vendor + "/pageloader.min.css";
		document.head.appendChild(cc_css2);
	}else{
		// Load default scripts
		console.log('Not found vendor');
		CloudAPI.loadVendorScripts('VXG', path);
	}
};

CloudAPI.updateApiToken = function(){
	var d = $.Deferred();
	$.ajax({
		url: CloudAPI.config.url_account + "token/api/",
		type: 'GET',
		contentType: 'application/json'
	}).done(function(new_token){
		CloudAPI.config.apiToken.token = new_token.token;
		CloudAPI.config.apiToken.expire = new_token.expire;
		CloudAPI.config.apiToken.expireTimeUTC = Date.parse(new_token.expire + "Z");
		CloudAPI.config.apiToken.type = new_token.type;
		CloudAPI.setToStorage('SkyVR_apiToken', JSON.stringify(SkyVR.config.apiToken));
		console.log("Updated token: ", SkyVR.config.apiToken);
		d.resolve(new_token);
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.url = function() {
	return CloudAPI.config.url;
};

CloudAPI.setCameraID = function(id){
	if(CloudAPI.config.cameraID != id && id){
		CloudAPI.config.cameraID = id;
		console.log("[CLOUDAPI] new cam id: " + id);
		if(!CloudAPI.cache.camera){
			SkyVR.cameraInfo().done(function(cam){
				CloudAPI.cache.camera = cam;
			});
		}
	} else if (!id){
		CloudAPI.config.cameraID = undefined;
		CloudAPI.cache.camera = undefined;
	}
};
CloudAPI.cameraID = function(){
	return CloudAPI.config.cameraID;
};
CloudAPI.cameraManagerID = function(){
	return CloudAPI.cache.cameras[CloudAPI.config.cameraID]['cmngrid'];
};
CloudAPI.isCameraID = function(){
	if(CloudAPI.config.cameraID == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return true;
};
CloudAPI.isP2PStreaming_byId = function(camid){
	var cam = SkyVR.cache.cameras[camid];
	if(cam && cam['p2p_streaming'] && cam.p2p_streaming == true){
		return true;
	}
	return false;
};
CloudAPI.isP2PStreaming = function(){
	if(SkyVR.cache.cameraInfo() == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return SkyVR.isP2PStreaming_byId(SkyVR.cache.cameraInfo().id);
};

CloudAPI.hasMemoryCard_byId = function(camid){
	var cam = SkyVR.cache.cameras[camid];
	if(cam && cam['memory_card'] && cam.memory_card.status != "none"){
		return true;
	}
	return false;
}

CloudAPI.hasMemoryCard = function(){
	if(SkyVR.cache.cameraInfo() == undefined){
		console.error("[CLOUDAPI] cameraID is undefined");
		return false;
	};
	return SkyVR.hasMemoryCard_byId(SkyVR.cache.cameraInfo().id);
}

CloudAPI.parseUTCTime = function(str){
	str = str.replace(new RegExp('-', 'g'), ' ');
	str = str.replace(new RegExp('T', 'g'), ' ');
	str = str.replace(new RegExp(':', 'g'), ' ');
	var arr = str.split(' ');
	var d = new Date();
	d.setUTCFullYear(parseInt(arr[0],10));
	d.setUTCMonth(parseInt(arr[1],10)-1);
	d.setUTCDate(parseInt(arr[2],10));
	d.setUTCHours(parseInt(arr[3],10));
	d.setUTCMinutes(parseInt(arr[4],10));
	d.setUTCSeconds(parseInt(arr[5],10));
	return d.getTime();
}

CloudAPI.convertUTCTimeToUTCStr = function(t){
	var d = new Date();
	d.setTime(t);
	var str = d.getUTCFullYear() + "-"
		+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "-"
		+ ("00" + d.getUTCDate()).slice(-2) + "T"
		+ ("00" + d.getUTCHours()).slice(-2) + ":"
		+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
		+ ("00" + d.getUTCSeconds()).slice(-2);
	return str;
};

CloudAPI.convertUTCTimeToStr = function(t){
	var d = new Date();
	d.setTime(t);
	var monthesTrans = ["short_Jan", "short_Feb", "short_Mar",
		"short_Apr", "short_May", "short_June",
		"short_July", "short_Aug", "short_Sep",
		"short_Oct", "short_Nov", "short_Dec"
	];
	var str = d.getUTCDate() + SkyUI.polyglot.t(monthesTrans[d.getUTCMonth()]) + " " + d.getUTCFullYear() + " "
		+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
	if(CloudAPI.lang() == 'ko'){
		str = ("00" + (d.getUTCMonth() + 1)).slice(-2) + '/' + ("00" + d.getUTCDate()).slice(-2) + "/" + d.getUTCFullYear() + " "
			+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
	}
	return str;
};

CloudAPI.convertUTCTimeToSimpleStr = function(t){
	var d = new Date();
	d.setTime(t);
	var str = d.getUTCFullYear() + "-"
		+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "-"
		+ ("00" + d.getUTCDate()).slice(-2) + " "
		+ ("00" + d.getUTCHours()).slice(-2) + ":"
		+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
		+ ("00" + d.getUTCSeconds()).slice(-2);
	return str;
}

// helper function
window.CloudAPI.getOffsetTimezone = function() {
	var cam = CloudAPI.cache.cameraInfo();
	if(!cam) return 0;
	if(CloudAPI.cache.timezones[cam.timezone] == undefined){
		var n = new Date();
		if(cam.timezone && cam.timezone != ""){
			var cameraOffset = moment(n).tz(cam.timezone).format("Z");
			var c = cameraOffset[0];
			if(c < '0' || c > '9'){
				cameraOffset = cameraOffset.substring(1);
			};
			var ts_sig = (c == '-') ? -1 : 1;
			var hs = cameraOffset.split(":");
			cameraOffset = ts_sig *(parseInt(hs[0],10)*60 + parseInt(hs[1],10));
			CloudAPI.cache.timezones[cam.timezone] = cameraOffset*60000;
		}else{
			CloudAPI.cache.timezones[cam.timezone] = 0;
		}
	}
	return CloudAPI.cache.timezones[cam.timezone];
}
window.CloudAPI.getCurrentTimeUTC = function(){
	return Date.now();
};
window.CloudAPI.getCurrentTimeByCameraTimezone = function(){
	return Date.now() + CloudAPI.getOffsetTimezone();
};
window.CloudAPI.enable401handler = function() {
	/*$.ajaxSetup({
		error : function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status == 401 && jqXHR.statusText == "UNAUTHORIZED") {
				
				var uri = SkyVR.parseUri(CloudAPI.url);
				var uri2 = SkyVR.parseUri(SkyVR.config.url);
				if(uri.host == "" || uri.host == uri2.host){
					SkyVR.disable401handler();

					if(application.apiToken) {
						application.apiToken.destroy();
					}
					application.cleanupHeader();
					try{ application.player.disposeVideo(); }catch(e) { console.error(e); }
					try{ application.timeline.dispose(); }catch(e) { console.error(e); }

					event.trigger(event.UNAUTHORIZED_REQUEST);
					// application.trigger('showSignIn');
					// window.location = "?";
				}
			}
		}
	});*/
};
window.CloudAPI.disable401handler = function() {
	$.ajaxSetup({
		error : function(jqXHR, textStatus, errorThrown) {
		}
	});
};
window.CloudAPI.printStack = function(){
	var err = new Error();
	console.error(err.stack);
};
// constants for pages
window.CloudAPI.PAGE_SIGNIN = "signin";

/*	CloudAPI.getUTC = function(camtimezone){
	var now = new Date();
	var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	var d = new Date.now();
	var t = d.getTimezoneOffset();
};*/

window.CloudAPI.hasAccess = function(caminfo, rule){
	if(SkyUI.isDemo()) return true;
	if(!caminfo) return false;
	if(!caminfo['access']) return true;
	var bResult = false;
	for(var s in caminfo['access']){
		if(caminfo['access'][s] == rule)
			bResult = true;
	}
	return bResult;
}

window.CloudAPI.hasAccessSettings = function(caminfo){
	if(SkyUI.isDemo()) return true;
	caminfo = caminfo || CloudAPI.cache.cameraInfo();
	return SkyVR.hasAccess(caminfo, "all");
}

window.CloudAPI.hasAccessClips = function(caminfo){
	if(SkyUI.isDemo())return true;
	return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "clipplay") || SkyVR.hasAccess(caminfo, "watch") || SkyVR.hasAccess(caminfo, "cplay") || SkyVR.hasAccess(caminfo, "all");
}

window.CloudAPI.hasAccessLive = function(caminfo){
	if(SkyUI.isDemo())return true;
	return SkyVR.hasAccess(caminfo, "ptz") || SkyVR.hasAccess(caminfo, "live") || SkyVR.hasAccess(caminfo, "watch") || SkyVR.hasAccess(caminfo, "all");
}

window.CloudAPI.hasAccessPlayback = function(caminfo){
	if(SkyUI.isDemo())return true;
	return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "play") || SkyVR.hasAccess(caminfo, "watch") || SkyVR.hasAccess(caminfo, "splay") || SkyVR.hasAccess(caminfo, "all");
}

window.CloudAPI.hasAccessMakeClip = function(caminfo){
	if(SkyUI.isDemo())return true;
	return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "all");
}

window.CloudAPI.handleNothing = function(response){
	// nothing
};

window.CloudAPI.handleNothingError = function(xhr, ajaxOptions, thrownError){
	// nothing
};
window.CloudAPI.handleError = function(xhr, ajaxOptions, thrownError){
	console.error(thrownError);
};

CloudAPI.parseUri = function(str) {
	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	function parseUri(str) {
		var	o   = parseUri.options,
			m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
			uri = {},
			i   = 14;

		while (i--) uri[o.key[i]] = m[i] || "";

		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});

		return uri;
	};
	parseUri.options = {
		strictMode: false,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q:   {
			name:   "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		}
	};
	return parseUri(str)
};

CloudAPI.logout = function(callback){
	$.ajax({
		url: CloudAPI.config.url_account + "logout/",
		type: 'POST',
		success: callback,
		error: SkyVR.handleError
	});
};
CloudAPI.cameraVideoStream = function(vs_id){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateCameraVideoStream(camid, vs_id, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraLimits = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/limits/",
		type : "GET"
	}).done(function(response){
		SkyVR.cache.setLimits(SkyVR.cameraID(), response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraEventProcessingEventsMotion = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/motion/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateEventProcessingEventsMotion(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
}
CloudAPI.updateCameraEventProcessingEventsMotion = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/motion/",
		type : 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		CloudAPI.cache.updateEventProcessingEventsMotion(camid, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

window.CloudAPI.cameraEventProcessingEventsSound = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.config.cameraID;
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/sound/",
		type : "GET"
	}).done(function(response){
		CloudAPI.cache.updateCameraEventProcessingEventsSound(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
}

window.CloudAPI.cameraSendPtz = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/send_ptz/",
		type : 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log(response);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.updateCameraEventProcessingEventsSound = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/event_processing/events/sound/",
		type : 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		// console.log("");
		CloudAPI.cache.updateCameraEventProcessingEventsSound(camid, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.updateCameraVideoStream = function(vs_id, data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = SkyVR.cameraID();
	$.ajax({
		url : CloudAPI.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
		type : "PUT",
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		console.log("[CLOUDAPI] [CLOUDAPI] Updated video/streams/" + vs_id + " in cache for " + camid);
		CloudAPI.cache.updateCameraVideoStream(camid, vs_id, data);
		d.resolve();
	}).fail(function(){
		d.reject();
	})
	return d;
};
// depreacted please use updateCameraVideoStream
window.CloudAPI.setVBRQuality = function(newValue, vs_id, cb_success, cb_error){
	if(!CloudAPI.isCameraID()) return;
	cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
	var data = {};
	data.vbr_quality = newValue;
	data.vbr = true;
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/video/streams/" + vs_id + "/",
		type: 'PUT',
		success: cb_success,
		error: cb_success,
		data:  JSON.stringify(data),
		contentType: 'application/json'
	});
};
window.CloudAPI.formatMemoryCard = function(){
	var d = $.Deferred();
	if(!SkyVR.isCameraID()){
		d.reject();
		return d;
	}
	var camid = SkyVR.config.cameraID;
	$.ajax({
		url: SkyVR.config.url_cameras + camid + "/format_memory_card/",
		type: 'POST'
	}).done(function(response){
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.cameraMemoryCard = function(camid){
	var d = $.Deferred();
	var camid = camid || SkyVR.config.cameraID;
	if(!camid){
		d.reject();
		return d;
	}
	$.ajax({
		url: SkyVR.config.url_cameras + camid + "/memory_card/",
		type: 'GET'
	}).done(function(response){
		SkyVR.cache.setMemoryCard(camid, response)
		d.resolve(response);
	}).fail(function(){
		SkyVR.cache.setMemoryCard(camid, { "status" : "none" });
		d.reject();
	});
	return d;
};

CloudAPI.cameraWifi = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/wifi/",
		type: 'GET'
	}).done(function(response){
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.cameraFirmwares = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/firmwares/?limit=1000",
		type: 'GET',
		contentType: 'application/json'
	}).done(function(response){
		d.resolve(response.objects);
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.cameraFirmwaresUpgrade = function(version){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()){
		d.reject();
		return d;
	}
	console.log("[CLOUDAPI] upgrade firmware to version: " + version);
	var data = {};
	data.version = version;
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.config.cameraID + "/firmwares/upgrade/",
		type: 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(){
		d.resolve();
	}).fail(function(jqXHR, textStatus){
		console.error("[CLOUDAPI] cameraFirmwaresUpgrade, " + textStatus, jqXHR);
		d.reject();
	});
	return d;
};

CloudAPI.accountInfo = function(){
	var d = $.Deferred();
	$.ajax({
		url: CloudAPI.config.url_account,
		type: 'GET',
		cache : false
	}).done(function(r){
		CloudAPI.cache.account = r;
		d.resolve(r);
	}).fail(function(r){
		console.log("Fail " + CloudAPI.config.url_account);
		console.error(r);
		d.reject(r);
	});
	return d;
}

window.CloudAPI.anonToken = function(){
	var d = $.Deferred();
	var now = Date.now();
	var min = SkyVR.config.anonToken.expireTimeUTC - 10*60*1000; // 10 min
	var max = SkyVR.config.anonToken.expireTimeUTC - 5*60*1000; // 5 min
	if(now > min && now < max){
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			headers:{
				'Authorization': 'SkyVR ' + SkyVR.config.anonToken.token
			}
		});
		d.resolve(SkyVR.config.anonToken);
	}else{
		$.ajax({
			url: CloudAPI.config.url_account + "token/anon/",
			type: 'GET'
		}).done(function(tk){
			SkyVR.config.anonToken.token = tk.token;
			SkyVR.config.anonToken.type = tk.type;
			SkyVR.config.anonToken.expire = tk.expire;
			SkyVR.config.anonToken.expireTimeUTC = Date.parse(tk.expire+'Z');
			CloudAPI.setToStorage('SkyVR_anonToken', JSON.stringify(SkyVR.config.anonToken));
			$.ajaxSetup({
				crossDomain: true,
				cache: false,
				headers:{
					'Authorization': 'SkyVR ' + tk.token
				}
			});
			d.resolve(SkyVR.config.anonToken);
		}).fail(function(){
			d.reject();
		});
	}
	return d;
};

CloudAPI.accountShare = function(data){
	var params = {};
	params.camid = SkyVR.cameraID();
	return $.ajax({
		url: CloudAPI.config.url_account + 'share/',
		type: 'POST',
		data:  JSON.stringify(data),
		contentType: 'application/json',
		cache : false
	});
};
CloudAPI.capabilities = function(cb_success, cb_error){
	cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
	$.ajax({
		url: SkyVR.config.url_api + "capabilities/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
};

CloudAPI.cameraInfo = function(camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID();
	if(camid == undefined){
		d.reject();
		return d;
	}
	return $.ajax({
		url: CloudAPI.config.url_cameras + camid + "/",
		type: 'GET'
	}).done(function(response){
		
		if(SkyVR.cache.cameras[response.id] && !SkyVR.cache.cameras[response.id]["memory_card"]){
			console.log("cameraInfo cahce has not memory card info for camid=" + response.id);
			SkyVR.cameraMemoryCard(response.id);
		}else if(!SkyVR.cache.cameras[response.id]){
			console.log("cameraInfo has not in cache for camid=" + response.id);
			SkyVR.cameraMemoryCard(response.id);	
		}
		
		
		// SET to cache
		if(SkyVR.cache.setCameraInfo(response)){
			SkyVR.cameraP2PSettings(camid).done(function(p2p_settings){
				d.resolve(SkyVR.cache.cameras[camid]);
			}).fail(function() {
				d.resolve(SkyVR.cache.cameras[camid]);
			});
		}else{
			d.resolve(SkyVR.cache.cameras[camid]);
		}
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.updateCamera = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/",
		type: 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log("[CLOUDAPI] Updated camera in cache for " + CloudAPI.cameraID());
		data.id = CloudAPI.cameraID();
		CloudAPI.cache.updateCameraInfo(data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
window.CloudAPI.updateCameraAudio = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/audio/",
		type: 'PUT',
		data:  JSON.stringify(data),
		contentType: 'application/json'
	}).done(function(response){
		console.log("[CLOUDAPI] Updated audio in cache for " + camid);
		CloudAPI.cache.updateCameraAudio(camid, data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
window.CloudAPI.cameraAudio = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/audio/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.updateCameraAudio(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
window.CloudAPI.cameraVideo = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/video/",
		type: 'GET'
	}).done(function(response){
		CloudAPI.cache.updateCameraVideo(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};
window.CloudAPI.updateCameraVideo = function(data){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = CloudAPI.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/video/",
		type: 'PUT',
		contentType: 'application/json',
		data:  JSON.stringify(data)
	}).done(function(response){
		CloudAPI.cache.updateCameraVideo(camid, data);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

// TODO deprecated
CloudAPI.setCameraVideo = function(new_values, cb_success, cb_error){
	if(!CloudAPI.isCameraID()) return;
	cb_success = cb_success || SkyVR.handleNothing;
	cb_error = cb_error || SkyVR.handleError;
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/video/",
		type: 'PUT',
		success: cb_success,
		error: cb_error,
		contentType: 'application/json',
		data:  JSON.stringify(new_values)
	});
};
CloudAPI.cameraMediaStreams = function(){
	var d = $.Deferred();
	if(!CloudAPI.isCameraID()) {
		d.reject();
		return d;
	}
	var camid = SkyVR.cameraID();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/media_streams/",
		type: 'GET'
	}).done(function(response){
		SkyVR.cache.setMediaStreams(camid, response);
		d.resolve(response);
	}).fail(function(){
		d.reject();
	});
	return d;
};

CloudAPI.updateCameraMediaStreams = function(params, camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID()
	if(!camid) {
		d.reject();
		return d;
	}
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/media_streams/",
		type: 'PUT',
		data:  JSON.stringify(params),
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
};

CloudAPI.cameraLiveUrls = function(camid){
	var d = $.Deferred();
	camid = camid || CloudAPI.cameraID();
	if(!camid){
		d.reject();
		return d;
	}

	$.ajax({
		url: CloudAPI.config.url_cameras + camid + "/live_urls/",
		type: 'GET'
	}).done(function(liveurls){
		d.resolve(liveurls);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
};

window.CloudAPI.cameraBackwardStart = function(){
	if(!CloudAPI.isCameraID()) return;
	var data = {};
	if(!CloudAPI.config.backwardURL) return;
	data.url = CloudAPI.config.backwardURL;
	if(CloudAPI.config.tmpBackwardURL == CloudAPI.config.backwardURL)
		CloudAPI.config.tmpBackwardURLCount++;
	else{
		CloudAPI.config.tmpBackwardURLCount = 1;
		CloudAPI.config.tmpBackwardURL = CloudAPI.config.backwardURL;
	}
	
	if(CloudAPI.isP2PStreaming()){
		console.log("[CLOUDAPI] Send (audio streaming) backward start: " + CloudAPI.config.backwardURL);
		$.ajax({
			url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/audio/backward/start/",
			type: 'POST',
			success: SkyVR.handleNothing,
			data:  JSON.stringify(data),
			contentType: 'application/json'
		});
	}
};

window.CloudAPI.cameraBackwardStop = function(){
	if(!CloudAPI.isCameraID()) return;
	var data = {}
	if(!CloudAPI.config.backwardURL) return;
	data.url = CloudAPI.config.backwardURL;
	// CloudAPI.config.backwardURL = undefined;
	if(CloudAPI.config.tmpBackwardURL == CloudAPI.config.backwardURL){
		if(CloudAPI.config.tmpBackwardURLCount == 0)
			return;
		else
			CloudAPI.config.tmpBackwardURLCount--;
	}

	if(CloudAPI.isP2PStreaming()){
		console.log("[CLOUDAPI] Send (audio streaming) backward stop: " + CloudAPI.config.backwardURL);
		$.ajax({
			url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/audio/backward/stop/",
			type: 'POST',
			success: SkyVR.handleNothing,
			data:  JSON.stringify(data),
			contentType: 'application/json'
		});
	}
};
window.CloudAPI.cameraSchedule = function(){
	if(!CloudAPI.isCameraID()) return;
	return $.ajax({
		url: CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/schedule/",
		type: 'GET',
		cache : false
	});
};
window.CloudAPI.updateCameraSchedule = function(data){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/schedule/",
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
};
window.CloudAPI.hasAccessCameraPreview = function(camid){
	var caminfo = SkyVR.cache.cameraInfo(camid);
	if(!caminfo) return false;
	return SkyVR.hasAccess(caminfo, 'live') || SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
};
window.CloudAPI.cameraPreview = function(cameraID, cb_success, cb_error){
	cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/preview/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
};
window.CloudAPI.hasAccessCameraUpdatePreview = function(camid){
	var caminfo = SkyVR.cache.cameraInfo(camid);
	if(!caminfo) return false;
	return SkyVR.hasAccess(caminfo, 'live') || SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
};
window.CloudAPI.cameraUpdatePreview = function(cameraID){
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/preview/update/",
		type: 'POST'
	});
};	
window.CloudAPI.storageDataFirstRecord = function(startDT){
	var d = $.Deferred();
	var request_data = {
		camid: CloudAPI.cameraID(),
		limit: 1,
		offset: 0
	};
	if(startDT){
		request_data.start = startDT;
	}
	$.ajax({
		url: SkyVR.config.url_storage + "data/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};
window.CloudAPI.storageEventsFirstRecord = function(){
	var d = $.Deferred();
	var request_data = {
		camid: SkyVR.cameraID(),
		limit: 1,
		offset: 0
	};
	$.ajax({
		url: SkyVR.config.url_storage + "events/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};
window.CloudAPI.storageThumbnailsFirstRecord = function(){
	var d = $.Deferred();
	var request_data = {
		camid: SkyVR.cameraID(),
		limit: 1,
		offset: 0
	};
	$.ajax({
		url: SkyVR.config.url_storage + "thumbnails/",
		data: request_data,
		cache : false,
		type: 'GET'
	}).done(function(data){
		if(data.objects.length > 0){
			d.resolve(data.objects[0]);
		}else{
			d.reject();
		}
	}).fail(function(){
		d.reject();
	})
	return d;
};

window.CloudAPI.getAllData = function(url, req_data){
	// TODO
}


window.CloudAPI.storageThumbnails = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		camid: SkyVR.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;
	
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: SkyVR.config.url_storage + "thumbnails/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

CloudAPI.storageTimeline = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		slices: 1,
		camid: SkyVR.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;
		
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: SkyVR.config.url_storage + "timeline/" + SkyVR.cameraID() + "/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

window.CloudAPI.storageData = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		camid: SkyVR.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;
		
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: SkyVR.config.url_storage + "data/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(r){
			req_d.reject(r);
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

window.CloudAPI.storageEvents = function(startDT, endDt){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 1000,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	// TODO if not selected camera
	var request_data = {
		camid: SkyVR.cameraID(),
		limit: result.meta.limit,
		offset: result.meta.offset,
		start: startDT
	};
	if(endDt)
		request_data.end = endDt;
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: SkyVR.config.url_storage + "events/",
			data: req_data,
			cache : false,
			async: true,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

window.CloudAPI.hasAccessMotionDetection = function(camid){
	var caminfo = SkyVR.cache.cameraInfo(camid);
	if(!caminfo) return false;
	return SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
};

window.CloudAPI.cameraMotionDetectionDemo=function(){
	var data=JSON.parse('{"caps": {"columns": 23, "max_regions": 8, "region_shape": "rect", "rows": 15, "sensitivity": "region"}}');
	return data;
};

window.CloudAPI.cameraMotionDetection = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/motion_detection/",
		type: 'GET'
	});
};
window.CloudAPI.cameraMotionDetectionRegionsDemo=function(){
	var data_regions=JSON.parse('{"meta": {"limit": 20, "next": null, "offset": 0, "previous": null, "total_count": 8}, "objects": [{"enabled": true, "id": 2686, "map": "ZmQwMDBjM2ZjMDAwN2Y4MDAwZmYwMDAxZmUwMDAzZmNlNjAw", "name": "motion1", "sensitivity": 5}, {"enabled": true, "id": 2687, "map": "ZjYwMDBmMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmZmMDAw", "name": "motion2", "sensitivity": 5}, {"enabled": true, "id": 2688, "map": "ZjQwMDBmM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmNmMjAw", "name": "motion3", "sensitivity": 5}, {"enabled": true, "id": 2689, "map": "ZWMwMDBjMWZlMDAwM2ZjMDAwN2Y4MDAwZmYwMDAxZmVmNzAw", "name": "motion4", "sensitivity": 5}, {"enabled": true, "id": 2690, "map": "ZTQwMDA2ZTAwMDAxYzAwMDAzODBmOTAw", "name": "motion5", "sensitivity": 5}, {"enabled": true, "id": 2691, "map": "MmIwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmMwMDBmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAw", "name": "motion6", "sensitivity": 5}, {"enabled": true, "id": 2692, "map": "MTJmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMGU4MDA=", "name": "motion7", "sensitivity": 5}, {"enabled": false, "id": 2693, "map": "", "name": "motion8", "sensitivity": 5}]}');
	return data_regions;
};
window.CloudAPI.cameraMotionDetectionRegions = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/motion_detection/regions/",
		type: 'GET'
	});
};

window.CloudAPI.cameraP2PSettings = function(cameraID, cb_success, cb_error, cb_always){
	cameraID = cameraID || SkyVR.cameraID();
	cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
	cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
	cb_always = (cb_always == undefined) ? SkyVR.handleNothing : cb_always;
	return $.ajax({
		url: CloudAPI.config.url_cameras + cameraID + "/p2p_settings/",
		type: 'GET',
		success: function(response){
			SkyVR.cache.setP2PSettings(cameraID, response);
			cb_success(response);
		},
		error: cb_error,
		complete: cb_always
	});
};
window.CloudAPI.cameraSetP2PSettings = function(data){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/p2p_settings/",
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
};
window.CloudAPI.cameraLog = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/log/",
		type: 'GET'
	});
};
window.CloudAPI.cameraLogDownload = function(url){
	var d = $.Deferred();
	var xmlhttp = null;
	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}else{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function(){
		if (xmlhttp.readyState == XMLHttpRequest.DONE){
			if(xmlhttp.status==200)
				d.resolve(xmlhttp.responseText);
			else
				d.reject();
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
	return d.promise();
};
window.CloudAPI.cameraLogUpdate = function(){
	return $.ajax({
		url: CloudAPI.config.url_cameras + SkyVR.cameraID() + "/log/update/",
		type: 'POST'
	});
};
window.CloudAPI.cameraManagersList = function(cb_success, cb_error){
	cb_success = cb_success || SkyVR.handleNothing
	cb_error = cb_error || SkyVR.handleError;
	$.ajax({
		url: CloudAPI.config.url_cmngrs,
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}

window.CloudAPI.cameraManagerReset = function(cmnr_id){
	var params = {};
	return $.ajax({
		url: CloudAPI.config.url_cmngrs + cmnr_id + '/reset/',
		type: 'POST'
	});
}

window.CloudAPI.camerasList = function(params){
	params = params || {};
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 20,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	var request_data = {
		limit: result.meta.limit,
		offset: result.meta.offset
	};
	for(var t in params){
		request_data[t] = params[t];
	}
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: CloudAPI.config.url_cameras,
			data: req_data,
			cache : false,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	function p2pUpdateAndResolve(result){
		var count = 0;
		var len = result.objects.length;
		if(count == len) d.resolve(result);
		for(var i = 0; i < len; i++){
			cam = result.objects[i];
			// SET to cache
			if(SkyVR.cache.setCameraInfo(cam)){
				console.log("update p2p_settings: ", cam.id);
				SkyVR.cameraP2PSettings(cam.id).done(function(p2p_settings){
					// update memory cardinfo
					SkyVR.cameraMemoryCard(cam.id).done(function(){
						count = count + 1;
						if(count == len) d.resolve(result);
					}).fail(function(){
						count = count + 1;
						if(count == len) d.resolve(result);
					});
					// count = count + 1;
					// if(count == len) d.resolve(result);
				}).fail(function(){
					count = count + 1;
					if(count == len) d.resolve(result);
				});
			}else{
				// console.log("p2p_settings updated: ", i, len);
				count = count + 1;
				if(count == len) d.resolve(result);
			}
		}
	}
	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		$.merge(result.objects, data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			p2pUpdateAndResolve(result)
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				p2pUpdateAndResolve(result)
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
}
window.CloudAPI.camerasListByCriterions = function(criterions, cb_success, cb_error){
	cb_success = cb_success || SkyVR.handleNothing
	cb_error = cb_error || SkyVR.handleError;
	
	$.ajax({
		url: CloudAPI.config.url_cameras,
		data: criterions,
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}

window.CloudAPI.cameraManagerInfo = function(cameraManagerID, cb_success, cb_error){
	cb_success = cb_success || SkyVR.handleNothing
	cb_error = cb_error || SkyVR.handleError;
	$.ajax({
		url: CloudAPI.config.url_cmngrs + cameraManagerID + "/",
		type: 'GET',
		success: cb_success,
		error: cb_error
	});
}
window.CloudAPI.cameraManagerSetTimezone = function(cameraManagerID, newTimeZone, cb_success, cb_error){
	cb_success = cb_success || SkyVR.handleNothing
	cb_error = cb_error || SkyVR.handleError;
	var obj = {};
	obj.timezone = newTimeZone;
	$.ajax({
		url: CloudAPI.config.url_cmngrs + cameraManagerID + "/",
		type: 'PUT',
		success: cb_success,
		error: cb_error,
		data:  JSON.stringify(obj),
		contentType: 'application/json'
	});
}

window.CloudAPI.storageClipList = function(){
	var d = $.Deferred();
	var result = {
		meta: {
			limit: 100,
			offset: 0,
			total_count: -1
		},
		objects: []
	};
	var request_data = {
		limit: result.meta.limit,
		offset: result.meta.offset,
		camid: SkyVR.cameraID(),
		usecamtz: ''
	};
	
	function getData(req_data){
		var req_d = $.Deferred();
		$.ajax({
			url: SkyVR.config.url_clips,
			data: req_data,
			cache : false,
			type: 'GET'
		}).done(function(data){
			req_d.resolve(data);
		}).fail(function(){
			req_d.reject();
		});
		return req_d;
	};

	getData(request_data).fail(function(){
		d.reject();
	}).done(function(data){
		result.meta.total_count = data.meta.total_count;
		result.meta.expire = data.meta.expire;
		$.merge(result.objects,data.objects);
		if(data.meta.offset + data.objects.length >= data.meta.total_count){
			d.resolve(result);
		}else{
			var d_all = [];
			for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
				request_data.offset = i;
				d_all.push(getData(request_data));
			}
			// wait all response
			$.when.apply($, d_all).done(function(){
				for (var i=0; i < arguments.length; i++) {
					$.merge(result.objects,arguments[i].objects);
				}
				d.resolve(result);
			}).fail(function(){
				d.reject();
			});
		}
	});
	return d;
};

// deprecated
window.CloudAPI.storageClipListAnon = function(token){
	var d = $.Deferred();
	SkyVR.anonToken().done(function(tk){
		var result = {
			meta: {
				limit: 100,
				offset: 0,
				total_count: -1
			},
			objects: []
		};
		var request_data = {
			limit: result.meta.limit,
			offset: result.meta.offset,
			usecamtz: ''
		};
		if(token) request_data.token = token;
		function getData(req_data){
			var req_d = $.Deferred();
			$.ajax({
				url: SkyVR.config.url_clips,
				data: req_data,
				cache : false,
				type: 'GET',
				headers: {
					'Authorization':'SkyVR ' + tk.token
				}
			}).done(function(data){
				req_d.resolve(data);
			}).fail(function(){
				req_d.reject();
			});
			return req_d;
		};
		
		getData(request_data).fail(function(){
			d.reject();
		}).done(function(data){
			result.meta.total_count = data.meta.total_count;
			result.meta.expire = data.meta.expire;
			$.merge(result.objects,data.objects);
			if(data.meta.offset + data.objects.length >= data.meta.total_count){
				d.resolve(result);
			}else{
				var d_all = [];
				for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
					request_data.offset = i;
					d_all.push(getData(request_data));
				}
				// wait all response
				$.when.apply($, d_all).done(function(){
					for (var i=0; i < arguments.length; i++) {
						$.merge(result.objects,arguments[i].objects);
					}
					d.resolve(result);
				}).fail(function(){
					d.reject();
				});
			}
		});
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.storageClipCreate = function(title, group, start, end, delete_at){
	var data = {};
	data.camid = SkyVR.cameraID();
	data.title = title;
	data.group = group;
	data.start = start;
	data.end = end;
	data.delete_at = delete_at;
	return $.ajax({
		url: CloudAPI.config.url_clips,
		type: 'POST',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	});
}
window.CloudAPI.storageClip = function(clipid){
	return $.ajax({
		url: SkyVR.config.url_clips + clipid + "/",
		type: 'GET',
		cache : false
	});
};

window.CloudAPI.serverTime = function(){
	return $.ajax({
		url: CloudAPI.config.url_server + "time/",
		type: 'GET',
		cache : false
	});
};
window.CloudAPI.storageClipAnon = function(clipid, token){
	var d = $.Deferred();
	var params = {};
	if(token) params.token = token;
	SkyVR.anonToken().done(function(tk){
		$.ajax({
			url: SkyVR.config.url_clips + clipid + "/",
			type: 'GET',
			data: params,
			cache : false,
			headers: {
				'Authorization':'SkyVR ' + tk.token
			}
		}).done(function(data){
			d.resolve(data);
		}).fail(function(){
			d.reject();
		});
	}).fail(function(){
		d.reject();
	});
	return d;
};

window.CloudAPI.storageClipDelete = function(clipid){
	return $.ajax({
		url: CloudAPI.config.url_clips + clipid + "/",
		type: 'DELETE',
		cache : false
	});
};

window.CloudAPI.storageClipUpdate = function(clipid, data){
	return $.ajax({
		url: CloudAPI.config.url_clips + clipid + "/",
		data: JSON.stringify(data),
		type: 'PUT',
		cache : false,
		contentType: 'application/json'
	});
};

window.CloudAPI.storageActivity = function(){
	var params = {
		camid: SkyVR.cameraID(),
		daysincamtz: ''
	};
	return $.ajax({
		url: SkyVR.config.url_storage + "activity/",
		type: 'GET',
		data: params,
		cache : false
	});
};

CloudAPI.cameraSettings = function(){
	var d = $.Deferred();
	var d_all = [];
	function anyway(d){
		var d2 = $.Deferred();
		d.always(function(){ d2.resolve();});
		return d2;
	}
	
	function mediaStreams(){
		var d2 = $.Deferred();
		CloudAPI.cameraMediaStreams().done(function(media_streams){
			console.log("MediaStreams: ", media_streams);
			var ms_arr = media_streams['mstreams_supported'];
			var current_ms = media_streams['live_ms_id'];
			if(ms_arr.length > 0 && current_ms != ''){
				var vs_id = '';
				for(var i = 0; i < ms_arr.length; i++){
					if(ms_arr[i]['id'] == current_ms){
						vs_id = ms_arr[i]['vs_id'];
						break;
					}
				}
				if(vs_id != ''){
					CloudAPI.cameraVideoStream(vs_id).done(function(){
						d2.resolve();
					}).fail(function(){
						d2.reject();
					});
				}else{
					d2.reject();
				}
			}else{
				d2.resolve();
			}
		}).fail(function(){
			d2.reject();
		});
		return d2;
	}

	d_all.push(anyway(mediaStreams()));

	if(!SkyVR.cache.cameraInfo().url){
		d_all.push(anyway(SkyVR.cameraVideo()));
		d_all.push(anyway(SkyVR.cameraAudio()));
		d_all.push(anyway(SkyVR.cameraLimits()));
		d_all.push(anyway(SkyVR.cameraEventProcessingEventsMotion()));
		d_all.push(anyway(SkyVR.cameraEventProcessingEventsSound()));
		d_all.push(anyway(SkyVR.cameraMemoryCard()));
		// d_all.push(anyway(SkyVR.cameraWifi()));
	}

	$.when.apply($, d_all).done(function(){
		d.resolve(SkyVR.cache.cameraInfo());
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudAPI.camsessList = function(params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_camsess,
		data: params,
		type: 'GET',
		cache : false,
	});
}

CloudAPI.camsessInfo = function(id, params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_camsess + id + '/',
		data: params,
		type: 'GET',
		cache : false,
	});
}

CloudAPI.camsessRecords = function(id, params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_camsess + id + '/records/',
		data: params,
		type: 'GET',
		cache : false,
	});
}

window.CloudAPI.cameraCreate = function(data){
	var d = $.Deferred();
	data = data || {};
	$.ajax({
		url: CloudAPI.config.url_cameras,
		type: 'POST',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.cameraDelete = function(camid){
	var d = $.Deferred();
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + '/',
		type: 'DELETE',
		cache : false
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.cameraUpdate = function(camid, data){
	var d = $.Deferred();
	data = data || {};
	$.ajax({
		url: CloudAPI.config.url_cameras + camid + '/',
		type: 'PUT',
		data: JSON.stringify(data),
		cache : false,
		contentType: 'application/json'
	}).done(function(r){
		d.resolve(r);
	}).fail(function(r){
		d.reject(r);
	});
	return d;
}

CloudAPI.adminCameras = function(params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras,
		data: params,
		type: 'GET',
		cache : false,
	});
}

CloudAPI.adminCameraInfo = function(camid){
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras + camid + '/',
		type: 'GET',
		cache : false
	});
}

CloudAPI.updateAdminCamera = function(camid, params){
	params = params || {};
	return $.ajax({
		url: CloudAPI.config.url_admin_cameras + camid + '/',
		type: 'PUT',
		data: JSON.stringify(params),
		contentType: 'application/json',
		cache : false
	});
}

CloudAPI.store = {};
CloudAPI.store.volume = function(v){ if(v) CloudAPI.setToStorage('volume', v); return CloudAPI.getFromStorage('volume'); }
CloudAPI.store.prev_volume = function(v){ if(v) CloudAPI.setToStorage('prev_volume', v); return CloudAPI.getFromStorage('prev_volume'); }
CloudAPI.store.zoom = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom', v); return CloudAPI.getFromStorage('zoom'); }
CloudAPI.store.zoom_left = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom_left', v); return CloudAPI.getFromStorage('zoom_left'); }
CloudAPI.store.zoom_top = function(v){ if(v != undefined) CloudAPI.setToStorage('zoom_top', v); return CloudAPI.getFromStorage('zoom_top'); }
CloudAPI.store.user_profile = function(v){ if(v != undefined) CloudAPI.setToStorage('user_profile', v); return CloudAPI.getFromStorage('user_profile'); }
CloudAPI.store.svcp_host = function(v){ if(v != undefined) CloudAPI.setToStorage('svcp_host', v); return CloudAPI.getFromStorage('svcp_host'); }

CloudAPI.storageTemp = {};
CloudAPI.storageMode = 'local';

CloudAPI.detectStorageMode = function(){
	try{
		localStorage.setItem('detectStorageMode','yes');
	}catch(e){
		CloudAPI.storageMode = 'temp';
	}
}
CloudAPI.detectStorageMode();

CloudAPI.setToStorage = function(k,v){
	if(CloudAPI.storageMode == 'local'){
		localStorage.setItem(k,v);
	}else{
		CloudAPI.storageTemp[k] = v;
	}
}

CloudAPI.getFromStorage = function(k){
	if(CloudAPI.storageMode == 'local'){
		return localStorage.getItem(k);
	}else{
		return CloudAPI.storageTemp[k];
	}
}

CloudAPI.removeFromStorage = function(k){
	if(CloudAPI.storageMode == 'local'){
		localStorage.removeItem(k);
	}else{
		CloudAPI.storageTemp[k] = undefined;
	}
}

CloudAPI.loadApiTokenFromHref = function(){
	var prms = window.location.href.split("#");
	var token = prms[prms.length - 1];
	token = token.split("&");
	
	for(var i in token){
		var name = token[i].split("=")[0];
		var param = decodeURIComponent(token[i].split("=")[1]);
		if(name == "token"){
			CloudAPI.config.apiToken.token = param;
			CloudAPI.config.apiToken.type = "api";
		}else if(name == "expire"){
			CloudAPI.config.apiToken.expire = param;
			CloudAPI.config.apiToken.expireTimeUTC = Date.parse(param + "Z");
		}
	}
	console.log("Href token: ", CloudAPI.config.apiToken);
	CloudAPI.setToStorage('SkyVR_apiToken', JSON.stringify(CloudAPI.config.apiToken));
}

CloudAPI.flashVersion = undefined;

CloudAPI.getFlashVersion = function(){
  // ie
  try {
    try {
      // avoid fp6 minor version lookup issues
      // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
      var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
      try { axo.AllowScriptAccess = 'always'; }
      catch(e) { return '6,0,0'; }
    } catch(e) {}
    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
  // other browsers
  } catch(e) {
    try {
      if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
      }
    } catch(e) {}
  }
  return '0,0,0';
}

window.CloudAPI.supportFlash = function(){
	if(!CloudAPI.flashVersion){
		CloudAPI.flashVersion = CloudAPI.getFlashVersion();
	}
	return CloudAPI.flashVersion != "0,0,0";
}

window.CloudAPI.usedHls = function(){
	return !CloudAPI.supportFlash() || CloudAPI.containsPageParam("hls");
}

// set url

if(CloudAPI.containsPageParam("svcp_host")){
	CloudAPI.setURL(CloudAPI.pageParams["svcp_host"]);
}else if(CloudAPI.getFromStorage('CloudAPI_svcp_host')){
	CloudAPI.setURL(CloudAPI.getFromStorage('CloudAPI_svcp_host'));
}else{
	CloudAPI.setURL(window.location.protocol + "//" + window.location.host.toString() + "/");
}

