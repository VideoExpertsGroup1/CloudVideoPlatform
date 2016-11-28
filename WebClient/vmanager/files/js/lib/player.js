define('player-model',['backbone'], function(backbone){
    var model = backbone.Model.extend({
        defaults : {
            videoLink : "http://skyvr.videoexpertsgroup.com:12018/hls/17.m3u8?sid=8bwbfr9xxu58rbns6i0k4v70lk91ex8v",
            zoom : 1,
            volume : 0.5
        }
    });

    model = new model(this);
    return model;
});

define('player',['backbone','underscore','player-model','event','config','is','camera-toggle'], function(backbone, underscore,m, event, conf, is, ctoggle){
    var obj = underscore.extend({},backbone.Events);
    underscore.extend(obj,{
        className:'player',
        events:{
        },
        disposePlayer: function(elemId, playerName){
			var self = this;
			var mPlayer = self.model.get(playerName); //livePlayer
			if(mPlayer){
				// console.log("[PLAYER] " + playerName + " player dispose");
				try{
					mPlayer.pause();
					mPlayer.dispose();
					var opt = {};
					opt[playerName] = undefined;
					this.model.set(opt);
					$('#' + elemId).remove();
				}catch (e){
					console.error(e);
					// alert("Please reload page");
					return;
				}
			}
		},
        reinitPlayer: function(elemId, playerName){
			var self = this;

			self.disposePlayer(elemId, playerName);
			$('#full-player-container').append('<video class="flash-player-container video-js vjs-default-skin player-hidden" id="' + elemId + '" preload="auto" poster="images/poster.png"></video>');
			// $('#full-player-container').append('<video class="flash-player-container video-js vjs-default-skin" id="' + elemId + '" poster="files/images/everyXcam.png" controls></video>');
			videojs.options.flash.swf = cc.custom_videojs_swf ? cc.custom_videojs_swf : "swf/video-js-custom-SkyVR.swf";
			videojs.options.hls = {withCredentials: true};
			console.log("[PLAYER] " + playerName + " init");
			var mPlayer = undefined;

            if(SkyVR.containsPageParam('mobile')){
				mPlayer = new AndroidRTMPPlayer(elemId);
				mPlayer.hide();
			}else{
				mPlayer = videojs(elemId, {"preload": "auto"});
				mPlayer.hide = function() { /* TODO */ };
				mPlayer.show = function() { /* TODO */ };
			}

			if(!mPlayer){
                console.error("Could not load player");
                return;
            }

			var opt = {};
			opt[playerName] = mPlayer;
			mPlayer.off("ended");
			if(elemId != 'live-container'){
				mPlayer.on("ended", function(){
					if(!self.model.get("live")){
						// alert("ended");
						self.swapPlayers();
					}
				});
			}
            if(localStorage.volume){
				mPlayer.volume(localStorage.volume);
			}
			this.model.set(opt);
			var zoom = localStorage.zoom;
			if(zoom > 1){
				$(mPlayer.el()).css({'transform' : 'scale('+ zoom +')', 'left': localStorage.zoom_left, 'top': localStorage.zoom_top});
			}else{
				$(mPlayer.el()).css({'transform' : 'scale('+ zoom +')', 'left': '', 'top': ''});
			}
		},
        initialize: function (a){
            this.model = m;
            this.model.set({"streaming_paused": false});

            var self = this;
			// console.log("Player. initialize");
			console.log(a.cam);
			if(localStorage.zoom == undefined || localStorage.zoom == null){
				localStorage.setItem('zoom', 1);
				localStorage.setItem('zoom_left', '');
				localStorage.setItem('zoom_top', '');
			}
			this.reinitPlayer('live-container', 'livePlayer');
			this.reinitPlayer('record-container1', 'firstRecordPlayer');
			this.reinitPlayer('record-container2', 'secondRecordPlayer');
			if(localStorage.volume == undefined || localStorage.volume == null){
				localStorage.setItem("volume", 0.5);
				// console.log("[PLAYER] volume: " + localStorage.volume);
			}
			
			AudioStreaming.showSecuritySettings = function(){
				$('#audio-streaming-swf-container').css("z-index", 1000);
			}

			AudioStreaming.hideSecuritySettings = function(){
				$('#audio-streaming-swf-container').css("z-index", -1);
			}

			AudioStreaming.activityLevel = function(){
				// TODO show activity level
			}

			AudioStreaming.startedPublish = function(){
				// console.log("audio startedPublish");
				SkyVR.cameraBackwardStart();
				self.startDeactivateBackwardAfter();
			}

			AudioStreaming.stoppedPublish = function(){
				// console.log("audio stoppedPublish");
				self.stopDeactivateBackwardAfter();
				SkyVR.cameraBackwardStop();
			}

			this.setZoom(localStorage.zoom, '', '');
            /*if(!livePlayer){
                console.log("Can not load player");
                return;
            }*/

			// update ui by first options
			self.refreshCameraStatus(SkyVR.cache.cameraInfo());

			if(a.cam.status == 'active'){
				this.startWatchDocUserActivity();
			}

			// console.log("CAMERA - BEGIN");
            event.trigger(event.GET_CAMERA, function(cam){
                console.log("CAMERA - ", cam);
                self.camera = SkyVR.cache.cameraInfo();
                self.previousCameraState = self.camera.status;
                var getCameraAndUpdate = function(){
					// console.log("statusCheck - begin");
                    SkyVR.cameraInfo().done(function(data){
						if(!data) return;
                        //console.log("Player. Get new camera settings ", data.responseJSON ? data.responseJSON : data);
                        // console.log("CAMERA - " + JSON.stringify(data));
                        self.camera = data;
                        if(self.camera['status']){
							// console.log("CAMERA status: " + self.camera.status);
							var currentState = self.camera.status;
							if(self.previousCameraState != currentState && currentState == "active"){
								if(self.model.get("live")){
									// console.log("[PLAYER] CAMERA activated (live)");
									self.model.set({lastLiveIdle: 0});
									event.trigger(event.PLAYER_START_LIVE);
								}else{
									if(SkyVR.isP2PStreaming()){
										// console.log("[PLAYER] CAMERA activated (p2p, playback)");
										event.trigger(event.TIMELINE_REINIT_START_RECORD);
									}
									// here just try play
								}

								// console.log("CALENDAR send event: event.CALENDAR_UPDATE")
								event.trigger(event.CALENDAR_UPDATE);
								if(SkyVR.isP2PStreaming()){
									event.trigger(event.TIMELINE_UPDATE);
								}
								self.startWatchDocUserActivity();
							}else if(self.previousCameraState != currentState && currentState != "active"){
								if(self.model.get("live")){
									// console.log("[PLAYER] CAMERA deactivated");
									self.model.set({lastLiveIdle: 0});
									// todo check already paused or not
									if(!self.getLivePlayer().paused())
										event.trigger(event.PLAYER_SET_PAUSE);

									// stop backard audio
									if(!AudioStreaming.isDeactivated()){
										// console.log("[PLAYER] backward audio deacrivate");
										self.stopDeactivateBackwardAfter();
										SkyVR.cameraBackwardStop();
										AudioStreaming.deactivate();
										self.setVolume(localStorage.prev_volume);
									}
									self.stopWatchDocUserActivity();
								}else{
									if(SkyVR.isP2PStreaming()){
										// console.log("[PLAYER] CAMERA deactivated (p2p, playback)");
										// console.log("now: nothing");
										// event.trigger(event.PLAYER_SET_PAUSE);
										self.stopWatchDocUserActivity();
									}else{
										self.startWatchDocUserActivity();
									}
								}
								if(SkyVR.isP2PStreaming()){
									// console.log("CALENDAR send event: event.CALENDAR_CLEANUP")
									event.trigger(event.CALENDAR_CLEANUP);
									event.trigger(event.TIMELINE_CLEANUP);
								}else{
									// console.log("CALENDAR send event: event.CALENDAR_UPDATE")
									event.trigger(event.CALENDAR_UPDATE);
									// event.trigger(event.TIMELINE_UPDATE);
								}
							}						
							self.previousCameraState = currentState;
						}
                        // update states
                        self.refreshCameraStatus(self.camera);
                    });
                    // console.log("statusCheck - end");
                };
                var statusUpdateInterval = setInterval(getCameraAndUpdate, conf.player.status_update_timeout*1000);
                self.model.set({statusCheck: statusUpdateInterval});
                // console.log("CAMERA - END2");
            });
            // console.log("CAMERA - END");

			self.supportBackward = false;
			self.statusBackward = "";
			if(!SkyVR.cache.cameraInfo().url){
				SkyVR.cameraAudio().done(function(audio_struct){
					if(audio_struct.caps && audio_struct.caps.backward && audio_struct.caps.backward == true){
						self.supportBackward = true;
						self.statusBackward = "deactivated";
						$('.microphone').show();
					} else {
						$('.microphone').hide();
					}
				}).fail(function(){
					$('.microphone').hide();
				});
			}else{
				$('.microphone').hide();
			}

            this.setPlayerControllers();

            var reconnectInterval = setInterval(function(){
				// console.log("[PLAYER] reconnectInterval");
				// todo check camera status  must be active
                if(is.desktop() && self.model.get("live") && self.model.has("lastLiveIdle") && (self.model.get("lastLiveIdle") >=10)){
                    // console.log("[Player] Live reconnect");
					self.getLivePlayer().pause();
					//self.reinitLivePlayer();
					if(!SkyVR.hasAccessLive(self.camera)){
						// TODO refresh cam status
						return;
					}
					self.reinitPlayer('live-container', 'livePlayer');
					event.trigger(event.PLAYER_START_LIVE);

                    /*self.getLivePlayer().pause();
					if (typeof document.documentMode != "undefined") { // todo change to condition if(isIE()){
						// console.log("For IE try load video");
						self.getLivePlayer().load();
					}
					var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
					if(is_chrome){ // Safari CSS and Webkit Google Chrome
						console.log("For Safari CSS and Webkit Google Chrome");
						console.log("self.getLivePlayer().error(): " + JSON.stringify(self.getLivePlayer().error()));
						self.getLivePlayer().load(); // -> chrome loop loading 
					}
                    self.getLivePlayer().play();*/
                    self.model.set({lastLiveIdle: 0});
                }
                
                if(self.model.get("live") && self.camera.status == "active" && !self.hasWatchDog()){
					// self.reinitPlayer('live-container', 'livePlayer');
					// event.trigger(event.PLAYER_START_LIVE);
					// force start watchdog
					self.startWatchDog();
				}

				// TODO: for reup for record
				/*if(!self.model.get("live") && self.model.get("lastRecordIdle") >=10){
					var mPlayer = self.getCurrentPlayer();
					console.log("try play player");
					// mPlayer.currentTime(self.model.get("lastRecordPosition"));
					mPlayer.play();
					self.model.set({lastRecordIdle: 0});
				}*/
            }, 30000);
            self.model.set({reconnectCheck: reconnectInterval});

            event.on(event.RECORD_ADDED, function (record) {
                if (record) {
                    if(underscore.isObject(self.model.get('nextRecord'))){
                        console.error('Record collision!!!!!!!!!!!!!!!', self.model.get('nextRecord'))
                    }
                    self.model.set({nextRecord: record});
                    var backPlayer = self.getBackgroundPlayer();
                    backPlayer.src({src: record.url, type: "video/mp4"});
                    backPlayer.pause();
					if(self.getCurrentPlayer().paused()){ // todo if player has not errors
						self.swapPlayers();
						self.model.unset("nextRecord");
                    }
                } else {
                    self.model.unset("nextRecord")
                }
            });
            
            $('.camera-streaming-paused.overlay .goto-live').unbind('click').bind('click', function(){
				event.trigger(event.PLAYER_START_LIVE);
			});         
        },

		// update gui state
		// cam.name - camera name
		// cam.status - active/inactive/inactive_by_scheduler/off
		refreshCameraStatus: function(cam){
			// console.log("[PLAYER] RefreshCameraStatus.");

			// update camera name
			if(typeof cam === "undefined"){
				// console.log("[PLAYER] RefreshCameraStatus. Camera is undefined. Diabled all");

				// button -> off
				var statusButton = $(".card-header .navigation-button.power-button");
				statusButton.removeClass("on");
				statusButton.addClass("off");

				// hide "rec_state"
				var cam_title = $(".cards .type-camera.card .card-header .card-title .title");
				cam_title.removeClass('rec');
				
				// hide live
				$(".cards .card-title .live").hide();
				$(".player-button.goto-live").hide();
				return;
			}

			// update camera name
			if(typeof cam.name !== "undefined"){
				$(".cards .card-title .title").text(cam.name);
			}

			// check current player
			var mCurrentPlayer_code = null;
			
			// check live player
			var mLivePlayer_code = null;

			if(!this.model.get("streaming_paused")){
				if(this.getCurrentPlayer() && this.getCurrentPlayer().error() != null){
					mCurrentPlayer_code = this.getCurrentPlayer().error().code;
					// console.log("this.getCurrentPlayer().error(): " + JSON.stringify(this.getCurrentPlayer().error()));
					// console.log("this.getCurrentPlayer().currentSrc(): " + this.getCurrentPlayer().currentSrc());
				}
				if(this.getLivePlayer() && this.getLivePlayer().error() != null){
					mLivePlayer_code = this.getLivePlayer().error().code;
					// console.log("this.getCurrentPlayer().error(): " + JSON.stringify(this.getLivePlayer().error()));
					// console.log("this.getCurrentPlayer().currentSrc(): " + this.getLivePlayer().currentSrc());
				}
			}

			// update camera status
			if(typeof cam.status !== "undefined"){
				// console.log("Player. Camera status check. " + cam.status);
				var statusButton = $(".card-header .navigation-button.power-button");
				$(".state-overlay-container .big.overlay-container").hide();
				$(".state-overlay-container .big.overlay-container .camera-disconnected.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-off.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-unauthorized.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-videojs-error.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-has-not-live-urls.overlay").hide();
				$(".state-overlay-container .big.overlay-container .camera-streaming-paused.overlay").hide();
				$(".player-button.goto-live").hide();
				// $('.playback-goto-live').hide();
				$('.microphone').hide();
				
				if(this.model.get("streaming_paused")){
					$(".state-overlay-container .big.overlay-container").show();
					$(".state-overlay-container .big.overlay-container .camera-streaming-paused.overlay").show();
					return;
				}

				if(!this.model.get("live")){
					if (this.getCurrentPlayer().paused()){
						$('.playback-play-pause').addClass('playback-pause');
					}else{
						$('.playback-play-pause').removeClass('playback-pause');
					}
				}else{
					if($('.card-container').hasClass('deny-live')){
						$(".state-overlay-container .big.overlay-container").show();
						$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").show();	
					}
				}

				if(cam.status == "active"){
					statusButton.removeClass("off");
					statusButton.addClass("on");
					/*if(!$('.player-control-container').hasClass("support-backward-audio")){
					}*/
					
					
					if(this.model.get("live")){
						$(".cards .card-title .live").text(app.polyglot.t('camera_state_live'));
						$(".cards .card-title .live").show();
						if(!$('.player-control-container').hasClass("controls-locked")){
							if(this.supportBackward == true){
								// console.log('.microphone show ' + this.supportBackward);
								$('.microphone').show();								
							}
						}else{
							// console.log('.microphone hide');
							$('.microphone').hide();
						}

						if($('.card-container').hasClass('livestreamnotfound')){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").show();	
						}else if($('.card-container').hasClass('livestreamnotfound')){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-has-not-live-urls.overlay").show();	
						} else if(mLivePlayer_code && mLivePlayer_code == 4){
							// console.log("[PLAYER] Live player has error 4");
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-errors.overlay").show();
						}
					} else {
						$(".cards .card-title .live").hide();
						$(".player-button.goto-live").show();
						// $('.playback-goto-live').show();
						if(mCurrentPlayer_code && mCurrentPlayer_code == 4){
							// console.log("[PLAYER] Current player has error 4");
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-error.overlay").show();
						}
					}
				}else if(cam.status == "inactive" || cam.status == "inactive_by_scheduler"){
					this.hideSpinner();
					statusButton.removeClass("on");
					statusButton.addClass("off");
					$(".cards .card-title .live").hide();
					// $(".player-button.goto-live").show();
					if(this.model.get("live")){
						if($('.card-container').hasClass('deny-live')){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").show();	
						}else{
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-off.overlay").show();
						}
					}else{
						if(mCurrentPlayer_code != null && mCurrentPlayer_code == 4){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-error.overlay").show();
						}
					}
				}else if(cam.status == "offline"){
					this.hideSpinner();
					statusButton.removeClass("on");
					statusButton.addClass("off");
					$(".cards .card-title .live").hide();
					if(this.model.get("live") || SkyVR.isP2PStreaming()){
						if($('.card-container').hasClass('deny-live')){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").show();	
						}else{
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-disconnected.overlay").show();
						}
					}else{
						// $(".player-button.goto-live").show();
						if(mCurrentPlayer_code != null && mCurrentPlayer_code == 4){
							$(".state-overlay-container .big.overlay-container").show();
							$(".state-overlay-container .big.overlay-container .camera-videojs-error.overlay").show();
						}
						// if p2p mode
					}
				}else if(cam.status == "unauthorized"){
					this.hideSpinner();
					statusButton.removeClass("on");
					statusButton.addClass("off");
					if($('.card-container').hasClass('deny-live')){
						$(".state-overlay-container .big.overlay-container").show();
						$(".state-overlay-container .big.overlay-container .camera-videojs-deny-live.overlay").show();
					}else{
						$(".state-overlay-container .big.overlay-container").show();
						$(".state-overlay-container .big.overlay-container .camera-unauthorized.overlay").show();
					}
					$(".cards .card-title .live").hide();
				}
			}

			// update camera rec_status
			if(typeof cam.rec_status !== "undefined"){
				// console.log("Player. rec_status: " + cam.rec_status);
				var cam_title = $(".cards .type-camera.card .card-header .card-title .title");
				if(cam.rec_status == "on"){
					cam_title.addClass('rec');
				}else{
					cam_title.removeClass('rec');
				}
			}

			// update caption live
			if(this.model.get("live") && !$(".power-button").hasClass("off")){
				$(".cards .card-title .live").text(app.polyglot.t('camera_state_live'));
				$(".cards .card-title .live").show();
			}else{
				$(".cards .card-title .live").hide();
			}
		},

        getCurrentPlayer: function(){
            if(this.model.get("isMainPlayer")){
                return this.model.get("firstRecordPlayer");
            }else{
                return this.model.get("secondRecordPlayer");
            }
        },
        getBackgroundPlayer: function(){
            if(!this.model.get("isMainPlayer")){
                return this.model.get("firstRecordPlayer");
            }else{
                return this.model.get("secondRecordPlayer");
            }
        },
        getLivePlayer: function(){
            return this.model.get("livePlayer");
        },
		stopDeactivateBackwardAfter:function(){
			var self = this;
			if(!self.model)
				return;
			if(self.model.get("backwardDeactivateAfter")){
				clearTimeout(self.model.get("backwardDeactivateAfter"));
				self.model.unset("backwardDeactivateAfter");
			};
		},
		startDeactivateBackwardAfter:function(){
			var self = this;
			if(!self.model)
				return;
			self.stopDeactivateBackwardAfter();
			
			var default_sec = 20000;
			if(SkyVR.containsPageParam('backwardDeactivateAfter')){
				var ds = parseInt(SkyVR.pageParams['backwardDeactivateAfter'], 10);
				if(!isNaN(ds) && ds > 0 && ds < 3600){
					default_sec = ds*1000;
				}
			}

			var t = setTimeout(function(){
				self.stopDeactivateBackwardAfter();
				SkyVR.cameraBackwardStop();
				AudioStreaming.deactivate();
				self.setVolume(localStorage.prev_volume);
			},default_sec);
			self.model.set({"backwardDeactivateAfter": t});
		},
        bindEvents: function(){
            var self = this;
            this.listenTo(event, event.PLAYER_SET_PLAY, function (e) {
                self.play();
                self.refreshCameraStatus(self.camera);
            });

			this.listenTo(event, event.PLAYER_LIVE_CHECK_SIZE, function (e) {
				if(!self.liveVideoHeight && !self.liveVideoWidth){
					var mPlayer = self.getLivePlayer();
					if(mPlayer){
						self.liveVideoHeight = mPlayer.videoHeight();
						self.liveVideoWidth = mPlayer.videoWidth();
					}
				}else{
					var mPlayer = self.getLivePlayer();
					if(mPlayer){
						var w = mPlayer.videoWidth();
						var h = mPlayer.videoHeight();

						if((w != 0 && h != 0) && (h != self.liveVideoHeight || w != self.liveVideoWidth)){
							console.log("[PLAYER] PLAYER_LIVE_CHECK_SIZE");
							var w1 = $('#full-player-container').width();
							$('#full-player-container').width(w1+5);
							setTimeout(function(){
								$('#full-player-container').width('');
							},2000);
							self.liveVideoHeight = h;
							self.liveVideoWidth = w;
						}
					}
				}
			});

            this.listenTo(event, event.PLAYER_TOGGLE_MICROPHONE, function (e) {
				// console.log("[PLAYER] toggle microphone");
				if(self.supportBackward == true){
					// console.log("[PLAYER] backward supported");
					var mPlayer = self.getLivePlayer();

					if(AudioStreaming.support() && this.supportBackward == true){
						console.log("status: " + AudioStreaming.status());
						self.statusBackward = AudioStreaming.status();
					}

					if($('.microphone').hasClass('microphone-off')){
							SkyVR.cameraLiveUrls().done(function(urls){
								// alert(urls.rtmp_backward);
								if(urls.rtmp_backward){
									if(!SkyVR.isP2PStreaming()){
										// console.log("Audio stream Will be pushed to " + urls.rtmp_backward);
										SkyVR.config.backwardURL = urls.rtmp_backward;
										AudioStreaming.activate(urls.rtmp_backward);
										localStorage.setItem("prev_volume", self.volume());
										self.setVolume(0);
									}else{
										var cam = SkyVR.cache.getCameraInfo();
										P2PProvider.findP2PHost(cam.id).done(function(web_url,rtmp_url){
											var p2p_rtmp_backward = urls.rtmp_backward;
											console.log("[PLAYER] p2p_rtmp_backward: " + p2p_rtmp_backward);
											console.log("[PLAYER] rtmp_url: " + rtmp_url);
											if(rtmp_url != null){
												p2p_rtmp_backward = p2p_rtmp_backward.replace(cam.ip + ":" + cam.p2p.local.rtmp_port, rtmp_url.split("/")[2])
											}
											console.log("Audio stream Will be pushed to " + urls.rtmp_backward);
											SkyVR.config.backwardURL = urls.rtmp_backward;
											AudioStreaming.activate(p2p_rtmp_backward);
											localStorage.setItem("prev_volume", self.volume());
											self.setVolume(0);
										});
									}
									$('.microphone').removeClass('microphone-off');
								}else{
									console.error("[PLAYER] Did not found rtmp_backward in live_urls");
								}
							}).fail(function(){
								
							});
					}else{
						$('.microphone').addClass('microphone-off');
						SkyVR.cameraBackwardStop();
						AudioStreaming.deactivate();
						self.setVolume(localStorage.prev_volume);
					};
				};
            });

            this.listenTo(event, event.PLAYER_SET_PAUSE, function (e) {
                self.pause();
            });

            this.listenTo(event, event.PLAYER_START_LIVE, function (e) {
				if(self.model.get("streaming_paused")){
					self.reinitPlayer('live-container', 'livePlayer');
					self.reinitPlayer('record-container1', 'firstRecordPlayer');
					self.reinitPlayer('record-container2', 'secondRecordPlayer');
					self.model.set({"streaming_paused": false});
				}
                self.playLive();
            });

            this.listenTo(event, event.PLAYER_START_RECORD, function (e) {
				if(self.model.get("streaming_paused")){
					self.reinitPlayer('live-container', 'livePlayer');
					self.reinitPlayer('record-container1', 'firstRecordPlayer');
					self.reinitPlayer('record-container2', 'secondRecordPlayer');
					self.model.set({"streaming_paused": false});
				}
                self.playRecord(e);
            });

            this.listenTo(event, event.PLAYER_TOGGLE_FULLSCREEN, function (e) {
                self.toggleFullscreen();
            });

            this.listenTo(event, event.PLAYER_FULLSCREEN_HIDE_CONTROLS, function (e) {
                self.updateFullscreenButtons(true);
            });

            this.listenTo(event, event.PLAYER_FULLSCREEN_UPDATE_CONTROLS, function (e) {
                self.updateFullscreenButtons(false);
            });

            this.listenTo(event, event.TOGGLE_STREAMING, function (e) {
				// console.log("[PLAYER] Toggle streaming");
                self.disposeVideo();
                SkyVR.cameraInfo(function(response){
					self.initialize(response);
					self.bindEvents();
					self.camera = response;
					event.trigger(event.PLAYER_START_LIVE);
				});
            });
        },
        setVolume: function(volume){
            this.getLivePlayer().volume(volume);
            this.getCurrentPlayer().volume(volume);
            this.getBackgroundPlayer().volume(volume);

			// storage
            if(localStorage.volume && localStorage.volume != 0)
				localStorage.setItem("prev_volume", localStorage.volume);
            localStorage.setItem("volume", volume);
            
            // ui
            $("#volume-slider").slider("value", volume*100);
            if(volume == 0){
				$(".volume.player-button").addClass("is-muted");
			}else{
				$(".volume.player-button").removeClass("is-muted");
			}
        },
        volume: function(){
			return localStorage.volume;
		},
		debug: true,
		hasWatchDog: function(){
			return this.model.has("interval");
		},
		stopWatchDog: function(){
			var self = this;
			if(self.hasWatchDog()){
				// console.log("[PLAYER] WatchDog stopping...");
				clearInterval(self.model.get("interval"));
				this.model.unset("interval");
			}else{
				// console.log("[PLAYER] WatchDog are not started");
			}
		},
		startWatchDog: function(){
			var self = this;
			if(self.model.has("interval")){
				// console.log("[PLAYER] WatchDog already started");
				return;
			}
			var intervalFunction = function(){

				if(self.model.get("streaming_paused")){
					return;
				}

				if(self.model.get("live")){
					var mPlayer = self.getLivePlayer();
					// console.log("buffered: " + mPlayer.buffered().start() + " : " + mPlayer.buffered().end());
					try{
						var tCurrentTime = mPlayer.currentTime();
					}catch(e){
						console.error("[PLAYER] has some errors. Will be restart. ", e);
						self.stopWatchDog();
						event.trigger(event.PLAYER_START_LIVE);
						return;
					}

					if(AudioStreaming.support() && self.supportBackward == true){
						var newVal = AudioStreaming.status();
						if(newVal != self.statusBackward && newVal == "activated"){
							// TODO redesign to events
							self.startDeactivateBackwardAfter();
						} else if (newVal != self.statusBackward && newVal == "deactivated"){
							// TODO redesign to events
							self.stopDeactivateBackwardAfter();
						}
						self.statusBackward = newVal;
						// console.log("statusBackwardAudio: " + self.statusBackward);
						if(self.statusBackward == "activated" && $('.microphone').hasClass('microphone-off')){
							$('.microphone').show();
							$('.microphone').removeClass('microphone-off');
						}else if(self.statusBackward == "deactivated" && !$('.microphone').hasClass('microphone-off')){
							$('.microphone').show();
							$('.microphone').addClass('microphone-off');
						/*}else if(self.statusBackward != "deactivated" && self.statusBackward != "activated"){
							$('.microphone').hide(); // unknown status
							$('.audio-streaming-swf-container').show();
						}*/
						}else if(self.statusBackward != "deactivated" && self.statusBackward != "activated"){
							// $('.microphone').hide(); // unknown status
						}
					}else{
						// $('.microphone').hide();
					}

					// if not loaded data yet, we just show position
					if(mPlayer.readyState() != 4 && self.model.has("expectedPosition")){
						var expectedPosition = self.model.get("expectedPosition");
						if(expectedPosition != 0)
							tCurrentTime = expectedPosition;
					}

					if(!self.model.has("lastLivePosition")){
						self.model.set({lastLivePosition: tCurrentTime, lastLiveIdle: 0});
					}

					if(self.model.get("lastLivePosition") != tCurrentTime){
						var t = SkyVR.getCurrentTimeUTC();				
						// console.log("[PLAYER] Live time change event: " + t);
						self.model.set({lastLivePosition: tCurrentTime, lastLiveIdle: 0});
						event.trigger(event.PLAYER_TIME_CHANGED, t);
						event.trigger(event.PLAYER_LIVE_CHECK_SIZE);
						self.hideSpinner();

						// TODO optimize this function
						var size = {};
						size.height = mPlayer.videoHeight();
						size.width = mPlayer.videoWidth();
						event.trigger(event.MDZONES_CHECK_VIDEOSIZE, size);
						
					}else{
						self.showSpinner();
						var idle = self.model.get("lastLiveIdle");
						idle = parseInt("" + idle, 10);
						idle = idle + 1;
						self.model.set({lastLiveIdle: idle});
						// console.log("[PLAYER] Live time idle: " + idle + " sec");
						if (this.debug && this.debug == true){
							$(".camera-idle").show();
							$(".camera-idle").text(idle);
						}
					}
				}else{
					var mPlayer = self.getCurrentPlayer();
					var tCurrentTime = self.model.get("record").startTime + mPlayer.currentTime()*1000;
					// console.log("[PLAYER] Playback time buffered: " + mPlayer.bufferedPercent() + "%");

					try{
						// TODO optimize this function
						var size = {};
						size.height = mPlayer.videoHeight();
						size.width = mPlayer.videoWidth();
						event.trigger(event.MDZONES_CHECK_VIDEOSIZE, size);
					}catch(e){
						console.error(e)
					}

					// if not loaded data yet, we just show position
					if(mPlayer.readyState() != 4 && self.model.has("expectedPosition")){
						// console.log("mPlayer.readyState(): " + mPlayer.readyState());
						var expectedPosition = self.model.get("expectedPosition");
						if(expectedPosition != 0){
							tCurrentTime = expectedPosition;
							event.trigger(event.PLAYER_TIME_CHANGED, tCurrentTime);
							var idle = self.model.get("lastRecordIdle");
							idle = parseInt("" + idle, 10);
							idle = idle + 1;
							self.model.set({lastRecordIdle: idle});
							// console.log("[PLAYER] Playback time idle: " + idle + " sec");
							return;
						}
					}

					if(!self.model.has("lastRecordPosition")){
						self.model.set({lastRecordPosition: tCurrentTime, lastRecordIdle: 0});
					}

					if(self.model.get("lastRecordPosition") != tCurrentTime){
						self.model.set({lastRecordPosition: tCurrentTime, lastRecordIdle: 0});
						var t = Math.floor(tCurrentTime);
						event.trigger(event.PLAYER_TIME_CHANGED, t);
						if(self.model.has("expectedPosition"))
							self.model.unset("expectedPosition");
						// console.log("[PLAYER] Playback time change event: " + t);
						self.hideSpinner();
					}else{
						self.showSpinner();
						var idle = self.model.get("lastRecordIdle");
						idle = parseInt("" + idle, 10);
						idle = idle + 1;
						self.model.set({lastRecordIdle: idle});
						// console.log("[PLAYER] Playback time idle: " + idle + " sec");
						if (this.debug && this.debug == true){
							$(".camera-idle").show();
							$(".camera-idle").text(idle);
						}
					}
				}
			};
			// console.log("[PLAYER] WatchDog starting...");
			var interval = setInterval(intervalFunction,1000);
			self.model.set({interval: interval});
			intervalFunction();
		},
		startWatchDocUserActivity: function(){
			// console.log("[PLAYER] startWatchDocUserActivity");
			var self = this;
			// ifvisible.setIdleDuration(20); // test 20 sec
			ifvisible.setIdleDuration(600); // 10 min == 600 sec
            ifvisible.idle(function(){
				clearInterval(self.user_inactive_countdown);
				self.user_inactive_countdown_sec = 30;
				if(self.model.get("streaming_paused") == true){
					return;
				};
				app.createDialogModal({
					title: app.polyglot.t("idle_state_user"),
					content: app.polyglot.t("please_move_mouse_or_will_be_back")
						.replace("%N%", ' <div style="display: inline-block;" id="user-inactive-countdown">' + self.user_inactive_countdown_sec + '</div>'),
					buttons: [
						{id: 'user-inactive-keep-connection', text: app.polyglot.t("keep_connection"), close: true },
						{id: 'user-inactive-disconnect-now', text: app.polyglot.t("disconnect_now"), close: false },
					],
					'beforeClose' : function(){
						clearInterval(self.user_inactive_countdown);
					}
				});
				$('#user-inactive-countdown').html(self.user_inactive_countdown_sec);
				app.showDialogModal();
				$('#user-inactive-keep-connection').unbind().bind('click', function(){
					clearInterval(self.user_inactive_countdown);
					app.destroyDialogModal();
				});
				$('#user-inactive-disconnect-now').unbind().bind('click', function(){
					clearInterval(self.user_inactive_countdown);
					if(!cc.goto_first_camera){
						app.hideDialogModal();
						app.destroyDialogModal();
						app.trigger('closedeck');
					}else{
						app.hideDialogModal();
						app.destroyDialogModal();
						self.model.set({"streaming_paused": true});
						self.refreshCameraStatus(SkyVR.cache.cameraInfo());
						self.stopWatchDog();
						self.disposePlayer('live-container', 'livePlayer');
						self.disposePlayer('record-container1', 'firstRecordPlayer');
						self.disposePlayer('record-container1', 'secondRecordPlayer');
						
						/*window.close();
						setTimeout(function(){
							if(!window.closed){
								app.showError(app.polyglot.t('Error'), app.polyglot.t('Please close window manually'));
							}
						}, 1000);*/
					}
				});
				
				self.user_inactive_countdown = setInterval(function(){
					self.user_inactive_countdown_sec = self.user_inactive_countdown_sec - 1;
					$('#user-inactive-countdown').html(self.user_inactive_countdown_sec);
					if (self.user_inactive_countdown_sec <= 0){
						clearInterval(self.user_inactive_countdown);
						app.hideDialogModal();
						app.destroyDialogModal();
						var cam_name = SkyVR.cache.cameraInfo().name;
						if(!cc.goto_first_camera){
							app.trigger('closedeck');
						}else{
							self.model.set({"streaming_paused": true});
							self.refreshCameraStatus(SkyVR.cache.cameraInfo());
							self.stopWatchDog();
							self.disposePlayer('live-container', 'livePlayer');
							self.disposePlayer('record-container1', 'firstRecordPlayer');
							self.disposePlayer('record-container1', 'secondRecordPlayer');
						}
						setTimeout(function(){
							app.createDialogModal({
								title: app.polyglot.t("idle_state_user"),
								content: app.polyglot.t("camera_was_disconencted_no_activity").replace("%S%", cam_name),
								buttons: [
									{id: 'user-inactive-ok', text: app.polyglot.t("Ok"), close: true },
								]
							});
							app.showDialogModal();
						}, 2000);
					}
				}, 1000);
			});
		},
		stopWatchDocUserActivity: function(){
			// console.log("[PLAYER] stopWatchDocUserActivity");
			var self = this;
			clearInterval(self.user_inactive_countdown);
            ifvisible.off('idle');
		},
        play: function(position){
            var self = this;
			this.refreshCameraStatus(this.camera);
            var func = function(){
                event.trigger(event.PLAYER_PLAY);
                self.stopWatchDog();
                self.startWatchDog();
            };

            if(!this.model.get("live")){
				
				var mPlayer = this.getCurrentPlayer();
				
				try{	
					mPlayer.currentTime(position);
				}catch(e){
					if(window['ApplicationMobileInterface']){
						ApplicationMobileInterface.toast(e.name + ":" + e.message);
					}
				}

				mPlayer.one("loadeddata", function(){
					// console.log("Play. loadeddata");
					this.currentTime(position);
				});
				mPlayer.volume(localStorage.volume);
				mPlayer.play();
                func();
            }else{
                var mPlayer = this.getLivePlayer();
                self.showSpinner();
				// console.log("[PLAYER] Live src: " + mPlayer.currentSrc());
				mPlayer.volume(localStorage.volume);
				mPlayer.play();
                func();
            }
        },
        pause: function(){
			// console.log("[PLAYER] Live to pause");
			if(this.model.get("live")){
				var mPlayer = this.getLivePlayer();
				if(!mPlayer.paused()){
					// console.log("[PLAYER] Live call pause");
					mPlayer.pause();
					mPlayer.one("play", function () {
						// console.log("[PLAYER] Load + play after pause");
						mPlayer.load();
						mPlayer.play();
						mPlayer.currentTime(0);
					});
				}else{
					// console.log("[PLAYER] Live already paused");
				}
			}else{
				// console.log("[PLAYER] Playback call pause");
				this.getCurrentPlayer().pause();
			}

			this.refreshCameraStatus(this.camera);
			this.stopWatchDog();

			event.trigger(event.PLAYER_PAUSE);
        },
        swapPlayers: function(){
            if(!this.model.has("nextRecord")){
                return;
            }
            // console.log("[PLAYER] Swap Players");
            var isMain = this.model.get("isMainPlayer");
            this.swapPlayerProperties(this.getCurrentPlayer(), this.getBackgroundPlayer());
            $(this.getCurrentPlayer().el()).addClass("player-hidden");
            this.getCurrentPlayer().hide();
            var player = this.getBackgroundPlayer();
            this.model.set({isMainPlayer : !isMain});
            $(player.el()).removeClass("player-hidden");
            player.show();
            player.play();

            var next_record = this.model.get("nextRecord");
            this.model.set({record: next_record});
			this.model.unset("nextRecord");

            var self = this;
            event.trigger(event.RECORD_ENDED, function(record2){
                if(record2){
                    self.model.set({nextRecord: record2});
                    var backPlayer = self.getBackgroundPlayer();
                    backPlayer.src({src: record2.url, type: "video/mp4"});
                    backPlayer.hide();
                    backPlayer.pause();
                }else{
                    self.model.unset("nextRecord")
                }
            });
        },
        swapPlayerProperties: function(currentPlayer, backGroundPlayer){
            backGroundPlayer.volume(currentPlayer.volume());
			this.setZoom(localStorage.zoom, localStorage.zoom_left, localStorage.zoom_top);
        },

        playRecord: function(record){
			this.refreshCameraStatus(SkyVR.cache.cameraInfo());
            if(record && record[0] && !record[0].start && !record[0].position)
				return;

			if(!$('#full-player-container').hasClass("is-playback")){
				$('#full-player-container').addClass("is-playback");
			}

            var self = this;

            this.model.unset("lastLivePosition");
            this.model.unset("lastLiveIdle");
            this.model.unset("expectedPosition");
			this.hideSpinner();

            if(!this.model.has("isMainPlayer")){
                this.model.set({isMainPlayer: true});
            }

            if(this.model.get("live")) {
				$(".cards .card-title .live").hide();
				var liveplayer = this.getLivePlayer();
				var curplayer = this.getCurrentPlayer();
				
				try{liveplayer.pause();}catch(e){};
                try{$(liveplayer.el()).addClass("player-hidden");}catch(e){};
                try{liveplayer.hide();}catch(e){};
                try{$(curplayer.el()).removeClass("player-hidden");}catch(e){};
                try{curplayer.show();}catch(e){};
                setTimeout(function(){
					console.warn("Reinit live player");
					try{self.reinitPlayer('live-container', 'livePlayer');}catch(e){};
				},100);
            }

            this.model.set({live : false});
            this.getLivePlayer().pause();
            this.model.set({record : record[0]});
            var expectedRecordPosition = 0;
            var expectedPosition = 0;
			if(record[0]){
				expectedRecordPosition = (record[0].position - record[0].startTime)/1e3;
				expectedPosition = record[0].position; // full value of position
				if(expectedRecordPosition < 0){
					expectedPosition = record[0].startTime;
				}
				this.model.set({"expectedPosition" : expectedPosition});
				self.model.set({"lastRecordPosition": expectedPosition, lastRecordIdle: 0});
				event.trigger(event.PLAYER_TIME_CHANGED, expectedPosition); // change cursor to expected position
			}

            var mPlayer = this.getCurrentPlayer();
			
			if(record[0] && record[0].url == mPlayer.currentSrc()){
				self.showSpinner();
				// console.log("Plays the same video. " + expectedPosition);

				// console.log("mPlayer.readyState(): " + mPlayer.readyState());
				// console.log("mPlayer.error(): " + JSON.stringify(mPlayer.error()));

				if(mPlayer.readyState() == 0 && mPlayer.error() != null && mPlayer.error().code == 4){
					// console.log("need reinit");
					self.hideSpinner();
					event.trigger(event.TIMELINE_REINIT_START_RECORD);
					return;
					// src.src = record[0].url + "?dt=" + Date().now();
					// mPlayer.load();
				}

				// enough data available to start playing
				if(mPlayer.readyState() == 4){
					mPlayer.currentTime(expectedRecordPosition);
					if(mPlayer.paused()){
						mPlayer.play();
					}
					this.refreshCameraStatus(self.camera);
				}else{
					// console.log("mPlayer.readyState(): " + mPlayer.readyState());
					// ad-hoc
					var changedPos = false;
					/*mPlayer.one("loadstart", function(){
						console.log("Plays the same video. loadstart");
						if (changedPos == false){
							changedPos = true;
							mPlayer.currentTime(expectedRecordPosition);
						}
					});*/
					mPlayer.currentTime(expectedRecordPosition);
					mPlayer.one("loadeddata", function(){
						// console.log("Plays the same video. loadeddata");
						if (changedPos == false){
							changedPos = true;
							mPlayer.currentTime(expectedRecordPosition);
						}
						// self.refreshCameraStatus(self.camera);
					});
					mPlayer.ready(function(){
						// console.log("Plays the same video. ready");
						self.refreshCameraStatus(self.camera);
						if (changedPos == false){
							changedPos = true;
							if(mPlayer.error() == null)
								mPlayer.currentTime(expectedRecordPosition);
						}
					});
					mPlayer.off("error");
					mPlayer.one("error", function(){
						// event.trigger(event.TIMELINE_REINIT_START_RECORD);
					});
				}
                return;
            }

			self.model.unset("nextRecord");
			this.stopWatchDog();

            var src = {type : "video/mp4"};
            if(record[0] && record[0].url){
                mPlayer.off("loadstart");
                mPlayer.one("loadstart", function(){
                    // this.off("loadstart");
                    // console.log("playRecord. loadstart");
                    self.showSpinner();
                });
                mPlayer.off("error");
                mPlayer.one("error", function(){
                    // console.log("[PLAYER] Playback error.");
                    self.refreshCameraStatus(self.camera);
                    if(self.camera.status != "offline" && SkyVR.isP2PStreaming()) {
						// console.log("[PLAYER] Try reinit play again after 5 sec");
						function reinitRecord(){
							event.trigger(event.TIMELINE_REINIT_START_RECORD);
						}
						setTimeout(reinitRecord, 5000);
					}
                });

                if(record[1] && record[1].url){
                    // mPlayer.off("loadeddata");
                    self.model.unset('nextRecord'); // if first player was error
                    mPlayer.one("loadeddata",function(){
                        // console.log("Current player load data. Start load background player");
                        self.refreshCameraStatus(self.camera);
                        // mPlayer.off("loadeddata");
                        self.model.set({nextRecord: record[1]});
                        var sPlayer = self.getBackgroundPlayer();

                        if(SkyVR.isP2PStreaming()){
							sPlayer.src([{
								'type': 'video/mp4',
								'src': record[1].url + "?t=" + (new Date()).getTime()
							}]);
						}else{
							sPlayer.src([{
								'type': 'video/mp4',
								'src': record[1].url
							}]);
						}
                    });
                }else{
                    self.getBackgroundPlayer().src([]);
                    //mPlayer.off("loadeddata");
                    mPlayer.one("loadeddata",function(){
						// console.log("loadeddata");
                        self.hideSpinner();
                    });
                }

				// console.log("JSON.stringify(mPlayer.src()): " + JSON.stringify(mPlayer.src()));
				// src.src = record[0].url;
				
				 if(SkyVR.isP2PStreaming()){
					mPlayer.src([{
						'type': 'video/mp4',
						'src': record[0].url + "?t=" + (new Date()).getTime()
					}]);
				}else{
					mPlayer.src([{
						"type" : "video/mp4",
						'src' : record[0].url
					}]);
				}
				this.play(expectedRecordPosition);
            }
        },

        playLive: function(){
			this.stopWatchDog();

			if($('#full-player-container').hasClass("is-playback")){
				$('#full-player-container').removeClass("is-playback");
			}

            if(!this.model.get("live")){
				var curplayer = this.getCurrentPlayer();
				try{$(curplayer.el()).addClass("player-hidden");}catch(e){};
				try{curplayer.hide();}catch(e){};
				try{curplayer.off("loadeddata");}catch(e){};
				try{curplayer.pause();}catch(e){};
            }

			// this.reinitPlayer('live-container', 'livePlayer');
            $(this.getLivePlayer().el()).removeClass("player-hidden");
            this.getLivePlayer().show();
            this.model.set({live : true});
			this.refreshCameraStatus(this.camera);

			if(!SkyVR.hasAccessLive(this.camera)){
				console.log("!SkyVR.hasAccessLive");
				return;
			}

            var expectedPosition = SkyVR.getCurrentTimeUTC();
			this.model.set({"expectedPosition" : expectedPosition});
			// change cursor to expected position
			event.trigger(event.PLAYER_TIME_CHANGED, expectedPosition);
			setTimeout(function(){
				event.trigger(event.TIMELINE_SEARCH_CURSOR);
			}, 500);

			if(this.camera.status != "active"){
				// console.log("[PLAYER] I will be not start live when camera is off");
				return;
			}

            var self = this;
            var getMediaStreams = function(){
				SkyVR.cameraLiveUrls().done(function(data){
					self.initVideoFromResponse(data);
				}).fail(function(){
					console.error("Could not found live stream URLs. Please check your camera.");
					$('.card-container').addClass("livestreamnotfound");
				});
            };

			// console.log("self.camera: " , self.camera);
			if(SkyVR.isP2PStreaming()){
				// console.log("p2p done: " , self.camera);
				P2PProvider.findP2PHost(self.camera.id).done(function(web_url,rtmp_url){
					console.log("[PLAYER] p2p rtmp_url: " + rtmp_url);
					if(rtmp_url != null){
						self.initVideoFromResponse({
							rtmp: rtmp_url
						});
					}else{
						// HACK got live_urls for tunnel
						SkyVR.cameraLiveUrls().done(function(data){
							self.initVideoFromResponse(data);
						}).fail(function(){
							console.error("Could not found live stream URLs. Please check your camera.");
							$('.card-container').addClass("livestreamnotfound");
						});
					}
				});
				// if fail: self.initVideoFromResponse({});
			}else{
				getMediaStreams();
			}
        },

        initVideoFromResponse: function(data){
			var self = this;
			var mPlayer = this.getLivePlayer();
			// console.log("Cleanup list of player");
			// mPlayer.src([]);

			// console.log("initVideoFromResponse: ", data);
            var src = [];
            if(data.rtmp){
				// console.log("RTMP:", data.rtmp);
				if(mPlayer.currentSrc() != data.rtmp){
					src[0] = {src : data.rtmp, type : "rtmp/mp4"};
				}else{
					this.reinitPlayer('live-container', 'livePlayer');
					src[0] = {src : data.rtmp, type : "rtmp/mp4"};
					mPlayer = this.getLivePlayer();
					$(this.getLivePlayer().el()).removeClass("player-hidden");
					this.getLivePlayer().show();
				}
                if(data.hls && SkyVR.containsPageParam('usehlslive')){
                    src[0] = {src : data.hls, type : "application/x-mpegURL"};
                }
            }else{
                src = [
                    {
                        src  : "/livestreamnotfound",
                        type : "rtmp/mp4"
                    }
                ];
            }
            console.log("Player src", src);

            mPlayer.off("timeupdate");
            mPlayer.one("loadeddata",function(){
				// console.log("live loaded data", self.model.get("live"));
				if(!self.model.get("live"))
					mPlayer.pause();
			});
            mPlayer.one("abort",function(){ console.log("live about"); });
            mPlayer.one("error",function(){
				console.log("live error 2 (try again play live) " + JSON.stringify(mPlayer.error()));
				if(mPlayer.error() != null && mPlayer.error().code == 4){
					// console.error("[PLAYER] Problem with file format");
				}
				// self.reinitPlayer('live-container', 'livePlayer');
				// event.trigger(event.PLAYER_START_LIVE);
			});

			if(src.length > 0){
				mPlayer.src(src);
			}
            // console.log("start player");
            this.play();
        },

        showSpinner: function(){
            if(this.statusBackward != "transitive")
				$(".camera-spinner").show();
			else
				$(".camera-spinner").hide();

            /*if (this.debug && this.debug == true){
				$(".camera-idle").show();
				$(".camera-idle").text("");
			}*/
        },

        hideSpinner: function(){
            $(".camera-spinner").hide();
            if (this.debug && this.debug == true){
				$(".camera-idle").hide();
				$(".camera-idle").text("");
			}
        },

        setPlayerControllers: function(){
            var self = this;

            this.bindZoomButtons();

			$(".player-button.goto-live").unbind().bind("click",function(){
                event.trigger(event.PLAYER_START_LIVE);
            });

            $(".playback-goto-live").unbind().bind("click",function(){
                event.trigger(event.PLAYER_START_LIVE);
            });

            $(".playback-play-pause").unbind().bind("click",function(){
				self.model.set({"streaming_paused": false});
                if ($('.playback-play-pause').hasClass('playback-pause'))
					event.trigger(event.PLAYER_SET_PLAY);
                else
					event.trigger(event.PLAYER_SET_PAUSE);
            });
            
            $(".microphone").unbind().bind("click",function(){
                event.trigger(event.PLAYER_TOGGLE_MICROPHONE);
            });

			$(".playback-back").unbind().bind("click",function(){
                event.trigger(event.TIMELINE_SET_BACK30SEC);
            });

            $(".playback-forward").unbind().bind("click",function(){
                event.trigger(event.TIMELINE_SET_FORWARD30SEC);
            });

            $(".player-button.fullscreen").unbind().bind("click", function(){
				event.trigger(event.PLAYER_TOGGLE_FULLSCREEN);
			});

            $(".volume.player-button .player-button").unbind().bind("click", function(e){
                var parent = $(this).parent();
                if(parent.hasClass("is-muted")){
                    if(self.model.get("volume") != 0) parent.removeClass("is-muted");
                    self.setVolume(localStorage.prev_volume ? localStorage.prev_volume : 50);
                }else{
                    parent.addClass("is-muted");
                    self.setVolume(0);
                }

            });

            $("#volume-slider").slider({
                orientation: "vertical",
                range: "max",
                min: 0,
                max: 100,
                value: localStorage.volume*100,
                slide: function( event, ui ) {
                    if(ui.value == 0){
                        $(".volume.player-button").addClass("is-muted");
                    }else{
                        $(".volume.player-button").removeClass("is-muted");
                    }

                    var volume = ui.value/100;
                    self.setVolume(volume);
                    self.model.set({volume : volume});
                }
            });

			self.setVolume(localStorage.volume);

            //$("#my-player-container").draggable({
            //    drag: function(event ,ui){
            //        var zoom = self.model.get("zoom");
            //        var width = $(this).width();
            //        var height = $(this).height();
            //
            //        if(ui.position.left > width*(zoom-1)/2){
            //            ui.position.left = width*(zoom-1)/2;
            //        }else if(ui.position.left < width*(zoom-1)/(-2)){
            //            ui.position.left = width*(zoom-1)/(-2);
            //        }
            //
            //        if(ui.position.top > height*(zoom-1)/2){
            //            ui.position.top = height*(zoom-1)/2;
            //        }else if(ui.position.top < height*(zoom-1)/(-2)){
            //            ui.position.top = height*(zoom-1)/(-2);
            //        }
            //    }
            //});

            $(".power-button").unbind("click").bind("click", function(){
                if(SkyUI.isDemo()){SkyUI.showDialogDemo(); return; }
              
				self.model.set({"streaming_paused": false});
                // TODO: synchronize with code from "files/js/app/controllers/camera_settings_controller.js:~416" ".camera-power-button"
                // button: camera on/off in right-top
                var status = !$(this).hasClass("off");
                var camera = ctoggle.setValue(self.camera, "on", status);
                if(camera){
                    self.camera = camera;
                    // why not used status ?
                    if($(this).hasClass("off")){
                        $(this).removeClass("off");
                        $(this).addClass("on");

                        self.refreshCameraStatus({"status" : "active"});
                        if(self.model.get("live")){
							event.trigger(event.PLAYER_START_LIVE);
						}
                    }else{
                        $(this).addClass("off");
                        $(this).removeClass("on");

                        self.refreshCameraStatus({"status" : "inactive", "rec_status" : "off"});
                        if(self.model.get("live")){
							event.trigger(event.PLAYER_SET_PAUSE);
						}
                    }
                }
            });
        },
		isFullscreen: function(){
			return (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement);
		},
		onChangeFullscreen: function(){
			event.trigger(event.PLAYER_FULLSCREEN_UPDATE_CONTROLS);
		},
		exitFullscreen: function(){
			if(document.cancelFullScreen){
				document.cancelFullScreen();
			}else if(document.exitFullscreen){
				document.exitFullscreen();
			}else if(document.msExitFullscreen){
				document.msExitFullscreen();
			}else if(document.mozCancelFullScreen){
				document.mozCancelFullScreen();
			}else if(document.webkitExitFullScreen){
				document.webkitExitFullScreen();
			}else if(document.webkitExitFullscreen){
				document.webkitExitFullscreen();
			}
			document.removeEventListener('webkitfullscreenchange', this.onChangeFullscreen);
			document.removeEventListener('mozfullscreenchange', this.onChangeFullscreen);
			document.removeEventListener('fullscreenchange', this.onChangeFullscreen);
			document.removeEventListener('MSFullscreenChange', this.onChangeFullscreen);
		},
		requestFullscreen: function(){
			// var elem = document.getElementById("full-player-container");
			var elem = document.getElementById("fullscreen-container");
			if(elem.requestFullscreen){
				elem.requestFullscreen();
			}else if(elem.msRequestFullscreen){
				elem.msRequestFullscreen();
			}else if(elem.mozRequestFullScreen){
				elem.mozRequestFullScreen();
			}else if(elem.webkitRequestFullScreen){
				elem.webkitRequestFullScreen();
			}else if(elem.webkitRequestFullscreen){
				elem.webkitRequestFullscreen();
			}
			document.addEventListener('webkitfullscreenchange', this.onChangeFullscreen, false);
			document.addEventListener('mozfullscreenchange', this.onChangeFullscreen, false);
			document.addEventListener('fullscreenchange', this.onChangeFullscreen, false);
			document.addEventListener('MSFullscreenChange', this.onChangeFullscreen, false);
		},
		toggleFullscreenTimeout: undefined,
		updatedFullscreenButtonsState: "original",
		updateFullscreenButtons: function(hideButtons){
			if(this.isFullscreen()){
				if(hideButtons){
					if(this.updatedFullscreenButtonsState != "hide"){
						// console.log("[PLAYER] Fullscreen mode. Hide button");
						this.updatedFullscreenButtonsState = "hide";
						// $('.timeline-container').css("opacity", 0);
						// $('.goto-live').css("opacity", 0);
						// $('.datepicker-container').css("opacity", 0);
						$('.player-footer').css("opacity", 0);
						$('.group-right').css("opacity", 0);
						$('.left-panel').css("opacity", 0);
						$('.playback-play-pause').css("opacity", 0);
						$('.playback-back').css("opacity", 0);
						$('.playback-forward').css("opacity", 0);
						$('.playback-goto-live').css("opacity", 0);
						$('.microphone').css("opacity", 0);
						$('.video-scale-position').css("opacity", 0);
						document.body.style.cursor = 'none';
					}
				}else{
					if(this.updatedFullscreenButtonsState != "show"){
						// console.log("[PLAYER] Fullscreen mode. Show buttons");
						this.updatedFullscreenButtonsState = "show";
						$('.player-footer').css("opacity", 1);
						$('.group-right').css("opacity", 1);
						$('.left-panel').css("opacity", 1);
						$('.playback-play-pause').css("opacity", 1);
						$('.playback-back').css("opacity", 1);
						$('.playback-forward').css("opacity", 1);
						$('.playback-goto-live').css("opacity", 1);
						$('.microphone').css("opacity", 1);
						$('.video-scale-position').css("opacity", 1);
						document.body.style.cursor = 'default';
					}
				}
			} else {
				if(this.updatedFullscreenButtonsState != "original"){
					// console.log("[PLAYER] Fullscreen mode. canceled.");
					this.updatedFullscreenButtonsState = "original";
					$('.player-footer').css("opacity", "");
					$('.group-right').css("opacity", "");
					$('.left-panel').css("opacity", "");
					$('.playback-play-pause').css("opacity", "");
					$('.playback-back').css("opacity", "");
					$('.playback-forward').css("opacity", "");
					$('.playback-goto-live').css("opacity", "");
					$('.microphone').css("opacity", "");
					$('.video-scale-position').css("opacity", "");
					document.body.style.cursor = 'default';
				}
			}
		},
		hideFullscreenButtons: function(){
			event.trigger(event.PLAYER_FULLSCREEN_HIDE_CONTROLS);
		},
        toggleFullscreen: function(){
			var self = this;
			// console.log("[PLAYER] toggleFullscreen");
		
			clearTimeout(self.toggleFullscreenTimeout);
			$('#fullscreen-container').unbind('mousemove');
			document.body.style.cursor = 'default';

            if(self.isFullscreen()){
                self.exitFullscreen();
                self.updateFullscreenButtons(false);
            }else{
				self.requestFullscreen();
                self.updateFullscreenButtons(false);
				clearTimeout(self.toggleFullscreenTimeout);
				self.toggleFullscreenTimeout = setTimeout(self.hideFullscreenButtons, 5000); // after 5 sec hide buttons
				var x,y; // for chrome
				$('#fullscreen-container').unbind('mousemove').bind('mousemove', function(event){
					if(event.clientX == x && event.clientY == y){
						return;
					};
					x = event.clientX;
					y = event.clientY;
					clearTimeout(self.toggleFullscreenTimeout);
					self.toggleFullscreenTimeout = setTimeout(self.hideFullscreenButtons, 5000); // after 5 sec hide buttons
					self.updateFullscreenButtons(false);
				});
            }
        },
        setZoom: function(zoom, left, top){
			var self = this;
			if(zoom == undefined || zoom == null){
				zoom = 1;
				left = '';
				top = '';
			}
			if(zoom <= 1) zoom = 1;
			if(zoom >= 2.6) zoom = 2.6;
				
			try{ $(self.model.get("livePlayer").el()).css({'transform' : 'scale('+ zoom +')', 'left': left, 'top': top}); }catch(e){ console.error(e); }
			try{ $(self.getCurrentPlayer().el()).css({'transform' : 'scale('+ zoom +')', 'left': left, 'top': top}); }catch(e){ console.error(e); }
			try{ $(self.getBackgroundPlayer().el()).css({'transform' : 'scale('+ zoom +')', 'left': left, 'top': top}); }catch(e){ console.error(e); }

			if(left == '' && top == ''){
				var whcur = (100/zoom) + "%";
				var tlcur = (100 - (100/zoom))/2 + "%";
				$('.video-scale-position-cursor').css({'width': whcur, 'height': whcur, 'top': tlcur, 'left': tlcur});
			}

			localStorage.setItem('zoom', zoom);
			localStorage.setItem('zoom_left', left);
			localStorage.setItem('zoom_top', top);
			if(zoom > 1 && zoom < 2.6){
				$(".video-scale-position").addClass('video-scale-position-on');
				$(".player-button.zoom-in").prop("disabled", false);
				$(".player-button.zoom-out").prop("disabled", false);
				$(".player-button.reset-zoom").prop("disabled", false);
			}else if(zoom <= 1){
				$(".video-scale-position").removeClass('video-scale-position-on');
				$(".player-button.zoom-in").prop("disabled", false);
				$(".player-button.zoom-out").prop("disabled", true);
				$(".player-button.reset-zoom").prop("disabled", true);
				
			}else if(zoom >= 2.6){
				$(".video-scale-position").addClass('video-scale-position-on');
				$(".player-button.zoom-in").prop("disabled", true);
				$(".player-button.zoom-out").prop("disabled", false);
				$(".player-button.reset-zoom").prop("disabled", false);
			}
		},
        bindZoomButtons: function(){
			var self = this;

			var left_x = undefined;
			var top_y = undefined;

			var vs_w = parseInt($('.video-scale-position').css('width'),10); // pixels
			var vs_h = parseInt($('.video-scale-position').css('height'),10); // pixels
			var vsc_w = undefined; // pixels
			var vsc_h = undefined; // pixels

			var cursor_down = false;
			$('.video-scale-position-cursor').unbind().bind('mousedown', function(e){
				left_x = e.pageX;
				left_y = e.pageY;
				vsc_w = parseInt($('.video-scale-position-cursor').css('width'),10); // pixels
				vsc_h = parseInt($('.video-scale-position-cursor').css('height'),10); // pixels
				cursor_down = true;
			});

			$('.video-scale-position').unbind().bind('mouseup', function(e){
				cursor_down = false;
			}).bind('mouseleave', function(){
				cursor_down = false;
			}).bind('mousemove',function(e){
				if(cursor_down){
					var left_x_diff = left_x - e.pageX;
					var left_y_diff = left_y - e.pageY;
					left_x = e.pageX;
					left_y = e.pageY;

					var newx = parseInt($('.video-scale-position-cursor').css('left'),10) - left_x_diff;
					var newy = parseInt($('.video-scale-position-cursor').css('top'),10) - left_y_diff;
					
					if(newx < 0) newx = 0;
					if(newy < 0) newy = 0;
					if(newx >= (vs_w - vsc_w)) newx = vs_w - vsc_w - 1;
					if(newy >= (vs_h - vsc_h)) newy = vs_h - vsc_h - 1;
					$('.video-scale-position-cursor').css({'left': newx});
					$('.video-scale-position-cursor').css({'top': newy});

					var zoom = $("#zoom-slider").slider( "value" )/100;
					var zoom1 = zoom-1;
					var left = Math.floor(-100*((newx/(vs_w - vsc_w))*zoom1 - (zoom1/2)));
					var top = Math.floor(-100*((newy/(vs_h - vsc_h))*zoom1 - (zoom1/2)));
					self.setZoom(zoom, left + '%', top + '%');
				}
			});
			var updatePreviewVideoScalePosition = function(){
				if(self.model.get("live")){
					var el = document.getElementById('live-container_Flash_api');
					if(!el) return;
					$('.video-scale-position-cursor-background-image-loader').attr("src", 'data:image/png;base64,' + el.vjs_takeScreenshot())
					$('.video-scale-position-cursor-background-image-loader').unbind().load(function(){
						var v_w = $('.video-scale-position-cursor-background-image-loader').width();
						var v_h = $('.video-scale-position-cursor-background-image-loader').height();
						var w = $('#video-scale-position-canvas').width() + 2;
						var h = $('#video-scale-position-canvas').height() + 2;
						var k = (h/v_h);
						var new_w = Math.floor(v_w*k);
						var new_h = Math.floor(v_h*k);
						var left = Math.floor((w - new_w)/2);
						var top = 0;
						if (left < 0){
							// todo scale by width
						}
						var c = $('#video-scale-position-canvas')[0].getContext('2d');
						c.width = w;
						c.height = h;
						c.drawImage(this,left,top,new_w,new_h);
					});
				}else{
					// console.log("[PLAYER] make image from player");
					var mPlayer = self.getCurrentPlayer();
					if(!mPlayer) return
					if(!mPlayer.el()) return;
					var v = document.getElementById($('#' + mPlayer.el().id + ' video')[0].id);
					var v_w = mPlayer.videoWidth();
					var v_h = mPlayer.videoHeight();
					var w = $('#video-scale-position-canvas').width() + 2;
					var h = $('#video-scale-position-canvas').height() + 2;
					var k = (h/v_h);
					var new_w = Math.floor(v_w*k);
					var new_h = Math.floor(v_h*k);
					var left = Math.floor((w - new_w)/2);
					var top = 0;
					if (left < 0){
						// todo scale by width
					}
					var c = $('#video-scale-position-canvas')[0].getContext('2d');
					c.width = w;
					c.height = h;
					c.drawImage(v,left,top,new_w,new_h);
				}
			};

			clearInterval(self.updatePreviewVideoScalePositionInterval);
			self.updatePreviewVideoScalePositionInterval = setInterval(function(){
				if($('.video-scale-position').css('opacity') == "1" && $('.video-scale-position').css('display') == 'block')
					updatePreviewVideoScalePosition();
			}, 3000);

            $(".player-button.zoom-in").unbind().bind("click",function(){
                var slider = $("#zoom-slider");
                var sl_value = slider.slider( "value" );
                slider.slider( "value",  (sl_value + 20) > 260 ? 260 : sl_value + 20);
                var zoom = slider.slider( "value" )/100;
                self.model.set({zoom : zoom});
				self.setZoom(zoom, '', '');
				updatePreviewVideoScalePosition();
            });

            $(".player-button.zoom-out").unbind().bind("click",function(){
                var slider = $("#zoom-slider");
                var sl_value = slider.slider( "value" );
                slider.slider( "value",  (sl_value - 20) < 100 ? 100 : sl_value - 20);
                var zoom = slider.slider( "value" )/100;
                self.model.set({zoom : zoom});
                self.setZoom(zoom, '', '');
            });
            
            $(".player-button.reset-zoom").unbind().bind("click",function(){
				var slider = $("#zoom-slider");
				slider.slider( "value",  100);
				zoom = 1;
                self.model.set({zoom : 1});
                self.setZoom(zoom, '', '');
            });

            var throttled = underscore.throttle(function(event, ui){
                var zoom = ui.value/100;
                self.model.set({zoom : zoom});
                self.setZoom(zoom, '', '');
            }, 150);

			// var slider_val = $( "#zoom-slider" ).slider("value");
			try{$("#zoom-slider").slider('destroy');}catch(e){}
			$("#zoom-slider").slider({
				orientation: "vertical",
				range: "max",
				min: 100,
				max: 260,
				value: 100,
				value: localStorage.zoom*100,
				slide: throttled
			});
        },

        disposeVideo: function(){
            this.stopListening();
            if(!this.model){
                return;
            }

			this.stopWatchDocUserActivity();
            clearInterval(self.updatePreviewVideoScalePositionInterval);

			if($('#camera-settings-modal').length > 0){
				try{$('#camera-settings-modal').arcticmodal('close');}catch(e){}
			}
			
            this.stopDeactivateBackwardAfter();
            SkyVR.cameraBackwardStop();
            // console.log("Player - dispose");
            clearInterval(self.user_inactive_countdown);
            this.setZoom(localStorage.zoom, '', '');

            if(this.model.has("reconnectCheck")){
                clearInterval(this.model.get("reconnectCheck"));
            }

            if(this.model.has("statusCheck")){
                clearInterval(this.model.get("statusCheck"));
            }

			this.stopWatchDog();
			this.disposePlayer('live-container', 'livePlayer');
            this.disposePlayer('record-container1', 'firstRecordPlayer');
            this.disposePlayer('record-container1', 'secondRecordPlayer');
        }
    });

    return obj;
});
