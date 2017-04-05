define(['application', 'config', 'backbone','underscore','event', 'moment-timezone','arcticmodal'], function(app, conf, bb,_, event, timezone){
	var application = {
		show : function(){
			window['currentPage'] = 'cameraSettings';
			$('#camera-settings-modal').arcticmodal({
				"beforeClose": function(){
					clearInterval(application.updateSettingsInfoInterval);
					window['currentPage'] = 'player';
				}
			});
			$('.camera-settings-popup .header p').text(app.polyglot.t('Settings'));
			return application.showMainMenuinModal();
		},
		buildParamList: function(params){
			var result = "<div class='menu_paramlist_table'>";
			for(var i = 0; i < params.length; i++){
				result += '<div class="menu_paramlist_row">';
				result += '<div class="menu_paramlist_name">' + params[i].name + '</div>';
				result += '<div class="menu_paramlist_value">' + params[i].value + '</div>';
				result += '</div>';
			};
			result += "</div>";
			return result;
		},
		updateSettingsInfo: function(){
			// refreshing information
			if(SkyVR.isP2PStreaming()){
				application.updateInformationAboutMemoryCard();
			}
		},
		updateInformationAboutMemoryCard : function(other) {
			// show loading for memory_card info
			if ($('#memory_card_text').html() == ""){
				var throbber = $('<div class="throbber-wrapper"><span class="spinner gray" style="margin: 20px; transition: transform 0ms;"></div>');
				throbber.find('.spinner').css('margin-left',this.winWidth /2 - throbber.find('.spinner').width() /2);
				$('#memory_card_text').html(throbber);
			}
			if(!SkyVR.isCameraID()){
				clearInterval(application.updateSettingsInfoInterval);
			}

			// memory card
			var self = this;
			SkyVR.cameraMemoryCard().done(function(memory_card){
				if(memory_card){
					var memory_card_status = {
						"none" : app.polyglot.t("memory_card_none"),
						"normal" : app.polyglot.t("memory_card_normal"),
						"need-format" : app.polyglot.t("memory_card_need_format"),
						"formatting" : app.polyglot.t("memory_card_formatting"),
						"initialization" : app.polyglot.t('memory_card_initialization')
					};
					if(other){
						if(other.status)
							memory_card.status = other.status;
						if(other.size)
							memory_card.size = other.size;
						if(other.free)
							memory_card.free = other.free;
					}

					var freePercent = 0;
					var size = '-';
					var free = '-';
					if(memory_card.size)
						size = memory_card.size + ' MB';

					if(memory_card.free){
						free = memory_card.free + ' MB';
						if(memory_card.size && memory_card.size != 0)
							free += ' (' + Math.floor(100*memory_card.free/memory_card.size) + '%)';
					}				

					$('#memory_card_text').html(
						application.buildParamList([
							{'name' : app.polyglot.t('memory_card_status'), 'value': memory_card_status[memory_card.status] },
							{'name' : app.polyglot.t('memory_card_size'), 'value': size},
							{'name' : app.polyglot.t('memory_card_available'), 'value':  free}
						])
					);
					if(memory_card.status == "none"){
						$('#memory_card_format').hide();
					}else{
						$('#memory_card_format').show();
					}
				}else{
					$('#memory_card_text').html(
						application.buildParamList([
							{'name' : app.polyglot.t('memory_card_status'), 'value': app.polyglot.t("memory_card_none") },
							{'name' : app.polyglot.t('memory_card_size'), 'value': '-' },
							{'name' : app.polyglot.t('memory_card_available'), 'value':  '-' }
						])
					);
					$('#memory_card_format').hide();
				}
			});
		},
		asyncLoadSettings: function(){
			var self = this;
			console.log("[CAMERA_SETTINGS_VIEW] async load begin");
			this.updateInformationAboutMemoryCard();
			clearInterval(application.updateSettingsInfoInterval);
			application.updateSettingsInfoInterval = setInterval(this.updateSettingsInfo, 5000);
			var tmpcam = SkyVR.cache.cameraInfo();
			var lp_tmp = [];
			
			// {'name' : 'ID: ', 'value':  self.camera['id'] },
			
			if(tmpcam['device']){
				lp_tmp.push({'name' : app.polyglot.t('Model: '), 'value': tmpcam['device']['model'] });
				lp_tmp.push({'name' : app.polyglot.t('Serial No: '), 'value':  tmpcam['device']['serial_number']});
			}
			lp_tmp.push({'name' : app.polyglot.t('S/W version: '), 'value':  tmpcam['fw_version']});
			
			if(tmpcam['p2p'] && tmpcam['p2p']['public']){
				lp_tmp.push({'name' : app.polyglot.t('IP address: '), 'value':  tmpcam['p2p']['public']['external_ip'] });
			}

			var lp = [];
			for(i in lp_tmp){
				if(lp_tmp[i].value){
					lp.push(lp_tmp[i]);
				}
			}

			if(lp.length > 0)
				$('#caminfo_text').html("<p>" + application.buildParamList(lp) + "</p>");	
			else if(application.camera.hosted == true)
				$('#caminfo_text').html("<p>" + application.buildParamList([{'name': app.polyglot.t('hosted_camera'), 'value': '' }]) + "</p>");
			else
				$('#caminfo_text').html("<p>-</p>");

			if(conf.debug == true){
				$('#othercaminfo_text').html('');
				var cam = SkyVR.cache.cameraInfo();
				if(cam['p2p']){
					var local_ip = cam && cam.ip ? cam.ip : undefined;
					var external_ip = cam && cam.p2p.public && cam.p2p.public.external_ip ? cam.p2p.public.external_ip : undefined;
					var public_ip = cam && cam.p2p.public && cam.p2p.public.ip ? cam.p2p.public.ip : undefined;
					
					if(cam && cam.ip != undefined && cam.p2p.local != undefined){
						lp = [];
						lp.push({'name' : app.polyglot.t('local_ip_address_web'), 'value':  local_ip + ":" + cam.p2p.local.web_port });
						lp.push({'name' : app.polyglot.t('local_ip_address_rtmp'), 'value':  local_ip + ":" + cam.p2p.local.rtmp_port });
						lp.push({'name' : app.polyglot.t('local_ip_address_rtsp'), 'value':  local_ip + ":" + cam.p2p.local.rtsp_port });
						$('#othercaminfo_text').append(application.buildParamList(lp));
						$('#othercaminfo_text').append('<div class="clear"></div>');
					}

					if(cam && cam.p2p.public && external_ip){
						lp = [];
						// show external_ip like public
						lp.push({'name' : app.polyglot.t('public_ip_address_web'), 'value':  external_ip + ":" + cam.p2p.public.web_port });
						lp.push({'name' : app.polyglot.t('public_ip_address_rtmp'), 'value':  external_ip + ":" + cam.p2p.public.rtmp_port });
						lp.push({'name' : app.polyglot.t('public_ip_address_rtsp'), 'value':  external_ip + ":" + cam.p2p.public.rtsp_port });
						$('#othercaminfo_text').append(application.buildParamList(lp));
						$('#othercaminfo_text').append('<div class="clear"></div>');
					}

					if(cam && cam.p2p.public && external_ip != public_ip && public_ip != undefined){
						lp = [];
						// show public.ip like external
						lp.push({'name' : app.polyglot.t('external_ip_address_web'), 'value':  public_ip + ":" + cam.p2p.public.web_port });
						lp.push({'name' : app.polyglot.t('external_ip_address_rtmp'), 'value':  public_ip + ":" + cam.p2p.public.rtmp_port });
						lp.push({'name' : app.polyglot.t('external_ip_address_rtsp'), 'value':  public_ip + ":" + cam.p2p.public.rtsp_port });
						$('#othercaminfo_text').append(application.buildParamList(lp));
						$('#othercaminfo_text').append('<div class="clear"></div>');
					}
				}

				// only for debug server
				if(cam && cam.limits && window.location.host == "54.173.34.172"){
					lp = [];
					lp.push({'name' : app.polyglot.t('bitrate_warn'), 'value':  cam.limits.bitrate_warn != null ? cam.limits.bitrate_warn + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('clips_duration'), 'value':  cam.limits.clips_duration != null ? cam.limits.clips_duration  + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('clips_warn'), 'value':  cam.limits.clips_warn != null ? cam.limits.clips_warn  + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('download_duration'), 'value':  cam.limits.download_duration != null ? cam.limits.download_duration  + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('download_warn'), 'value':  cam.limits.download_warn != null ? cam.limits.download_warn  + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('expected_bitrate'), 'value':  cam.limits.expected_bitrate != null ? cam.limits.expected_bitrate  + ' ' + app.polyglot.t('kbps') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('expire'), 'value':  cam.limits.expire != null ? cam.limits.expire : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('expire_warn'), 'value':  cam.limits.expire_warn != null ? cam.limits.expire_warn : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('issued'), 'value':  cam.limits.issued != null ? cam.limits.issued : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('records_duration'), 'value':  cam.limits.records_duration != null ? cam.limits.records_duration   + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					lp.push({'name' : app.polyglot.t('records_max_age'), 'value':  cam.limits.records_max_age != null ? cam.limits.records_max_age   + ' ' + app.polyglot.t('hours') : app.polyglot.t('Nope') });
					$('#othercaminfo_text').append(application.buildParamList(lp));
					$('#othercaminfo_text').append('<div class="clear"></div>');
				}
			}
		},
		getSettingsArray: function(){
			var self = this;
			var d = $.Deferred();
			SkyVR.cameraSettings().done(function(cam_settings){
				console.log("cam_settings: ", cam_settings);
				self.camera = cam_settings;

				var video_caps = cam_settings.video;
				var audio_caps = cam_settings.audio;
				if(cam_settings['media_streams'] && cam_settings.media_streams.mstreams_supported.length == 0){
					console.error("media_streams are not configured");
				}
				if(!video_caps){
					console.error("video_caps are not configured");
				}
				if(!video_caps.caps){
					console.error("video_caps.caps are not configured");
				}
				if(!audio_caps){
					console.error("audio_caps are not configured");
				}

				var ms_id = cam_settings.media_streams.live_ms_id;
				var ms_arr = cam_settings.media_streams.mstreams_supported;
				var vs_id = '';
				if(ms_id != ""){
					for(var i = 0; i < ms_arr.length; i++){
						if(ms_arr[i].id == ms_id){
							vs_id = ms_arr[i].vs_id;
						}
					}
				}

				var stream_caps = null;
				if(vs_id != "" && cam_settings['video'] && cam_settings['video']['streams']){
					stream_caps = cam_settings['video']['streams'][vs_id];
				}
				
				var motion = null;
				var sound = null;
				if(cam_settings['event_processing'] && cam_settings['event_processing']['events']){
					var evnts = cam_settings['event_processing']['events'];
					motion = evnts['motion'];
					sound = evnts['sound'];
				}

				var control_options_title = null;
				var control_options = [];
				control_options.push({
					'setting_name': app.polyglot.t('Camera On/Off'),
					'value': self.camera.status != "active" ? "off" : "",
					'type': 'power_button',
					'first_state': ''
				});

				var record_mode_name;
				switch(self.camera["rec_mode"]){
					case 'on':
						record_mode_name = app.polyglot.t('On');
						break;
					case 'by_event':
						record_mode_name = app.polyglot.t('By event');
						break;
					case 'off':
						record_mode_name = app.polyglot.t('Off');
						break;
				}

				var scheduler_status = false;
				if(cam_settings.mode == "schedule" || cam_settings.mode == "on_till_sched" || cam_settings.mode == "off_till_sched"){
					scheduler_status = true;
				}

				//scheduler_status = true;
				var recording_options_title = {'setting_name': app.polyglot.t('Recording'), 'type': 'devider'};
				var recording_options = [];
				var camera_record_mode_inputs = [];
				camera_record_mode_inputs.push({'value': 'on', 'name': app.polyglot.t('recording_сontinuous')});
				if(SkyVR.isP2PStreaming())
					camera_record_mode_inputs.push({'value': 'by_event', 'name': app.polyglot.t('recording_by_event')});
				camera_record_mode_inputs.push({'value': 'off', 'name': app.polyglot.t('no_recording')});
				
				recording_options.push({
					'setting_name': app.polyglot.t('Scheduler'),
					'desc1': app.polyglot.t('While scheduler is turned off, selected operating mode is applied all the time.'),
					'desc2': app.polyglot.t('Configure weekly and daily schedule: stand-by mode of a camera / recording mode.'),
					'type': 'toggle_dropdown',
					'first_state': '',
					'input_name': 'camera_record_mode',
					'input_type': 'radio',
					'input_name_second': 'go_scheduler',
					'value': scheduler_status ? "" : "off",
					'display_first': scheduler_status ? "hide" : "",
					'display_second': scheduler_status ? "" : "hide",
					'inputs': camera_record_mode_inputs,
					'current': {'value': self.camera["rec_mode"], 'name': record_mode_name}
				});
			
				var storage_options = [];
				var storage_options_title = {'setting_name': app.polyglot.t('menu_storage'), 'type': 'devider'};
				if(SkyVR.isP2PStreaming()){
					storage_options.push({
						'setting_name': app.polyglot.t('menu_memory_card'), 
						'value': '',
						'desc': app.polyglot.t('menu_memory_card_description'),
						'type': 'dropdown',
						'first_state': '',
						'input': true,
						'input_name': 'memory_card',
						'input_type': 'memory_card',
						'inputs': [{}],
						'current': false
					});
				}

				var video_options = [];
				var video_options_title = {'setting_name': app.polyglot.t('Video'), 'type': 'devider'};

				var resolutions = [];
				if(stream_caps && stream_caps.resolution && stream_caps.caps[0] && stream_caps.caps[0].resolutions){
					for(var i=0;i<stream_caps.caps[0].resolutions.length;i++){
						resolutions.push({
							'value': JSON.stringify(stream_caps.caps[0].resolutions[i]),
							'name': stream_caps.caps[0].resolutions[i][0] + 'x' + stream_caps.caps[0].resolutions[i][1],
							'w': stream_caps.caps[0].resolutions[i][0]
						});
						//stream_caps.caps.resolutions[i];
					}
					resolutions = resolutions.sort(function(a,b){ if (a.w < b.w) return -1; if (a.w > b.w) return 1; return 0; });				
					video_options.push({
							'setting_name': app.polyglot.t('Resolution'),
							'desc': app.polyglot.t('Better image quality can be obtained with larger resolution, while it increases storage and network bandwidth consumption.'),
							'type': 'dropdown',
							'first_state': '',
							'input': true,
							'input_name': 'camera_media_mode', 
							'input_type': 'radio', 
							'inputs': resolutions,
							'current': {'value': JSON.stringify(stream_caps.resolution), 'name': stream_caps.resolution[0] + 'x' + stream_caps.resolution[1]}
					});
				}

				if(stream_caps && stream_caps.caps[0] && stream_caps.caps[0].vbr_quality){
					var inputs = [];
					var qualitys = [app.polyglot.t("Extremely Low"), 
									app.polyglot.t("Very Low"), 
									app.polyglot.t("Low"), 
									app.polyglot.t("Economy"), 
									app.polyglot.t("Normal"), 
									app.polyglot.t("High"), 
									app.polyglot.t("Fine"), 
									app.polyglot.t("Extra Fine"), 
									app.polyglot.t("Ultra Fine")];
					//q_length = stream_caps.caps.vbr_quality.length;
					q_length = stream_caps.caps[0].vbr_quality[1] + 1;
					var a = 4 - Math.floor(q_length/2);
					var b = 4 + Math.ceil(q_length/2);
					var this_qualitys = qualitys.splice(a, q_length);

					//qualitys.slice(a, q_length);
					for(var i=0;i<this_qualitys.length;i++){
						this_qualitys[i] = {'value': i, 'name': this_qualitys[i]};
					}

					if(stream_caps.vbr_quality == null){
						stream_caps.vbr_quality = Math.floor(this_qualitys.length/2);
						console.log("[CAMERA-SETTINGS]: set new value for 'vbr_quality'=" + stream_caps.vbr_quality);
						SkyVR.setVBRQuality(stream_caps.vbr_quality, vs_id);
					}

					video_options.push({
						'setting_name': app.polyglot.t('Quality'), 
						'desc': app.polyglot.t('Higher quality setting produces better images with more storage and network consumption inevitably.'),
						'type': 'dropdown',
						'first_state': '',
						'input': true, 
						'input_name': 'camera_quality', 
						'input_type': 'radio',
						'inputs': this_qualitys,
						'current': {'value': stream_caps.vbr_quality, 'name': this_qualitys[stream_caps.vbr_quality].name}
					});
				}

				if(video_caps && video_caps.caps && video_caps.caps.horz_flip && video_caps.caps.horz_flip.length > 0 && video_caps.caps.vert_flip && video_caps.caps.vert_flip.length > 0){
					var inputs = [];
					// correct order added on
					for(var i=0;i< video_caps.caps.horz_flip.length; i++){
						if(video_caps.caps.horz_flip[i] != "off")
							inputs.push({'value': video_caps.caps.horz_flip[i], 'name': app.polyglot.t("On")});
					}
					// correct order added off
					for(var i=0;i< video_caps.caps.horz_flip.length; i++){
						if(video_caps.caps.horz_flip[i] == "off")
							inputs.push({'value': video_caps.caps.horz_flip[i], 'name': app.polyglot.t("Off")});
					}
					video_options.push({
						'setting_name': app.polyglot.t('Rotate'),
						'desc': app.polyglot.t('Turn on Rotate setting when the image come upside-down. It flips the image horizontally and vertically.'),
						'type': 'dropdown',
						'first_state': '',
						'input': true, 
						'input_name': 'camera_rotate_image', 
						'input_type': 'radio', 
						'inputs': inputs,
						'current': {'value': video_caps.horz_flip, 'name': video_caps.horz_flip == "off" ? app.polyglot.t("Off") : app.polyglot.t("On")}
					});
				}
				if(video_caps && video_caps['caps'] && (video_caps.caps.tdn.length > 0 || video_caps.caps.ir_light.length > 0)){
					var inputs = [];
					/*for(var i=0;i< video_caps.caps.tdn.length; i++){
						dict = {"tdn": none, "ir_light": none};
						if()
					}*/
					var dict = {};
					if(video_caps.caps.tdn.indexOf("night") != -1){
						dict["tdn"] = "night";
					}
					if(video_caps.caps.ir_light.indexOf("on") != -1){
						dict["ir_light"] = "on";
					}
					var input = {'value': JSON.stringify(dict), 'name': app.polyglot.t('On')};
					inputs.push(input);

					var dict = {};
					if(video_caps.caps.tdn.indexOf("day") != -1){
						dict["tdn"] =  "day";	
					}
					if(video_caps.caps.ir_light.indexOf("off") != -1){
						dict["ir_light"] = "off";
					}
					var input = {'value': JSON.stringify(dict), 'name': app.polyglot.t('Off')};
					inputs.push(input);
					
					var dict = {};
					if(video_caps.caps.tdn.indexOf("auto") != -1){
						dict["tdn"] = "auto";
					}
					if(video_caps.caps.ir_light.indexOf("auto") != -1){
						dict["ir_light"] = "auto";
					}
					var input = {'value': JSON.stringify(dict), 'name': app.polyglot.t('Auto')};
					inputs.push(input);
					
					var current = {};
					var name;
					
					if(video_caps.tdn == "night" || video_caps.ir_light == "on"){
						name = app.polyglot.t('On');
					}
					if(video_caps.tdn == "day" || video_caps.ir_light == "off"){
						name = app.polyglot.t('Off');
					}
					if(video_caps.tdn == "auto" || video_caps.ir_light == "auto"){
						name = app.polyglot.t('Auto');
					}
					
					if (video_caps.tdn)
						current["tdn"] = video_caps.tdn;
					if (video_caps.ir_light)
						current["ir_light"] = video_caps.ir_light;
					video_options.push({
							'setting_name': app.polyglot.t('Night vision'),
							'desc': app.polyglot.t('Night vision is used to get black and white image in low illumination environment.'),
							'type': 'dropdown',
							'first_state': '',
							'input': true, 
							'input_name': 'camera_night_vision', 
							'input_type': 'radio', 
							'inputs': inputs,
							'current': {'value': JSON.stringify(current), 'name': name}
						});
				}
				var audio_options = [];
				var audio_options_title = {'setting_name': app.polyglot.t('Audio'), 'type': 'devider'};
				if(audio_caps && audio_caps.caps && audio_caps.caps.speaker){
					audio_options.push({
						'setting_name': app.polyglot.t('Speaker volume'),
						'type': 'dropdown',
						'first_state': '',
						'desc': app.polyglot.t('Controls the volume of camera’s speaker.'),
						'input': true,
						'current': {'name': audio_caps.spkr_mute ? app.polyglot.t("Mute") : audio_caps.spkr_vol},
						'input_type': 'slider',
						'value': audio_caps.spkr_vol,
						'mute': audio_caps.spkr_mute ? "off" : "",
						'input_name': 'speaker',
						'min_value': 0,
						'max_value': 100
					});
				}

				if(audio_caps && audio_caps.caps && audio_caps.caps.microphone){
					audio_options.push({
						'setting_name': app.polyglot.t('Mic gain'),
						'type': 'dropdown',
						'first_state': '',
						'desc': app.polyglot.t('Controls the sensitivity of camera’s mic.'),
						'input': true,
						'current': {'name': audio_caps.mic_mute ? app.polyglot.t("Mute") : audio_caps.mic_gain},
						'input_type': 'slider',
						'value': audio_caps.mic_gain,
						'mute': audio_caps.mic_mute ? "off" : "",
						'input_name': 'microphone',
						'min_value': 0,
						'max_value': 100
					});
				}

				var alarm_options = [];
				var alarm_options_title = {'setting_name': app.polyglot.t('Alarm'), 'type': 'devider'};
				if(motion != null){
					alarm_options.push({
						'setting_name': app.polyglot.t('Motion'),
						'desc': app.polyglot.t('Push alarms are sent to your mobile devices when motion activity are detected in the camera.'),
						'type': 'dropdown',
						'first_state': '',
						'input': true,
						'input_name': 'motion_alarm',
						'input_type': 'radio',
						'inputs': [
							{'value': 'true', 'name': app.polyglot.t('On')},
							{'value': 'false', 'name': app.polyglot.t('Off')}
						],
						'current': {'name': motion.notify ? app.polyglot.t("On") : app.polyglot.t("Off"), 'value': motion.notify.toString()}
					});
				}

				if(sound != null){
					alarm_options.push({
						'setting_name': app.polyglot.t('Sound'),
						'desc': app.polyglot.t('Push alarms are sent to your mobile devices when sound activity are detected in the camera.'),
						'type': 'dropdown',
						'first_state': '',
						'input': true,
						'input_name': 'sound_alarm',
						'input_type': 'radio',
						'inputs': [
							{'value': 'true', 'name': app.polyglot.t("On")},
							{'value': 'false', 'name': app.polyglot.t("Off")}
						],
						'current': {'name': sound.notify ? app.polyglot.t("On") : app.polyglot.t("Off"), 'value': sound.notify.toString()}
					});
				}
				var general_options = [];
				var general_options_title = {'setting_name': app.polyglot.t('General'), 'type': 'devider'};
				
				if(CloudAPI.hasAccessSettings()){
					general_options.push({
						'setting_name': app.polyglot.t('Name'), 
						'value': self.camera['name'], 
						'desc': app.polyglot.t('Describe your camera name or installed location'),
						'type': 'dropdown',
						'first_state': '',
						'input': true, 
						'input_name': 'camera_name', 
						'input_type': 'text', 
						'inputs': [{}],
						'current': { 'name': self.camera['name'], 'value': self.camera['name']}
					});
				}
			
				if(CloudAPI.hasAccessSettings()){
					if(self.camera.url){
						general_options.push({
							'setting_name': app.polyglot.t('hosted_configuration'), 
							'value': self.camera['url'],
							'desc': app.polyglot.t('camera_settings_url_description'),
							'type': 'dropdown',
							'first_state': '',
							'input': true,
							'input_name': 'camera_url_edit',
							'input_type': 'url_edit',
							'inputs': [
								{'name': 'camera_url', 'type': 'text', 'value': self.camera['url'], 'holder': app.polyglot.t('new_camera_live_stream_url')},
								{'name': 'camera_login', 'type': 'text', 'value': self.camera['login'], 'holder': app.polyglot.t('new_camera_live_stream_login')},
								{'name': 'camera_password', 'type': 'password', 'value': self.camera['password'], 'holder': app.polyglot.t('new_camera_live_stream_password')},
							],
							'current': { 'name': self.camera['url'], 'value': self.camera['url']}
						});
					}
				}

				if(CloudAPI.hasAccessSettings()){
					if(cam_settings["led"] != undefined && (!cam_settings.url)){
						general_options.push({
							'setting_name': app.polyglot.t('LED'), 
							'desc': app.polyglot.t('Camera’s status LED can be turned off if unwanted.'),
							'type': 'dropdown',
							'first_state': '',
							'input': true, 
							'input_name': 'led', 
							'input_type': 'radio', 
							'inputs': [
										{'value': 'true', 'name': app.polyglot.t('On')}, 
										{'value': 'false', 'name': app.polyglot.t('Off')}
									  ],
							'current': {'name': cam_settings["led"] ? app.polyglot.t('On') : app.polyglot.t('Off'), 'value': cam_settings["led"].toString()}
						});
					}
				}

				if(CloudAPI.hasAccessSettings()){
					var timeZonesList = _.map(timezone.tz.names(), function (zone) {
						var offset = Math.floor(timezone.tz(zone).utcOffset()/60);
						var name = "";
						if(Math.abs(offset) >=10){
							name = (offset < 0 ? "-" : "+") + Math.abs(offset);
						}else{
							name = (offset < 0 ? "-" : "+") + "0" + Math.abs(offset);
						}
						return {
							value: zone,
							name: "(UTC" + name + ":00) " + zone
						};
					});
					general_options.push({
						'setting_name': app.polyglot.t('Time zone'),
						'desc': app.polyglot.t('Correct configuration of camera’s time zone is essential to view recorded data with correct time.'),
						'type': 'dropdown',
						'first_state': '',
						'input': true,
						'input_name': 'timezone',
						'input_type': 'select',
						'inputs' : timeZonesList,
						'current': {'name': self.camera['timezone'], 'value': self.camera['timezone']}
					});
				}

				if(CloudAPI.hasAccessSettings()){
					general_options.push({'setting_name': app.polyglot.t('menu_camera'),
						'desc': app.polyglot.t('information_about_camera'),
						'type': 'dropdown', 
						'first_state': '',
						'input': true,
						'input_name': 'caminfo',
						'input_type': 'caminfo',
						'current': false
					});
				}
				
				if(conf.debug == true && !cam_settings.url){
					general_options.push({'setting_name': app.polyglot.t('menu_camera_other'),
						'desc': app.polyglot.t('other_information_about_camera'),
						'type': 'dropdown', 
						'first_state': '',
						'input': true,
						'input_name': 'othercaminfo',
						'input_type': 'info',
						'current': false
					});
				}
				
				// join
				var list = [];
				function append(title, arr){
					if(arr.length > 0){
						if(title) list.push(title);
						for(var i = 0; i < arr.length; i++){
							list.push(arr[i]);
						}
					}
				}
				
				if(CloudAPI.hasAccessSettings()){
					append(control_options_title, control_options);
					append(recording_options_title, recording_options);
				}

				if(!cam_settings.url && CloudAPI.hasAccessSettings()){
					append(storage_options_title, storage_options);
				}
				
				// Streaming settings
				streaming_sett = CloudUI.generateStreamingSettings(cam_settings);
				if(streaming_sett.options.length > 0){
					append(streaming_sett.title, streaming_sett.options);
				}
				
				if(!cam_settings.url && CloudAPI.hasAccessSettings()){
					append(video_options_title, video_options);
					append(audio_options_title, audio_options);
					append(alarm_options_title, alarm_options);	
				}
				append(general_options_title, general_options);
				
				// Player Settings
				playersett = CloudUI.generatePlayerSettings();
				append(playersett.title, playersett.options );
				
				d.resolve(list);
			}).fail(function(){
				d.reject();
			});
			return d;
		},
		showMainMenuinModal: function(){
			var d = $.Deferred();
			$('#camera-settings-modal-content').empty();
			var height = $('#camera-settings-modal-content').parent().height() - $('#camera-settings-modal-content').parent().find('.header').height();
			$('#camera-settings-modal-content').html(
				'<div class="skyvr-loading-settings" style="height: ' + height + 'px; line-height:' + height + 'px;">'
				+ '<div class="skyvr-loading-settings-content">Loading...</div>'
				+ '</div>'
			);

			application.getSettingsArray().done(function(settings_elements){
				var template = _.template($('#templates #camera-settings-mainmenu').html());
				var template = $('<div class="settings-list"></div>');

				//template = $(template({}));
				//var settings_list = template.find('.settings-list');

				for(var i=0;i<settings_elements.length; i++){
					var settings_list_element;
					switch(settings_elements[i]['type']){
						case 'dropdown':
							settings_list_element = _.template($('#templates #camera-settings-dropdown-element').html());
							break;
						case 'devider':
							settings_list_element = _.template($('#templates #camera-settings-devider-element').html());
							break;
						case 'new_window':
							settings_list_element = _.template($('#templates #camera-settings-new-window-element').html());
							break;
						case 'power_button':
							settings_list_element = _.template($('#templates #camera-settings-power-button-element').html());
							break;
						case 'read_only':
							settings_list_element = _.template($('#templates #camera-settings-new-read_only-element').html());
							break;
						case 'toggle_dropdown' :
							settings_list_element = _.template($('#templates #camera-settings-drapdown-toggle-element').html());
							break;
					}
					template.append(settings_list_element(settings_elements[i]));
				}
				console.log("popup-wrapper recreate");
				$('#camera-settings-modal-content').html(template);

				application.asyncLoadSettings();
				d.resolve();
			}).fail(function(){
				$('#camera-settings-modal-content').empty();
				$('#camera-settings-modal-content').html("Fail");
				d.reject();
			})
			return d;
		},
		hide : function(){
			console.log("MainMenuinModal : hide");
			$('#camera-settings-modal-content').empty();
		}
	};
	
	return application;
});
