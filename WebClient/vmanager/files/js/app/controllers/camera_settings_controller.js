define(['config', 'backbone','underscore', 'application', '../views/camera_settings_view','event', 'camera-toggle', 'jquery-ui'], function(conf, bb,_,app,cam_settings_view, event, ctoggle){
	var application = {
		show : function(){
			var self = this;
			
			event.trigger(event.GET_CAMERA,function(cam){
				self.camera = cam;
			});
			cam_settings_view.show().done(function(){
				var dropdownHandler = function() {
					var previous_h = $(this).parent().height();
					$(this).parent().toggleClass('active');
					
					// change scroll top position
					var parent_top = Math.floor($(this).parent().parent().position().top);
					var curernt_top = Math.floor($(this).parent().position().top);

					var header_h = $('.camera-settings-popup .header').height();
					var dialog_h = $('#camera-settings-modal-content').height();
					var menu_h = dialog_h - header_h;
					var current_scrolltop = $(this).parent().parent().scrollTop();
					var current_h = Math.floor($(this).parent().height());
					var d_h = current_h - previous_h;
					var real_top = (curernt_top - parent_top);
					if (real_top < 0){
						$(this).parent().parent().scrollTop(current_scrolltop + real_top);
						return;
					}
					if (d_h > 0){
						var bottom = real_top + current_h;
						if(bottom > menu_h){
							var diff = (bottom - menu_h - previous_h);
							if (diff > 0){
								$(this).parent().parent().scrollTop(current_scrolltop + diff);
							}
						}
					}
				};
				var newWindowHandler = function() {
					var template = _.template($('#templates #camera-settings-scheduler-editor').html());
					$('#camera-settings-modal-content').html(template({app: app}));
					$('#back-arrow').removeClass('hide');
					$(".camera-settings-popup .box-modal_close.arcticmodal-close").addClass('hide');

					$('#back-arrow').unbind().click(function(){
						application.show();
						/*$('#back-arrow').addClass('hide');
						cam_settings_view.showMainMenuinModal();
						$('.settings-list-element.dropdown .element-name').click(dropdownHandler);
						$('.settings-list-element.new-window .element-name').click(newWindowHandler);
						$('.power-button').click(function(){
							$(this).toggleClass('off');
						});*/
						$('#back-arrow').addClass('hide');
						$(".camera-settings-popup .box-modal_close.arcticmodal-close").removeClass('hide');
					});

					// test
					var drawingCanvas = document.getElementById("camera-settings-scheduler-editor-canvas");

					// TODO redesign (currentlly impl is hack)
					var h = $("#camera-settings-scheduler-editor-canvas").parent().parent().height();
					$("#camera-settings-scheduler-editor-canvas").parent().css({'height': (h-54) + 'px'});

					// set width and height
					if(drawingCanvas && drawingCanvas.getContext) {
						var context = drawingCanvas.getContext('2d');
						context.canvas.width  = $("#camera-settings-scheduler-editor-canvas").parent().width();
						context.canvas.height = $("#camera-settings-scheduler-editor-canvas").parent().height();
						/*
						 test width 
						context.fillStyle = "#FFFFFF";
						context.fillRect(0,0,context.canvas.width,context.canvas.height);
						context.fillStyle = "#000000";
						context.fillRect(10,10,context.canvas.width - 20,context.canvas.height - 20);*/
					}
					Scheduler24.show('camera-settings-scheduler-editor-canvas');
					Scheduler24.config.base_api_url = conf.base_api_url;
					Scheduler24.config.replaceByEventToOn = !SkyVR.isP2PStreaming();
					Scheduler24.selectLegend('_');
					Scheduler24.load("Monday");
				};

				$('.settings-list-element.dropdown .element-name').click(dropdownHandler);
				$('.settings-list-element.new-window .element-name').click(newWindowHandler);
				$('form#camera_name').submit(function(event){
					event.preventDefault();
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					form_data = _.object(_.map($(this).serializeArray(), _.values))
					var obj = {};
					obj.name = form_data['camera_name'];
					self.camera.name = obj.name;
					var el = $(this);
					CloudAPI.updateCamera({"name": obj.name}).done(function(){
						el.parent().parent().find(".current-value").text(obj.name);
					});
				});
				
				$('form#camera_url_edit').submit(function(event){
					event.preventDefault();
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					form_data = _.object(_.map($(this).serializeArray(), _.values))
					var obj = {};
					obj.url = form_data['camera_url'];
					obj.login = form_data['camera_login'];
					obj.password = form_data['camera_password'];
					var el = $(this);
					CloudAPI.updateCamera(obj).done(function(){
						el.parent().parent().find(".current-value").text(obj.url);
					});
				});

				$('#memory_card_refresh').click(function(event) {
					$('#memory_card_text').html(""); // for show throbber
					cam_settings_view.updateInformationAboutMemoryCard();
				});

				$('#memory_card_format').click(function(event){
					event.preventDefault();
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					if (confirm(app.polyglot.t('memory_card_format_confirm'))){
						CloudAPI.formatMemoryCard().done(function(response){
							console.log("formatMemoryCard");
							console.log(response);
							cam_settings_view.updateInformationAboutMemoryCard({"status":"formatting", "size" : 0, "free" : 0});
						});
					}
				});

				$('form#camera_record_mode input').click(function(){
					self.camera["rec_mode"] = $(this).val();
					var obj = {};
					obj.rec_mode = $(this).val();
					title = $(this).next().text();
					CloudAPI.updateCamera(obj).done(function(){
						var ui = {value: title}
							setSetting("camera_record_mode", ui);
					});
				});
				
				$('form#camera_media_mode input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var data = {};
					data.resolution = JSON.parse($(this).val());
					title = $(this).next().text();
					var video_name = CloudAPI.cache.cameraVideoStreamName();
					CloudAPI.updateCameraVideoStream(video_name, data).done(function(){
						var ui = {value: title};
						setSetting("camera_media_mode", ui);
					});
				});
				$('form#camera_quality input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var title = $(this).next().text();
					var vbr_quality = JSON.parse($(this).val());
					var video_name = CloudAPI.cache.cameraVideoStreamName();
					var stream = CloudAPI.cache.cameraVideoStreams()[video_name];
					vbr_quality = vbr_quality + stream.caps[0].vbr_quality[0];
					CloudAPI.updateCameraVideoStream(video_name, {
						vbr_quality: vbr_quality,
						vbr: true
					}).done(function(){
						var ui = {value: title};
						setSetting("camera_quality", ui);
					})
				});

				$('form#camera_rotate_image input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var obj = {};
					obj.horz_flip = $(this).val(); // TODO: obj.horz_flip = obj.vert_flip = $(this).val();
					obj.vert_flip = $(this).val();
					title = $(this).next().text();
					CloudAPI.updateCameraVideo(obj).done(function(){
						var ui = {value: title};
						setSetting("camera_rotate_image", ui);
					});
				});

				$('form#camera_night_vision input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var video = {};
					var value = JSON.parse($(this).val());
					if(value["tdn"])
						video.tdn = value["tdn"];
					if(value["ir_light"])
						video.ir_light = value["ir_light"];

					title = $(this).next().text();
					CloudAPI.updateCameraVideo(video).done(function(){
						var ui = {value: title};
						setSetting("camera_night_vision", ui);
					});
				});

				$('form#speaker .setting-slider').slider({
					range: "max",
					min: 0,
					max: 100,
					animate: true,
					value: $('form#speaker .setting-slider').attr("data-value"),
					disabled: $("form#speaker .slider-toogle").hasClass("off"),
					slide: function(event, ui){
						setSetting("speaker_volume", ui);
					}
				});

				$('form#microphone .setting-slider').slider({
					range: "max",
					min: 0,
					max: 100,
					animate: true,
					value:$('form#microphone .setting-slider').attr("data-value"),
					disabled: $("form#microphone .slider-toogle").hasClass("off"),
					slide: function(event, ui){
						setSetting("microphone_volume", ui);
					}
				});

				var sendData = _.debounce(function(type, value){
					var audio = CloudAPI.cache.cameraAudio();
					if(audio == null) return;

					switch(type){
						case "speaker" :
							audio.spkr_mute = $("form#speaker .slider-toogle").hasClass("off");
							break;
						case "microphone" :
							audio.mic_mute = $("form#microphone .slider-toogle").hasClass("off");
							break;
						case "speaker_volume" :
							audio.spkr_vol = $('form#speaker .setting-slider').slider( "value");
							break;
						case "microphone_volume" :
							audio.mic_gain = $('form#microphone .setting-slider').slider( "value");
							break;
						default:
							return;
					}
					CloudAPI.updateCameraAudio(audio);
				}, 900);

				var setSetting = function(type, ui){
					switch(type){
						case "speaker" :
							var text = $("form#speaker .slider-toogle").hasClass("off")? "Mute" : $('form#speaker .setting-slider').slider( "value");
							$("form#speaker").parent().parent().find(".current-value").text(text);
							sendData(type);
							break;
						case "microphone" :
							var text = $("form#microphone .slider-toogle").hasClass("off")? "Mute" : $('form#microphone .setting-slider').slider( "value");
							$("form#microphone").parent().parent().find(".current-value").text(text);
							sendData(type);
							break;
						case "speaker_volume" :
							$("form#speaker").parent().parent().find(".current-value").text(ui.value);
							sendData(type);
							break;
						case "microphone_volume" :
							$("form#microphone").parent().parent().find(".current-value").text(ui.value);
							sendData(type);
							break;
						case "camera_record_mode" :
							$("form#camera_record_mode").parent().parent().find(".current-value").text(ui.value);
							break;
						case "camera_media_mode" :
							$("form#camera_media_mode").parent().parent().find(".current-value").text(ui.value);
							break;
						case "camera_quality" :
							$("form#camera_quality").parent().parent().find(".current-value").text(ui.value);
							break;
						case "camera_rotate_image" :
							$("form#camera_rotate_image").parent().parent().find(".current-value").text(ui.value);
							break;
						case "camera_night_vision" :
							$("form#camera_night_vision").parent().parent().find(".current-value").text(ui.value);
							break;
						case "led":
							$("form#led").parent().parent().find(".current-value").text(ui.value);
							break;
					}

					//sendData(type);
				};

				$("form#speaker .slider-toogle").click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					$(this).toggleClass('off');
					if($(this).hasClass("off")){
						$('form#speaker .setting-slider').slider( "option", "disabled", true );
					}else{
						$('form#speaker .setting-slider').slider( "option", "disabled", false );
					}
					setSetting("speaker");
				});

				$("form#microphone .slider-toogle").click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					$(this).toggleClass('off');
					if($(this).hasClass("off")){
						$('form#microphone .setting-slider').slider( "option", "disabled", true );
					}else{
						$('form#microphone .setting-slider').slider( "option", "disabled", false );
					}

					setSetting("microphone");
				});

				$('form#led input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var obj = {};
					obj.led = ($(this).val() == 'true');
					title = $(this).next().text();
					CloudAPI.updateCamera(obj).done(function(){
						var ui = {value: title};
						setSetting("led", ui);
					})
				});

				$('form#sound_alarm input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var notify = $(this).val() === "true";
					var el = this;
					CloudAPI.updateCameraEventProcessingEventsSound({"notify": notify}).done(function(){
						$(el).parent().parent().parent().find(".current-value").text($(el).val() === "true" ? CloudUI.polyglot.t("On") : CloudUI.polyglot.t("Off"));
					})
					
				});

				$('form#motion_alarm input').click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var notify = $(this).val() === "true";
					var el = this;
					CloudAPI.updateCameraEventProcessingEventsMotion({"notify": notify}).done(function(){
						$(el).parent().parent().parent().find(".current-value").text($(el).val() === "true" ? CloudUI.polyglot.t("On") : CloudUI.polyglot.t("Off"));
					})
				});

				$(".camera-power-button").click(function(){
					// TODO: synchronize with code from "files/js/lib/player.js:~545" ".power-button" 
					// button: camera on/off in menu
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					
					var status = !$(this).hasClass("off");
					var camera = ctoggle.setValue(self.camera, "on", status);
					if(camera){
						self.camera = camera;
						$(this).toggleClass('off');

						var statusButton = $('.power-button');
						if(statusButton.hasClass("off")){
							statusButton.removeClass("off");
							statusButton.addClass("on");

							app.player.refreshCameraStatus({"status" : "active"});
							if(app.player.model.get("live")){
								app.player.play();
							}
						}else{
							statusButton.addClass("off");
							statusButton.removeClass("on");

							app.player.refreshCameraStatus({"status" : "inactive", "rec_status" : "off"});
							if(app.player.model.get("live")){
								app.player.pause();
								// TODO close player and show special picture
							}
						}
					}

				});

				$("#go_scheduler").click(newWindowHandler);

				$(".scheduler-power-button").click(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var sched_status = $(this).hasClass("off");
					CloudAPI.cameraInfo().done(function(data){
						var old_mode = data.mode;
						if(data.status == "active"){
							if(!sched_status){
								data.mode = "on";
							}else{
								data.mode = "on_till_sched";
							}
						}else{ // inactive or offline
							if(!sched_status){
								data.mode = "off";
							}else{
								data.mode = "off_till_sched";
							}
						}
						// TODO merge with ctoggle.setValue from file camera-toggle.js
						console.log("Set camera mode (2 place) - (from [" + old_mode + "] to [" + data.mode + "])");
						CloudAPI.updateCamera({"mode": data.mode}).done(function(){
							//backHandler();
						})
					});
					var parent = $(this).parent();
					parent.find(".first-content").toggleClass("hide");
					parent.find(".second-content").toggleClass("hide");
					$(this).toggleClass("off");
				});

				$('form#timezone select').change(function(){
					if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
					var tm_select = this;
					event.trigger(event.TIMELINE_CLEANUP);
					var cmngrid = SkyVR.cameraManagerID();
					SkyVR.cameraManagerInfo(cmngrid, function(data){
						var timezone = $(tm_select).val();
						SkyVR.cameraManagerSetTimezone(cmngrid, timezone, function(){
							SkyVR.cameraInfo().done(function(){
								event.trigger(event.TIMELINE_UPDATE);
							});
						});
						$(tm_select).parent().parent().parent().find(".current-value").text($(tm_select).val());
					},function(){
						event.trigger(event.TIMELINE_UPDATE);
					});
				});

				$(".camera-settings-popup .box-modal_close.arcticmodal-close").removeClass('hide');
				$('#back-arrow').addClass('hide');
			});
		},
		hide : function(){
			console.log("hide");
		}
	};
	_.extend(application, bb.Events);

	
	return application;
});
























