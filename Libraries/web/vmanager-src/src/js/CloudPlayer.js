if(!window.CloudPlayer) window.CloudPlayer = {};

// config
CloudPlayer.status_update_timeout = 10000; // in milliseconds

// Counters
CloudPlayer.lastLiveIdle = 0;

// backward audio
CloudPlayer.statusBackward = "";
CloudPlayer.supportBackward = false;
CloudPlayer.userRecordPaused = false;

CloudPlayer.isStatusBackwardTransitive = function(){
	return CloudPlayer.statusBackward == "transitive";
}

// Zoom Control
CloudPlayer.generatedZoomPreview = false;

CloudPlayer.enablePTZControls = function(){
	$('#full-player-container').addClass("support-ptz");
	
	if(CloudAPI.containsPageParam("mobile")){
		CloudPlayer.initMobilePTZButtons();
	}
    
	function initPtzButton(action){
		var btn_was_down = false;
		$('.ptz-' + action).unbind().bind('mousedown', function(){
			btn_was_down = true;
			CloudAPI.cameraSendPtz({"action": action});
		}).bind('mouseup', function(){
			if(btn_was_down){
				btn_was_down = false;
				CloudAPI.cameraSendPtz({"action": "stop"});
			}
		}).bind('mouseleave', function(){
			if(btn_was_down){
				btn_was_down = false;
				CloudAPI.cameraSendPtz({"action": "stop"});
			}
		});
	}
	initPtzButton("top");
	initPtzButton("left");
	initPtzButton("right");
	initPtzButton("bottom");
}

CloudPlayer.isLiveAccessDenied = function(){
	return $('.card-container').hasClass('deny-live');
}

CloudPlayer.setLiveStreamNotFound = function(){
	$('.card-container').addClass("livestreamnotfound");
}

CloudPlayer.initMobilePTZButtons = function(){
	$('.player-wrapper').append(''
		+ '<button class="player-button ptz-left hiding-button"></button>'
		+ '<button class="player-button ptz-right hiding-button"></button>'
		+ '<button class="player-button ptz-top hiding-button"></button>'
		+ '<button class="player-button ptz-bottom hiding-button"></button>'
	);

	$('.ptz-left').css({
		'display': 'block',
		'opacity': 1,
		'z-index': 100,
		'background-color': 'rgba(54,58,61,0.64)',
		'position': 'fixed',
		'background-image': 'url("files/images/ptz-left.svg")',
		'background-size': '25px',
		'background-repeat': 'no-repeat',
		'width': '42px',
		'height': '42px',
		'bottom': '182px',
		'right': '102px'
	});
	
	$('.ptz-right').css({
		'display': 'block',
		'opacity': 1,
		'z-index': 100,
		'background-color': 'rgba(54,58,61,0.64)',
		'position': 'fixed',
		'background-image': 'url("files/images/ptz-right.svg")',
		'background-size': '25px',
		'background-repeat': 'no-repeat',
		'width': '42px',
		'height': '42px',
		'bottom': '182px',
		'right': '18px'
	});
	
	$('.ptz-top').css({
		'display': 'block',
		'opacity': 1,
		'z-index': 100,
		'background-color': 'rgba(54,58,61,0.64)',
		'position': 'fixed',
		'background-image': 'url("files/images/ptz-top.svg")',
		'background-size': '25px',
		'background-repeat': 'no-repeat',
		'width': '42px',
		'height': '42px',
		'bottom': '224px',
		'right': '60px'
	});
	
	$('.ptz-bottom').css({
		'display': 'block',
		'opacity': 1,
		'z-index': 100,
		'background-color': 'rgba(54,58,61,0.64)',
		'position': 'fixed',
		'background-image': 'url("files/images/ptz-bottom.svg")',
		'background-size': '25px',
		'background-repeat': 'no-repeat',
		'width': '42px',
		'height': '42px',
		'bottom': '140px',
		'right': '60px'
	});
}

CloudPlayer.togglePower = function(camera, value, oldValue){
	camera = CloudAPI.cache.cameraInfo();
	// TODO: did not used argument value
	// TODO: redesign arguments value
	// camera.status / active/inactive/inactive_by_scheduler/offline
	if(camera != null){
		console.log("[CAMERA-TOGGLE] camera.status: " + camera.status);
		console.log("[CAMERA-TOGGLE] camera.mode:" + camera.mode);
		console.log("[CAMERA-TOGGLE] camera.rec_mode:" + camera.rec_mode);
		var new_mode = CloudPlayer.behaviorTable().camera(camera.status).mode(camera.mode).new_mode;

		if(new_mode == false){
			return false;
		}

		console.log("[CAMERA-TOGGLE] Set camera mode (1 place) - (from [" + camera.mode + "] to [" + new_mode + "])");
		camera.mode = new_mode;

		CloudAPI.updateCamera({"mode": new_mode}).done(function(r){
			console.log(r)
		}).fail(function(r){
			console.error(r)
		})
		return camera;
	}
}

