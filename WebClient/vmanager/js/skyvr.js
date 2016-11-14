window.SkyVR = new function (){
	this.description = "API Lib For SkyVR. Network Layer Between FrontEnd And BackEnd.";
	this.config = {
		url: "",
		url_cameras: "",
		url_api: "",
		cameraID: "",
		user_name: "",
		vendor: ""
	};
	
	this.lang = function(){
		return self.sLang || this.locale();
	};
	
	this.locale = function() {
		langs = ['en', 'ko', 'ru']
		self.sLang = 'en';
		if(SkyVR.containsPageParam('lang') && langs.indexOf(SkyVR.pageParams['lang']) >= -1){
			self.sLang = SkyVR.pageParams['lang'];
		} else if (navigator) {
			var navLang = 'en';
			navLang = navigator.language ? navigator.language.substring(0,2) : navLang;
			navLang = navigator.browserLanguage ? navigator.browserLanguage.substring(0,2) : navLang;
			navLang = navigator.systemLanguage ? navigator.systemLanguage.substring(0,2) : navLang;
			navLang = navigator.userLanguage ? navigator.userLanguage.substring(0,2) : navLang;
			self.sLang =  langs.indexOf(navLang) >= -1 ? navLang : self.sLang;
		} else {
			self.sLang = 'en';
		}
		return self.sLang;
	};
	
	this.setToCookie = function(name, value) {
		var date = new Date( new Date().getTime() + (7 * 24 * 60 * 60 * 1000) ); // cookie on week
		document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/; expires="+date.toUTCString();
	}
	this.getFromCookie = function(name) {
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? decodeURIComponent(matches[1]) : '';
	}
	// logout_redirect
	// token
	this.removeFromCookie = function(name) {
		document.cookie = encodeURIComponent(name) + "=; path=/;";
	}
	
	this.cache = {
		cameras: {},
		timezones: {}
	};

	this.cache.cameraInfo = function(camid){
		if(camid)
			return CloudAPI.cache.cameras[camid];
		else if(CloudAPI.isCameraID())
			return CloudAPI.cache.cameras[SkyVR.cameraID()];
	};
	// TODO depreceated
	this.cache.getCameraInfo = this.cache.cameraInfo;

	this.cache.mergeObjects = function(obj1, obj2){
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
	this.cache.updateCameraInfo = function(cam){
		var camid = cam.id;
		if(!CloudAPI.cache.cameras[camid]){
			CloudAPI.cache.cameras[camid] = {};
		};
		CloudAPI.cache.cameras[camid] = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[camid], cam);
	}

	this.cache.setCameraInfo = function(cam){
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
	this.cache.setP2PSettings = function(cameraID, p2p_settings){
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
	this.cache.setMemoryCard = function(cameraID, memory_card){
		if(SkyVR.cache.cameras[cameraID] == undefined){
			SkyVR.cache.cameras[cameraID] = {};
		}
		SkyVR.cache.cameras[cameraID].memory_card = memory_card;
	};
	this.cache.updateCameraAudio = function(cameraID, audio_struct){
		if(!CloudAPI.cache.cameras[cameraID]){
			CloudAPI.cache.cameras[cameraID] = {};
		};
		if(!CloudAPI.cache.cameras[cameraID]["audio"]){
			CloudAPI.cache.cameras[cameraID]["audio"] = {};
		}
		SkyVR.cache.cameras[cameraID].audio = CloudAPI.cache.mergeObjects(CloudAPI.cache.cameras[cameraID].audio, audio_struct);
	};
	this.cache.cameraAudio = function(cameraID){
		cameraID = cameraID || CloudAPI.cameraID();
		if(!CloudAPI.cache.cameras[cameraID]){
			return {};
		};
		return CloudAPI.cache.cameras[cameraID].audio;
	};
	this.cache.updateCameraVideo = function(cameraID, video_struct){
		if(!SkyVR.cache.cameras[cameraID]){
			SkyVR.cache.cameras[cameraID] = {};
		};
		if(!CloudAPI.cache.cameras[cameraID]["video"]){
			CloudAPI.cache.cameras[cameraID]["video"] = {};
		}
		var video = CloudAPI.cache.cameras[cameraID]["video"];
		CloudAPI.cache.cameras[cameraID]["video"] = CloudAPI.cache.mergeObjects(video, video_struct);
	};
	this.cache.cameraVideo = function(cameraID){
		cameraID = cameraID || CloudAPI.cameraID();
		if(!CloudAPI.cache.cameras[cameraID]){
			return {};
		};
		return CloudAPI.cache.cameras[cameraID].video;
	}
	this.cache.cameraVideoStreamName = function(cameraID){
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
	this.cache.cameraVideoStreams = function(cameraID){
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
	this.cache.setLimits = function(cameraID, struct_limits){
		if(!SkyVR.cache.cameras[cameraID]){
			SkyVR.cache.cameras[cameraID] = {};
		};
		SkyVR.cache.cameras[cameraID].limits = struct_limits;
	};
	this.cache.updateCameraVideoStream = function(cameraID, vs_id, struct){
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
	this.cache.setAudioStream = function(cameraID, as_id, struct){
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
	this.cache.setMediaStreams = function(cameraID, media_streams_struct){
		if(!SkyVR.cache.cameras[cameraID]){
			SkyVR.cache.cameras[cameraID] = {};
		};
		SkyVR.cache.cameras[cameraID]['media_streams'] = media_streams_struct;
	};
	this.cache.updateEventProcessingEventsMotion = function(cameraID, struct){
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
	this.cache.updateCameraEventProcessingEventsSound = function(cameraID, struct){
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

	this.setURL = function(url){
		if(this.config.url != url){
			this.config.url = url;
			console.log("Set URL: " + this.config.url);
			this.config.url_api = url+"api/v2/";
			this.config.url_cameras = url+"api/v2/cameras/";
			this.config.url_server = url+"api/v2/server/";
			this.config.url_account = url+"api/v2/account/";
			this.config.url_cmngrs = url+"api/v2/cmngrs/";
			this.config.url_storage = url+"api/v2/storage/";
			this.config.url_clips = url+"api/v2/storage/clips/";
			this.config.anonToken = {
				token: '',
				type: 'anon',
				expire: '',
				expireTimeUTC: 0
			};
			// console.log(localStorage);
			if(localStorage.getItem('SkyVR_anonToken'))
				this.config.anonToken = JSON.parse(localStorage.getItem('SkyVR_anonToken'));
			this.config.apiToken = {
				token: '',
				type: 'api',
				expire: '',
				expireTimeUTC: 0
			};
			this.config.shareToken = {};
			if(localStorage.getItem('SkyVR_apiToken')){
				var apiToken = JSON.parse(localStorage.getItem('SkyVR_apiToken'))
				if(apiToken.expireTimeUTC > Date.now()){
					this.config.apiToken = apiToken;
				}
			}
		};
	};

	console.log("Href: " + window.location.href);

	this.setURL("http://" + window.location.host.toString() + "/");

	this.isExpiredApiToken = function(){
		if(SkyVR.config.apiToken.expireTimeUTC){
			if(SkyVR.config.apiToken.expireTimeUTC > Date.now()){
				return false;
			}else{
				return true;
			}
		}else{
			return true;
		}
	}

	this.applyApiToken = function(){
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			beforeSend: function(xhr,settings) {
				if(SkyVR.config.apiToken && SkyVR.config.apiToken.token) {
					xhr.setRequestHeader('Authorization', 'SkyVR ' + SkyVR.config.apiToken.token);
				}
			}
		});
	}
	$.support.cors = true;

	this.updatePageProgressCaption = function(){
		try{
			if(document.getElementById('progress-caption')){
				if(cc.pageloading_caption && cc.pageloading_caption[SkyVR.lang()]){
					document.getElementById('progress-caption').innerHTML = cc.pageloading_caption[SkyVR.lang()];
				}else{
					document.getElementById('progress-caption').innerHTML = "Loading...";
				}
			}
		}catch(e){
		}
	}

	this.loadVendorScripts = function(vendor, path){
		if(vendor != ''){
			var js = document.createElement("script");
			js.type = "text/javascript";
			js.src = (path ? path : './') + 'vendor/' + vendor + "/cc.js";
			document.head.appendChild(js);
			js.onload = function(){
				SkyVR.updatePageProgressCaption();
			}

			var cc_css = document.createElement("link");
			cc_css.rel = "stylesheet";
			cc_css.href = (path ? path : './') + "vendor/" + vendor + "/cc.min.css";
			document.head.appendChild(cc_css);
			
			var cc_css2 = document.createElement("link");
			cc_css2.rel = "stylesheet";
			cc_css2.href = (path ? path : './') + "vendor/" + vendor + "/pageloader.min.css";
			document.head.appendChild(cc_css2);
		}
	};
	/*this.loadVendorTranslates = function(vendor, path){
		var js = document.createElement("script");
		js.type = "text/javascript";
		js.src = (path ? path : './') + 'vendor/' + vendor + "/cc.js";
		document.head.appendChild(js);

		var cc_css = document.createElement("link");
		cc_css.rel = "stylesheet";
		cc_css.href = (path ? path : './') + "vendor/" + vendor + "/cc.min.css";
		document.head.appendChild(cc_css);
	};*/
	
	this.loadApiTokenFromHref = function(){
		var prms = window.location.href.split("#");
		var token = prms[prms.length - 1];
		token = token.split("&");
		
		for(var i in token){
			var name = token[i].split("=")[0];
			var param = decodeURIComponent(token[i].split("=")[1]);
			if(name == "token"){
				SkyVR.config.apiToken.token = param;
				SkyVR.config.apiToken.type = "api";
			}else if(name == "expire"){
				SkyVR.config.apiToken.expire = param;
				SkyVR.config.apiToken.expireTimeUTC = Date.parse(param + "Z");
			}
		}
		console.log("Href token: ", SkyVR.config.apiToken);
		localStorage['SkyVR_apiToken'] = JSON.stringify(SkyVR.config.apiToken);
	}
	
	this.updateApiToken = function(){
		var d = $.Deferred();
		$.ajax({
			url: this.config.url_account + "token/api/",
			type: 'GET',
			contentType: 'application/json'
		}).done(function(new_token){
			SkyVR.config.apiToken.token = new_token.token;
			SkyVR.config.apiToken.expire = new_token.expire;
			SkyVR.config.apiToken.expireTimeUTC = Date.parse(new_token.expire + "Z");
			SkyVR.config.apiToken.type = new_token.type;
			localStorage['SkyVR_apiToken'] = JSON.stringify(SkyVR.config.apiToken);
			console.log("Updated token: ", SkyVR.config.apiToken);
			d.resolve(new_token);
		}).fail(function(){
			d.reject();
		});
		return d;
	};

	this.url = function() {
		return this.config.url;
	};

	this.setCameraID = function(id){
		if(this.config.cameraID != id && id){
			this.config.cameraID = id;
			console.log("[CLOUDAPI] new cam id: " + id);
			if(!this.cache.camera){
				SkyVR.cameraInfo().done(function(cam){
					this.cache.camera = cam;
				});
			}
		} else if (!id){
			this.config.cameraID = undefined;
			this.cache.camera = undefined;
		}
	};
	this.cameraID = function(){
		return this.config.cameraID;
	};
	this.cameraManagerID = function(){
		return SkyVR.cache.cameras[this.config.cameraID]['cmngrid'];
	};
	this.isCameraID = function(){
		if(this.config.cameraID == undefined){
			console.error("[CLOUDAPI] cameraID is undefined");
			return false;
		};
		return true;
	};
	this.isP2PStreaming_byId = function(camid){
		var cam = SkyVR.cache.cameras[camid];
		if(cam && cam['p2p_streaming'] && cam.p2p_streaming == true){
			return true;
		}
		return false;
	};
	this.isP2PStreaming = function(){
		if(SkyVR.cache.cameraInfo() == undefined){
			console.error("[CLOUDAPI] cameraID is undefined");
			return false;
		};
		return SkyVR.isP2PStreaming_byId(SkyVR.cache.cameraInfo().id);
	};
	
	this.hasMemoryCard_byId = function(camid){
		var cam = SkyVR.cache.cameras[camid];
		if(cam && cam['memory_card'] && cam.memory_card.status != "none"){
			return true;
		}
		return false;
	}
	
	this.hasMemoryCard = function(){
		if(SkyVR.cache.cameraInfo() == undefined){
			console.error("[CLOUDAPI] cameraID is undefined");
			return false;
		};
		return SkyVR.hasMemoryCard_byId(SkyVR.cache.cameraInfo().id);
	}
	
	this.parseUTCTime = function(str){
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
	this.convertUTCTimeToUTCStr = function(t){
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
	this.convertUTCTimeToStr = function(t){
		var d = new Date();
		d.setTime(t);
		var monthesTrans = ["short_Jan", "short_Feb", "short_Mar",
			"short_Apr", "short_May", "short_June",
			"short_July", "short_Aug", "short_Sep",
			"short_Oct", "short_Nov", "short_Dec"
		];
		var str = d.getUTCDate() + SkyUI.polyglot.t(monthesTrans[d.getUTCMonth()]) + " " + d.getUTCFullYear() + " "
			+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
		if(SkyVR.lang() == 'ko'){
			str = ("00" + (d.getUTCMonth() + 1)).slice(-2) + '/' + ("00" + d.getUTCDate()).slice(-2) + "/" + d.getUTCFullYear() + " "
				+ ("00" + d.getUTCHours()).slice(-2) + ":" + ("00" + d.getUTCMinutes()).slice(-2) + ":" + ("00" + d.getUTCSeconds()).slice(-2);
		}
		return str;
	};
	this.convertUTCTimeToSimpleStr = function(t){
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
	this.getOffsetTimezone = function() {
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
	this.getCurrentTimeUTC = function(){
		return Date.now();
	};
	this.getCurrentTimeByCameraTimezone = function(){
		return Date.now() + this.getOffsetTimezone();
	};
	this.enable401handler = function() {
		/*$.ajaxSetup({
			error : function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.status == 401 && jqXHR.statusText == "UNAUTHORIZED") {
					
					var uri = SkyVR.parseUri(this.url);
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
	this.disable401handler = function() {
		$.ajaxSetup({
			error : function(jqXHR, textStatus, errorThrown) {
			}
		});
	};
	this.printStack = function(){
		var err = new Error();
		console.error(err.stack);
	};
	// constants for pages
	this.PAGE_SIGNIN = "signin";
	this.parsePageParams = function() {
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
		console.log(JSON.stringify(result));
		return result;
	};
	this.pageParams = this.parsePageParams();
	this.containsPageParam = function(name){
		return (typeof this.pageParams[name] !== "undefined");
	};
	this.generateNewLocation = function(page){
		var params = [];
		if(this.containsPageParam("lang"))
			params.push("lang=" +encodeURIComponent(this.pageParams["lang"]));
		if(this.containsPageParam("vendor"))
			params.push("vendor=" +encodeURIComponent(this.pageParams["vendor"]));
		if(this.containsPageParam("mobile"))
			params.push('mobile=' + encodeURIComponent(this.pageParams['mobile']))
		params.push("p=" +encodeURIComponent(page));
		return "?" + params.join("&");
	}
	this.changeLocationState = function(newPageParams){
		var url = '';
		var params = [];
		if(this.containsPageParam("lang"))
			params.push('lang=' + encodeURIComponent(this.pageParams['lang']))
		if(this.containsPageParam("vendor"))
			params.push('vendor=' + encodeURIComponent(this.pageParams['vendor']))
		if(this.containsPageParam("mobile"))
			params.push('mobile=' + encodeURIComponent(this.pageParams['mobile']))
		for(var p in newPageParams){
			params.push(encodeURIComponent(p) + "=" + encodeURIComponent(newPageParams[p]));
		}
		var new_url = window.location.protocol + "//" + window.location.hostname + window.location.pathname + '?' + params.join("&");
		console.log("changeLocationState: " + new_url);
		try{
			if(window.history.pushState)
				window.history.pushState(newPageParams, document.title, new_url);
			else
				console.error("window.history.pushState - function not found");
		}catch(e){
			console.error("changeLocationState: Could not change location to " + new_url);
		}
		this.pageParams = this.parsePageParams();
	}

/*	this.getUTC = function(camtimezone){
		var now = new Date();
		var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		var d = new Date.now();
		var t = d.getTimezoneOffset();
	};*/

	this.hasAccess = function(caminfo, rule){
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
	
	this.hasAccessSettings = function(caminfo){
		if(SkyUI.isDemo())return true;
		return SkyVR.hasAccess(caminfo, "all");
	}
	
	this.hasAccessClips = function(caminfo){
		if(SkyUI.isDemo())return true;
		return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "cplay") || SkyVR.hasAccess(caminfo, "all");
	}
	
	this.hasAccessLive = function(caminfo){
		if(SkyUI.isDemo())return true;
		return SkyVR.hasAccess(caminfo, "ptz") || SkyVR.hasAccess(caminfo, "live") || SkyVR.hasAccess(caminfo, "all");
	}

	this.hasAccessPlayback = function(caminfo){
		if(SkyUI.isDemo())return true;
		return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "splay") || SkyVR.hasAccess(caminfo, "all");
	}

	this.hasAccessMakeClip = function(caminfo){
		if(SkyUI.isDemo())return true;
		return SkyVR.hasAccess(caminfo, "clipping") || SkyVR.hasAccess(caminfo, "all");
	}

	this.handleNothing = function(response){
		// nothing
	};

	this.handleNothingError = function(xhr, ajaxOptions, thrownError){
		// nothing
	};
	this.handleError = function(xhr, ajaxOptions, thrownError){
		console.error(thrownError);
	};
	this.parseUri = function(str) {
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
	this.logout = function(callback){
		$.ajax({
			url: this.config.url_account + "logout/",
			type: 'POST',
			success: callback,
			error: SkyVR.handleError
		});
	};
	this.cameraVideoStream = function(vs_id){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = this.config.cameraID;
		$.ajax({
			url : this.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
			type : "GET"
		}).done(function(response){
			CloudAPI.cache.updateCameraVideoStream(camid, vs_id, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.cameraLimits = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = this.config.cameraID;
		$.ajax({
			url : this.config.url_cameras + camid + "/limits/",
			type : "GET"
		}).done(function(response){
			SkyVR.cache.setLimits(SkyVR.cameraID(), response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};

	this.cameraEventProcessingEventsMotion = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = this.config.cameraID;
		$.ajax({
			url : this.config.url_cameras + camid + "/event_processing/events/motion/",
			type : "GET"
		}).done(function(response){
			CloudAPI.cache.updateEventProcessingEventsMotion(camid, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	}
	this.updateCameraEventProcessingEventsMotion = function(data){
		var d = $.Deferred();
		if(!CloudAPI.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = CloudAPI.cameraID();
		$.ajax({
			url : this.config.url_cameras + camid + "/event_processing/events/motion/",
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
	
	this.cameraEventProcessingEventsSound = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = this.config.cameraID;
		$.ajax({
			url : this.config.url_cameras + camid + "/event_processing/events/sound/",
			type : "GET"
		}).done(function(response){
			CloudAPI.cache.updateCameraEventProcessingEventsSound(camid, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	}
	
	this.updateCameraEventProcessingEventsSound = function(data){
		var d = $.Deferred();
		if(!CloudAPI.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = CloudAPI.cameraID();
		$.ajax({
			url : this.config.url_cameras + camid + "/event_processing/events/sound/",
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

	this.updateCameraVideoStream = function(vs_id, data){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = SkyVR.cameraID();
		$.ajax({
			url : this.config.url_cameras + camid + "/video/streams/" + vs_id + "/",
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
	this.setVBRQuality = function(newValue, vs_id, cb_success, cb_error){
		if(!this.isCameraID()) return;
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		var data = {};
		data.vbr_quality = newValue;
		data.vbr = true;
		$.ajax({
			url: this.config.url_cameras + this.config.cameraID + "/video/streams/" + vs_id + "/",
			type: 'PUT',
			success: cb_success,
			error: cb_success,
			data:  JSON.stringify(data),
			contentType: 'application/json'
		});
	};
	this.formatMemoryCard = function(){
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
	
	this.cameraMemoryCard = function(camid){
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
	
	this.cameraWifi = function(){
		var d = $.Deferred();
		if(!this.isCameraID()){
			d.reject();
			return d;
		}
		$.ajax({
			url: this.config.url_cameras + this.config.cameraID + "/wifi/",
			type: 'GET'
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.cameraFirmwares = function(){
		var d = $.Deferred();
		if(!this.isCameraID()){
			d.reject();
			return d;
		}
		$.ajax({
			url: this.config.url_cameras + this.config.cameraID + "/firmwares/?limit=1000",
			type: 'GET',
			contentType: 'application/json'
		}).done(function(response){
			d.resolve(response.objects);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.cameraFirmwaresUpgrade = function(version){
		var d = $.Deferred();
		if(!this.isCameraID()){
			d.reject();
			return d;
		}
		console.log("[CLOUDAPI] upgrade firmware to version: " + version);
		var data = {};
		data.version = version;
		$.ajax({
			url: this.config.url_cameras + this.config.cameraID + "/firmwares/upgrade/",
			type: 'POST',
			data:  JSON.stringify(data),
			contentType: 'application/json'
		}).done(function(){
			d.resolve();
		}).fail(function(){
			d.reject();
		});
		return d;
	};

	// TODO redesign
	this.getAccount = function(cb_success, cb_error){
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		return $.ajax({
			url: SkyVR.config.url_account,
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	};
	this.accountInfo = this.getAccount;
	this.anonToken = function(){
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
				url: this.config.url_account + "token/anon/",
				type: 'GET'
			}).done(function(tk){
				SkyVR.config.anonToken.token = tk.token;
				SkyVR.config.anonToken.type = tk.type;
				SkyVR.config.anonToken.expire = tk.expire;
				SkyVR.config.anonToken.expireTimeUTC = Date.parse(tk.expire+'Z');
				localStorage['SkyVR_anonToken'] = JSON.stringify(SkyVR.config.anonToken);
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

	this.accountShare = function(data){
		var params = {};
		params.camid = SkyVR.cameraID();
		return $.ajax({
			url: this.config.url_account + 'share/',
			type: 'POST',
			data:  JSON.stringify(data),
			contentType: 'application/json',
			cache : false
		});
	};

	this.captchaToken = function(cb_success, cb_error){
		// deprecated in v2
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		$.ajax({
			url: this.config.url_account + "token/captcha/",
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	};
	this.capabilities = function(cb_success, cb_error){
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		$.ajax({
			url: SkyVR.config.url_api + "capabilities/",
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	};
	this.cameraInfo = function(camid){
		var d = $.Deferred();
		camid = camid || CloudAPI.cameraID();
		if(camid == undefined){
			d.reject();
			return d;
		}
		return $.ajax({
			url: this.config.url_cameras + camid + "/",
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
	this.updateCamera = function(data){
		var d = $.Deferred();
		if(!CloudAPI.isCameraID()) {
			d.reject();
			return d;
		}
		$.ajax({
			url: this.config.url_cameras + CloudAPI.cameraID() + "/",
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
	this.updateCameraAudio = function(data){
		var d = $.Deferred();
		if(!CloudAPI.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = CloudAPI.cameraID();
		$.ajax({
			url: this.config.url_cameras + camid + "/audio/",
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
	this.cameraAudio = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = CloudAPI.cameraID();
		$.ajax({
			url: this.config.url_cameras + camid + "/audio/",
			type: 'GET'
		}).done(function(response){
			CloudAPI.cache.updateCameraAudio(camid, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	this.cameraVideo = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = CloudAPI.cameraID();
		$.ajax({
			url: this.config.url_cameras + camid + "/video/",
			type: 'GET'
		}).done(function(response){
			CloudAPI.cache.updateCameraVideo(camid, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	this.updateCameraVideo = function(data){
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
	this.setCameraVideo = function(new_values, cb_success, cb_error){
		if(!this.isCameraID()) return;
		cb_success = cb_success || SkyVR.handleNothing;
		cb_error = cb_error || SkyVR.handleError;
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/video/",
			type: 'PUT',
			success: cb_success,
			error: cb_error,
			contentType: 'application/json',
			data:  JSON.stringify(new_values)
		});
	};
	this.cameraMediaStreams = function(){
		var d = $.Deferred();
		if(!this.isCameraID()) {
			d.reject();
			return d;
		}
		var camid = SkyVR.cameraID();
		$.ajax({
			url: this.config.url_cameras + camid + "/media_streams/",
			type: 'GET'
		}).done(function(response){
			SkyVR.cache.setMediaStreams(camid, response);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	this.cameraLiveUrls = function(){
		var d = $.Deferred();
		if(!this.isCameraID()){
			d.reject();
			return d;
		}

		$.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/live_urls/",
			type: 'GET'
		}).done(function(liveurls){
			d.resolve(liveurls);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	this.cameraBackwardStart = function(){
		if(!this.isCameraID()) return;
		var data = {};
		if(!this.config.backwardURL) return;
		data.url = this.config.backwardURL;
		if(this.config.tmpBackwardURL == this.config.backwardURL)
			this.config.tmpBackwardURLCount++;
		else{
			this.config.tmpBackwardURLCount = 1;
			this.config.tmpBackwardURL = this.config.backwardURL;
		}
		
		if(this.isP2PStreaming()){
			console.log("[CLOUDAPI] Send (audio streaming) backward start: " + this.config.backwardURL);
			$.ajax({
				url: this.config.url_cameras + SkyVR.cameraID() + "/audio/backward/start/",
				type: 'POST',
				success: SkyVR.handleNothing,
				data:  JSON.stringify(data),
				contentType: 'application/json'
			});
		}
	};
	this.cameraBackwardStop = function(){
		if(!this.isCameraID()) return;
		var data = {}
		if(!this.config.backwardURL) return;
		data.url = this.config.backwardURL;
		// this.config.backwardURL = undefined;
		if(this.config.tmpBackwardURL == this.config.backwardURL){
			if(this.config.tmpBackwardURLCount == 0)
				return;
			else
				this.config.tmpBackwardURLCount--;
		}

		if(this.isP2PStreaming()){
			console.log("[CLOUDAPI] Send (audio streaming) backward stop: " + this.config.backwardURL);
			$.ajax({
				url: this.config.url_cameras + SkyVR.cameraID() + "/audio/backward/stop/",
				type: 'POST',
				success: SkyVR.handleNothing,
				data:  JSON.stringify(data),
				contentType: 'application/json'
			});
		}
	};
	this.cameraSchedule = function(){
		if(!this.isCameraID()) return;
		return $.ajax({
			url: this.config.url_cameras + CloudAPI.cameraID() + "/schedule/",
			type: 'GET',
			cache : false
		});
	};
	this.updateCameraSchedule = function(data){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/schedule/",
			type: 'PUT',
			data: JSON.stringify(data),
			cache : false,
			contentType: 'application/json'
		});
	};
	this.hasAccessCameraPreview = function(camid){
		var caminfo = SkyVR.cache.cameraInfo(camid);
		if(!caminfo) return false;
		return SkyVR.hasAccess(caminfo, 'live') || SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
	};
	this.cameraPreview = function(cameraID, cb_success, cb_error){
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		return $.ajax({
			url: this.config.url_cameras + cameraID + "/preview/",
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	};
	this.hasAccessCameraUpdatePreview = function(camid){
		var caminfo = SkyVR.cache.cameraInfo(camid);
		if(!caminfo) return false;
		return SkyVR.hasAccess(caminfo, 'live') || SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
	};
	this.cameraUpdatePreview = function(cameraID){
		return $.ajax({
			url: this.config.url_cameras + cameraID + "/preview/update/",
			type: 'POST'
		});
	};	
	this.storageDataFirstRecord = function(){
		var d = $.Deferred();
		var request_data = {
			camid: SkyVR.cameraID(),
			limit: 1,
			offset: 0
		};
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
	this.storageEventsFirstRecord = function(){
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
	this.storageThumbnailsFirstRecord = function(){
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
	this.storageThumbnails = function(startDT, endDt){
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
	this.storageTimeline = function(startDT, endDt){
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
	
	this.storageData = function(startDT, endDt){
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
	this.storageEvents = function(startDT, endDt){
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
	this.hasAccessMotionDetection = function(camid){
		var caminfo = SkyVR.cache.cameraInfo(camid);
		if(!caminfo) return false;
		return SkyVR.hasAccess(caminfo, 'all') || SkyVR.hasAccess(caminfo, 'ptz');
	};
	
	this.cameraMotionDetectionDemo=function(){
		var data=JSON.parse('{"caps": {"columns": 23, "max_regions": 8, "region_shape": "rect", "rows": 15, "sensitivity": "region"}}');
		return data;
	};

	this.cameraMotionDetection = function(){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/motion_detection/",
			type: 'GET'
		});
	};
	this.cameraMotionDetectionRegionsDemo=function(){
		var data_regions=JSON.parse('{"meta": {"limit": 20, "next": null, "offset": 0, "previous": null, "total_count": 8}, "objects": [{"enabled": true, "id": 2686, "map": "ZmQwMDBjM2ZjMDAwN2Y4MDAwZmYwMDAxZmUwMDAzZmNlNjAw", "name": "motion1", "sensitivity": 5}, {"enabled": true, "id": 2687, "map": "ZjYwMDBmMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmZmMDAw", "name": "motion2", "sensitivity": 5}, {"enabled": true, "id": 2688, "map": "ZjQwMDBmM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmNmMjAw", "name": "motion3", "sensitivity": 5}, {"enabled": true, "id": 2689, "map": "ZWMwMDBjMWZlMDAwM2ZjMDAwN2Y4MDAwZmYwMDAxZmVmNzAw", "name": "motion4", "sensitivity": 5}, {"enabled": true, "id": 2690, "map": "ZTQwMDA2ZTAwMDAxYzAwMDAzODBmOTAw", "name": "motion5", "sensitivity": 5}, {"enabled": true, "id": 2691, "map": "MmIwMWZmMDAwM2ZlMDAwN2ZjMDAwZmY4MDAxZmYwMDAzZmUwMDA3ZmMwMDBmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMDAwN2ZjMDAw", "name": "motion6", "sensitivity": 5}, {"enabled": true, "id": 2692, "map": "MTJmZjgwMDFmZjAwMDNmZTAwMDdmYzAwMGZmODAwMWZmMDAwM2ZlMGU4MDA=", "name": "motion7", "sensitivity": 5}, {"enabled": false, "id": 2693, "map": "", "name": "motion8", "sensitivity": 5}]}');
		return data_regions;
	};
	this.cameraMotionDetectionRegions = function(){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/motion_detection/regions/",
			type: 'GET'
		});
	};

	this.cameraP2PSettings = function(cameraID, cb_success, cb_error, cb_always){
		cameraID = cameraID || SkyVR.cameraID();
		cb_success = (cb_success == undefined) ? SkyVR.handleNothing : cb_success;
		cb_error = (cb_error == undefined) ? SkyVR.handleError : cb_error;
		cb_always = (cb_always == undefined) ? SkyVR.handleNothing : cb_always;
		return $.ajax({
			url: this.config.url_cameras + cameraID + "/p2p_settings/",
			type: 'GET',
			success: function(response){
				SkyVR.cache.setP2PSettings(cameraID, response);
				cb_success(response);
			},
			error: cb_error,
			complete: cb_always
		});
	};
	this.cameraSetP2PSettings = function(data){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/p2p_settings/",
			type: 'PUT',
			data: JSON.stringify(data),
			cache : false,
			contentType: 'application/json'
		});
	};
	this.cameraLog = function(){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/log/",
			type: 'GET'
		});
	};
	this.cameraLogDownload = function(url){
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
	this.cameraLogUpdate = function(){
		return $.ajax({
			url: this.config.url_cameras + SkyVR.cameraID() + "/log/update/",
			type: 'POST'
		});
	};
	this.cameraManagersList = function(cb_success, cb_error){
		cb_success = cb_success || SkyVR.handleNothing
		cb_error = cb_error || SkyVR.handleError;
		$.ajax({
			url: this.config.url_cmngrs,
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	}
	this.camerasList = function(){
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
		function getData(req_data){
			var req_d = $.Deferred();
			$.ajax({
				url: SkyVR.config.url_cameras,
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
	this.camerasListByCriterions = function(criterions, cb_success, cb_error){
		cb_success = cb_success || SkyVR.handleNothing
		cb_error = cb_error || SkyVR.handleError;
		
		$.ajax({
			url: this.config.url_cameras,
			data: criterions,
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	}
	this.cameraManagerInfo = function(cameraManagerID, cb_success, cb_error){
		cb_success = cb_success || SkyVR.handleNothing
		cb_error = cb_error || SkyVR.handleError;
		$.ajax({
			url: this.config.url_cmngrs + cameraManagerID + "/",
			type: 'GET',
			success: cb_success,
			error: cb_error
		});
	}
	this.cameraManagerSetTimezone = function(cameraManagerID, newTimeZone, cb_success, cb_error){
		cb_success = cb_success || SkyVR.handleNothing
		cb_error = cb_error || SkyVR.handleError;
		var obj = {};
		obj.timezone = newTimeZone;
		$.ajax({
			url: this.config.url_cmngrs + cameraManagerID + "/",
			type: 'PUT',
			success: cb_success,
			error: cb_error,
			data:  JSON.stringify(obj),
			contentType: 'application/json'
		});
	}
	this.storageClipList = function(){
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
	this.storageClipListAnon = function(token){
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
	this.storageClipCreate = function(title, group, start, end, delete_at){
		var data = {};
		data.camid = SkyVR.cameraID();
		data.title = title;
		data.group = group;
		data.start = start;
		data.end = end;
		data.delete_at = delete_at;
		return $.ajax({
			url: this.config.url_clips,
			type: 'POST',
			data: JSON.stringify(data),
			cache : false,
			contentType: 'application/json'
		});
	}
	this.storageClip = function(clipid){
		return $.ajax({
			url: SkyVR.config.url_clips + clipid + "/",
			type: 'GET',
			cache : false
		});
	};
	this.serverTime = function(){
		return $.ajax({
			url: SkyVR.config.url_server + "time/",
			type: 'GET',
			cache : false
		});
	};
	this.storageClipAnon = function(clipid, token){
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
	this.storageClipDelete = function(clipid){
		return $.ajax({
			url: this.config.url_clips + clipid + "/",
			type: 'DELETE',
			cache : false
		});
	};
	this.storageClipUpdate = function(clipid, data){
		return $.ajax({
			url: this.config.url_clips + clipid + "/",
			data: JSON.stringify(data),
			type: 'PUT',
			cache : false,
			contentType: 'application/json'
		});
	};
	this.storageActivity = function(){
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
	
	this.hostNewCamera = function(data){
		return $.ajax({
			url: SkyVR.config.url_cameras + "host_new_camera/",
			type: 'POST',
			data: JSON.stringify(data),
			contentType: 'application/json',
			cache : false
		});
	};
	
	this.cameraSettings = function(){
		var d = $.Deferred();
		var d_all = [];
		function anyway(d){
			var d2 = $.Deferred();
			d.always(function(){ d2.resolve();});
			return d2;
		}
		
		function mediaStreams(){
			var d2 = $.Deferred();
			SkyVR.cameraMediaStreams().done(function(media_streams){
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
}();

window.CloudAPI = window.SkyVR;