CloudPlayer.behaviorTable = function() {
	var tbl = {
		"camera_status_on" : {
			"current_mode_schedule" : { "new_mode" : "off_till_sched"},
			"current_mode_on_till_sched" : { "new_mode" : "off_till_sched"},
			"current_mode_off_till_sched" : { "new_mode" : false},
			"current_mode_on" : { "new_mode" : "off"},
			"current_mode_off" : { "new_mode" : false}
		},
		"camera_status_off" : {
			"current_mode_schedule" : { "new_mode" : "on_till_sched"},
			"current_mode_on_till_sched" : { "new_mode" : false},
			"current_mode_off_till_sched" : { "new_mode" : "on_till_sched"},
			"current_mode_on" : { "new_mode" : false},
			"current_mode_off" : { "new_mode" : "on"}
		},
		"camera_status_offline" : {
			"current_mode_schedule" : { "new_mode" : "on_till_sched"},
			"current_mode_on_till_sched" : { "new_mode" : "off_till_sched"},
			"current_mode_off_till_sched" : { "new_mode" : "on_till_sched"},
			"current_mode_on" : { "new_mode" : "off"},
			"current_mode_off" : { "new_mode" : "on"}
		},
		"camera_status_unauthorized" : {
			"current_mode_schedule" : { "new_mode" : false},
			"current_mode_on_till_sched" : { "new_mode" : false},
			"current_mode_off_till_sched" : { "new_mode" : false},
			"current_mode_on" : { "new_mode" : false},
			"current_mode_off" : { "new_mode" : false}
		}
	};

	return new (function(tbl){
		this.tbl = tbl;
		this.camera = function(val) {
			camera_status = "";
			if(val == "active"){
				camera_status = "on";
			} else if (val == "inactive" || val == "inactive_by_scheduler"){
				camera_status = "off";
			} else if (val == "offline") {
				camera_status = "offline";
			} else {
				camera_status = val;
				console.log("Unknown camera status: " + val);
			}
			return new (function(tbl2){
				this.tbl2 = tbl2;
				this.mode = function(val) {
					if (val != "schedule"
						&& val != "on_till_sched"
						&& val != "off_till_sched"
						&& val != "on" && val != "off") {
						console.log("Unknown camera mode: " + val);
					}
					return this.tbl2["current_mode_" + val]
				};
			})(this.tbl["camera_status_" + camera_status]);
		};
	})(tbl);
};

CloudPlayer.hlsMediaTicketExpire = 0;
CloudPlayer.hlsMediaTicketValue = "";
CloudPlayer.polingMediaTicketInterval = undefined;
CloudPlayer.applyMediaTiket = function(url_hls, expire){
	console.log("media-tiсket: old = " + CloudPlayer.hlsMediaTicketValue);
	if(url_hls.indexOf('?') != -1){
		CloudPlayer.hlsMediaTicketValue = '?' + url_hls.split('?')[1];
	}
	CloudPlayer.hlsMediaTicketExpire = Date.parse(expire + 'Z');
	console.log("media-tiсket: new = " + CloudPlayer.hlsMediaTicketValue);
}

CloudPlayer.startPolingMediaTicket = function(){
	clearInterval(CloudPlayer.polingMediaTicketInterval);
	CloudPlayer.polingMediaTicketInterval = setInterval(function(){
		if(!CloudAPI.cameraID()){
			CloudPlayer.stopPolingMediaTicket();
			return;
		}
		var cur_time_utc = new Date().getTime();
		var expired_after = CloudPlayer.hlsMediaTicketExpire - cur_time_utc;
		expired_after = Math.round(expired_after/1000);
		// console.log("media-tiсket for camid " + camid + ', expired after ' + expired_after + ' s');
		if(expired_after < 2*60){ // less then 2 minutes
			console.log("media-tiсket: Updating");
			CloudAPI.cameraLiveUrls(CloudAPI.cameraID()).done(function(live_urls){
				CloudPlayer.applyMediaTiket(live_urls.hls, live_urls.expire);
				console.log("media-tiсket: Updated");
			}).fail(function(r){
				if(r.status != 0){
					console.error("media-tiсket: stop poling ", r);
					CloudPlayer.stopPolingMediaTicket();
				}
			});
		}
	},10*1000); // every 10 sec
}

CloudPlayer.stopPolingMediaTicket = function(){
	clearInterval(CloudPlayer.polingMediaTicketInterval);
}
