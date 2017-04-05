//comment for push rev 1.5
define("event", ["underscore", "backbone",'marionette'], function (e, t) {
    var r = [
			"SHOW_PAGE_CAMERA",
			"SHOW_PAGE_CLIPS",
            "NETWORK_DISCONNECT",
            "NETWORK_RECONNECT",
            "POPUP_CLOSE",
            "POPUP_CLOSE_FINISHED",
            "REGION_CLOSE_DECK",
            "REGION_SHOW_IN_DECK",
            "REGION_SHOW_IN_HEADER",
            "REQUEST_URL",
            "CHECK_CAMERA_FIRMWARE",
            "BUCKET_DISPOSE",
            "CAMERA_SELECTED",
            "PLAYER_DATA_LOAD",
            "PLAYER_SET_PLAY",
            "PLAYER_SET_PAUSE",
            "PLAYER_TOGGLE_MICROPHONE",
            "PLAYER_LIVE_CHECK_SIZE",
            // "PLAYER_SET_URLS",
            "TIMELINE_SET_BACK30SEC",
            "TIMELINE_SET_FORWARD30SEC",
            "TIMELINE_SEARCH_CURSOR",
            "TIMELINE_REINIT_START_RECORD",
            "TIMELINE_CLEANUP",
            "TIMELINE_UPDATE",
            "TIMELINE_PORTION_DATA_LOADED",
            "TIMELINE_PORTION_DATA_LOADING",
            "TIMELINE_LOADING",
            "TIMELINE_LOADED",
            "UNAUTHORIZED_REQUEST",
            "UPDATE_USER_NAME",
            "PLAYER_DATA_ENDED",
            "PLAYER_PLAY", // check this event
            "PLAYER_PAUSE",
            "PLAYER_TOGGLE_FULLSCREEN",
            "PLAYER_FULLSCREEN_HIDE_CONTROLS",
            "PLAYER_FULLSCREEN_UPDATE_CONTROLS",
            "TOGGLE_STREAMING",
            "GET_CAMERA",
            "PLAYER_START_LIVE",
            "PLAYER_START_RECORD",
            "PLAYER_TIME_CHANGED",
            "PLAYER_FORCE_REINIT",
            "CALENDAR_DATE_CHANGED",
            "CALENDAR_UPDATE",
            "CALENDAR_CLEANUP",
            "RECORD_ENDED",
			"MD_FILTERS_CHANGE",
			"MDZONES_CHECK_VIDEOSIZE",
            "RECORD_ADDED"
		];
        s = t.Wreqr.EventAggregator.extend({
            on: function (e) {
                ("number" != typeof e || e >= r.length) && i.warn("Use of non-constant vent key: " + e);
                t.Wreqr.EventAggregator.prototype.on.apply(this, arguments)
            },
            trigger: function () {
				var e = arguments[0];
                ("number" != typeof e || e >= r.length) && i.warn("Use of non-constant vent key: " + e);
                t.Wreqr.EventAggregator.prototype.trigger.apply(this, arguments)
            }
        });
    s.prototype.bind = s.prototype.on;
    var a = new s;
    e.each(r, function (e, t) {
        a[e] = t
    });
    return a
});

define('application',['config','jquery','backbone','underscore','polyglot','marionette','timeline','player','event', 'jquery.cookie', 'jquery-ui'], function(conf,$,bb,_,pg,marionette,timeline,player,event){
    var application = new marionette.Application;
    application.addRegions({
        headerRegion: "#header",
        deckRegion: "#deck"
    });
    bb.history.start({pushState: true});
		CloudUI.event = event;
    
	if(CloudAPI.containsPageParam("svcp_host")){
		conf.base_api_url = CloudAPI.pageParams["svcp_host"];
	}else if(!CloudAPI.store.svcp_host()){
		conf.base_api_url = window.location.protocol + "//" + window.location.host.toString() + "/";
	}else{
		conf.base_api_url = CloudAPI.store.svcp_host();
	}
	console.log("URL: " + conf.base_api_url);
    
	CloudAPI.setURL(conf.base_api_url);

	application.JSONparse = function (json_str){
			return $.parseJSON(json_str.replace(/\'/g,"\""))
		};

	console.log('vendor: ' + CloudAPI.config.vendor);
	application.polyglot = new pg({ phrases: {} });

	polyglot_data = $.ajax({
		url: './vendor/' + CloudAPI.config.vendor + '/lang/' + CloudAPI.lang() + '.json',
		dataType: 'json',
		async: false,
		success: function(data) {
			
		}
	}).always(function(data) {
		if(data.status == 200){
			var json;
			try{ json = application.JSONparse(data.responseText); }catch(e){}
			if(json)
				application.polyglot = new pg({ phrases: json });
		}else if(!data.status){
			json = data;
			application.polyglot = new pg({ phrases: json });
		}
	});

	_.extend(application, bb.Events);
	application.deckRegion = {
		show:function(e){
		},
		close:function(){

		}
	}
	application.headerRegion = {
		show:function(e){
		}
	}
	application.cleanupHeader = function () {
		var self = this;
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			beforeSend: function() {},
			headers: {}
		});
	};      
	application.on('closedeck', function () {
		try{
            player.disposeVideo();
        }catch(e) {
            console.error(e);
        }
        
		if(CloudAPI.isCameraID() && !AudioStreaming.isDeactivated()){
			console.log("[APP] AudioStreaming.deactivate");
			AudioStreaming.deactivate();
			CloudAPI.cameraBackwardStop();
			
			if(CloudAPI.store.prev_volume()){
				CloudAPI.store.volume(CloudAPI.store.prev_volume());
			}
		}

        CloudAPI.setCameraID(undefined);
        this.timeline && this.timeline.dispose();
		if(application.apiToken){
			window['currentPage'] = 'camlist';
			CloudCameraList.initialize($('#camlist-container'));
		}
        //this.player && this.player.disposeVideo();
        $('#home-container').removeClass('card-open');
	    $('.cards .card').addClass('closed')
    });
    
    application.on('showheader', function (e) {
        application.headerRegion.show(e)
    });
    application.on('camera_selected',function(e){console.log('process camera')});
	application.on('md_filter_init', function(e){
		var self = this;
			
		event.trigger(event.GET_CAMERA,function(cam){
			self.camera = cam;
		});

		var md_zones = {motion_detection: []};
		$.ajax({
				url : CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/motion_detection/regions/",
				type : "get",
				async: false,
				success : function(data){
					md_zonesEnabled = false;
				
					if(!data['objects']){
						md_zones.motion_detection.regions = [];
					}else{
						md_zones.motion_detection.regions = data['objects'];
					}

					regions = [];
					if(!localStorage.getItem("md_filter_" + self.camera['id'])){
						var md_filter = {motion: true, sound: true};
						for(var i=0;i<md_zones.motion_detection.regions.length;i++){
							
							if(md_zones.motion_detection.regions[i].enabled){
								regions.push({count: i,state:true, color: conf.md_zones.global_conf.zone_colors[i]});
							}
							md_filter['regions'] = regions;
						}
						localStorage.setItem("md_filter_" + self.camera['id'], JSON.stringify(md_filter));
					}else{
						var md_filter = JSON.parse(localStorage.getItem("md_filter_" + self.camera['id']));
						for(var i=0;i<md_zones.motion_detection.regions.length;i++){
							
							if(md_zones.motion_detection.regions[i].enabled){
								state = true;
								for(var a=0;a<md_filter['regions'].length;a++){
									if(md_filter['regions'][a].count == i){
										state = md_filter['regions'][a].state;
										break;
									}
								}
								regions.push({count: i,state:state, color: conf.md_zones.global_conf.zone_colors[i]});
							}
						}
						md_filter['regions'] = regions;
						localStorage.setItem("md_filter_" + self.camera['id'], JSON.stringify(md_filter));
					}
					template = _.template($('#templates #md-filter-table').html());
					md_filter['md_zonesEnabled'] = md_zonesEnabled;
					$('.zone-menu-popover table').html(template({app: application, md_filter: md_filter}));
					$('.zone-menu-popover table td').click(function(){
						switch($(this).attr('filter_type')){
							case 'motion':
								if($(this).hasClass('active')){
									md_filter['motion'] = false;
								}else{
									md_filter['motion'] = true;
								}
								$(this).toggleClass('active');
								break;
							case 'sound':
								if($(this).hasClass('active')){
									md_filter['sound'] = false;
								}else{
									md_filter['sound'] = true;
								}
								$(this).toggleClass('active');
								break;
							case 'zone':
								n = parseInt($(this).attr('zone_number'));
								//i = 
								/*clicked_zone = md_filter['regions'].filter(function(el){ 
										return el.count == n;
									});*/
								if($(this).hasClass('active')){
									//clicked_zone.enabled = false;
									for(var a=0;a<md_filter['regions'].length;a++){
										if(md_filter['regions'][a].count == n)
											md_filter['regions'][a].state = false;
									}
								}else{
									//clicked_zone.enabled = true;
									for(var a=0;a<md_filter['regions'].length;a++){
										if(md_filter['regions'][a].count == n)
											md_filter['regions'][a].state = true;
									}
								}
								$(this).toggleClass('active');
								
								break;
						}
						localStorage.setItem("md_filter_" + self.camera['id'], JSON.stringify(md_filter));
						event.trigger(event.MD_FILTERS_CHANGE);
					});
				}});
	});

    application.on('player_hover', function (e){
        $('.player-container').toggleClass('player-container-hover-class');
    });

    application.on("start", function () {
		console.log("App: application started 2");
		if(window['currentPage'] != 'camlist'){
			CloudCameraList.initialize($('#camlist-container'));
			_.isUndefined(window.mozInnerScreenY) || $("html").addClass("ua-gecko");
			if (navigator && 0 === String(navigator.vendor).toLowerCase().indexOf("apple")) {
				var n = String(navigator.appVersion).match(/Version\/(\d+\.\d+)/);
				$("html").addClass("ua-safari");
				n && n[1] && parseInt(n[1], 10) < 6 && $("html").addClass("ua-safari-5")
			}
		}

        window.addEventListener && window.addEventListener("load", function () {
            navigator && !navigator.onLine && e(window).trigger("offline")
		});
        window.navigator && window.navigator.standalone && (document.ontouchmove = function (t) {
            for (var n = t.target; n;) {
                var i = e(n).css("overflow");
                if (("auto" === i || "scroll" === i) && (n.scrollHeight > n.offsetHeight || n.scrollWidth > n.offsetWidth)) return;
                n = n.parentNode
            }
            t.preventDefault()
        });
	
    });
    application.expiredToken = function (token) {
        var tk = {
            token:token['token'],
            expire:token['expire'],
            type:token['type']
        }
        tk.expireTimeUTC = Date.parse(tk.expire + "Z");
        return {
            token:tk,
            expireDateTime: 0,
            updateInterval:null,
            tryUpdateToken: function () {
                var self = this;
                if(self.expireCheck()) {
					CloudAPI.updateApiToken().done(function(res){
						self._updateToken(res)
					});
                }
            },
            expireCheck: function () {
                if(this.token == null){
                    return false;
                }
                var nowDate = new Date(),
                expireDate = new Date(this.token.expire +'Z');
                var expiredTime = new Date(expireDate.getTime() - Math.floor(36e5 / 2));
                var min = Math.floor((expiredTime.getTime() - nowDate.getTime()) / (60e3))
                console.log('Token expire time :'+expiredTime+" - " + min  + 'min');
                return min <= 5;
            },
            setTokenHeader: function () {
                var self = this;
                $.ajaxSetup({
                    crossDomain: true,
                    cache: false,
                    beforeSend: function(xhr,settings) {
                        if(self.token && self.token.token) {
                            //if(settings.url.match(application.cam.external_ip) == null) {
                                xhr.setRequestHeader('Authorization', 'SkyVR ' + self.token.token);
                            //}
                        }
                    }
                });
            },
            _updateToken: function (token) {
                var tk = {
                    token:token['token'],
                    expire:token['expire'],
                    type:token['type']
                };
                // console.log("Updated token: " + tk.token + "; Expire: " + tk.expire);
                this.token = tk;
                this.token.expireTimeUTC = Date.parse(this.token.expire + "Z");
                this.setTokenHeader();
                this.addUpdateInterval();
                CloudAPI.setToStorage("SkyVR_apiToken", JSON.stringify(this.token));
            },
            addUpdateInterval: function () {
                var self = this;
                clearInterval(this.updateInterval);
                this.updateInterval = setInterval(function(){self.tryUpdateToken()},5*60*1e3);
            },
            destroy:function(){
				console.log('token destroyed');
                clearInterval(this.updateInterval);
                localStorage.removeItem('token');
                this.token = null;
            }
        }
    };
    var loadTokenFromStorage = function(){
		console.log('token load: ', localStorage.token)
		if(!localStorage.token){
			console.log('token not found in storage')
			return false;
		}
		var data = JSON.parse(localStorage.token);
		if(Date.parse(data['expire'] + "Z") < Date.now()){
			console.log('token expired ', localStorage.token)
			return false;
		}
		application.apiToken = application.expiredToken(data);
		application.apiToken.setTokenHeader();
		application.apiToken.addUpdateInterval();
		bb.token = application.apiToken;
		console.log('token loaded')
		return true;
	}
	application.loadTokenFromCookie = function(){
		var token = CloudAPI.getFromCookie('token');
		if(token == ''){
			console.log('token not found in cookie')
			return false;
		}

		var data = {
			token: token,
			expire: '2016-02-26 18:40:52',
			type: "api"
		};

		application.apiToken = application.expiredToken(data);
		application.apiToken.setTokenHeader();
		application.apiToken.addUpdateInterval();
		bb.token = application.apiToken;
		console.log('token loaded: ' + token)
		return true;
	};

	application.logout = function(){
		CloudCameraList.dispose();
		if(localStorage['user_profile']){
			console.log("user_profile");
			localStorage.removeItem('anonToken');
			localStorage.removeItem('SkyVR_anonToken');
			localStorage.removeItem('apiToken');
			CloudAPI.removeFromStorage('SkyVR_apiToken');
			var path = window.location.pathname.split("/");
			path.pop();
			path.pop();
			var new_location = window.location.protocol+"//"+window.location.host+path.join("/")+"/";
			if(CloudUI.isDemo()){
				new_location += "?demo_logout";
			}
			window.location = new_location;
		}else{
			console.error("user_profile not found");
		}

		if(window['ApplicationMobileInterface']){
			ApplicationMobileInterface.logout();
		}
	}

	application.on('ShowMainPage', function(){
		window['currentPage'] = 'camlist';
		var resize_username = function(){
			console.log("resize_username");
			// $('.cloud-user-name').
			var logout_width = $('#logout').width();
			console.log("logout_width: " + logout_width);
			var username_width = $('.cloud-user-name').width();
			var window_width = $(window).width();
			$('.cloud-user-name').css({
				'max-width' : (window_width - logout_width - 35) + 'px'
			});
		}
		$(window).resize(resize_username);

		var cnt = $(CloudUI.mainPageHtml());
		cnt.find('#logout').click(application.logout);

        CloudCameraList.initialize(cnt.find('#camlist-container'));
		cnt.find('.cloud-user-name').text(CloudAPI.config.user_name);
		cnt.find('.cloud-user-name').unbind();
		CloudMainPage.initPanelButtons(cnt);
		
		if(window['ApplicationMobileInterface']){
			cnt.find('.cloud-user-name').bind('click', function(){
				ApplicationMobileInterface.showUserProfile();
			});
		}
		
		if(window['ApplicationMobileInterface']){
			cnt.find('#logout').unbind().bind('click', function(){
				ApplicationMobileInterface.logout();
			});
			cnt.find('#logout').css({'width': '110px'});
		}else{
			// cnt.find('#logout').text(application.polyglot.t('Account Setting'));
			// cnt.find('#logout').css({'width': '190px'});
			cnt.find('#logout').unbind().bind('click', function(){
				console.log("logout");
				application.logout();
			});
		}
        $('.content').html(cnt);
		resize_username();
		CloudUI.bindMenuButtons();

		CloudAPI.accountInfo().done(function(accData){
			var user_profile = accData['urls']['profile'];
			var username = accData['username'];
			CloudAPI.store.user_profile(user_profile);
			console.log('User_profile: ', user_profile);
		}).fail(function(r){
			console.error(r);
		});
		event.trigger(event.UPDATE_USER_NAME);
		
		if(window['ApplicationMobileInterface']){
			try{window['ApplicationMobileInterface'].webAppStarted();}catch(e){};
		}
	});
    // application.start = $.bind(application.start, application);
	// var login_template = _.template($('#templates #login-template').html());
	//$('.content').html(main_content_template({app: application}));
	// $('.content').html(login_template({app: application}));

	application.renderDialogButtons = function(buttons){
		var result = "";
		if(buttons){
			for(var i = 0; i < buttons.length; i++){
				var btn = buttons[i];
				var btn_html = '<div class="menu_btn' + (btn.close && btn.close == true ? ' arcticmodal-close' : '') + '" style="margin-left: 15px;" '
				+ (btn.id ? ' id="' + btn.id + '"' : '') + '>' + btn.text + '</div>';
				result += btn_html;
			};
		}
		return result;
	}

	application.createDialogModal = function(dlg){
		// $('#skyvr-dialog-modal .settings-popup.camera-settings-popup').height(dlg.height ? dlg.height : "100px");
		$('#skyvr-dialog-modal-header').text(dlg.title);
		$('#skyvr-dialog-modal-content').html(dlg.content);
		$('#skyvr-dialog-modal-buttons').html(this.renderDialogButtons(dlg.buttons));
		$('#skyvr-dialog-modal').arcticmodal({
			"beforeClose": dlg.beforeClose ? dlg.beforeClose : function(){}
		});
		if(dlg.class){
			$('#skyvr-dialog-modal').addClass('addcameradialog');
		}
	};

	application.showDialogModal = function(){
		$('#skyvr-dialog-modal').show();
	};

	application.hideDialogModal = function(){
		if($('#skyvr-dialog-modal').length > 0){
			try{$('#skyvr-dialog-modal').hide();}catch(e){};
		};
	}

	application.destroyDialogModal = function(){
		if($('#skyvr-dialog-modal').length > 0){
			try{
				$('#skyvr-dialog-modal-content').html('');
				$('#skyvr-dialog-modal').arcticmodal('close');
			}catch(e){}
		};
	};

	// special dialog wait loop will be close only on call function app.closeDialogModalProcessing()
	application.showProcessing = function(title, text){
		$('#skyvr-dialog-modal-processing-header').text(title);
		$('#skyvr-dialog-modal-processing-text').html(text);
		var throbber = $('<div class="throbber-wrapper" style="padding: 20px;"><span class="spinner gray" style="transition: transform 0ms;"></div>');
		throbber.find('.spinner').css('margin-left',this.winWidth /2 - throbber.find('.spinner').width() /2);
		$('#skyvr-dialog-modal-processing-icon').html(throbber);
		$('#skyvr-dialog-modal-processing').arcticmodal({
			closeOnEsc: false,
			closeOnOverlayClick: false
		});
	};

	application.closeProcessing = function(){
		try{$('#skyvr-dialog-modal-processing').arcticmodal('close');}catch(e){}
	};

	application.showError = function(title, text, afterClose){
		var error_template = _.template($('#templates #skyvr-dialog-modal-error').html());
		var cnt = $(error_template({app: application}));
        cnt.find('.header p').text(title);
        cnt.find('.error-text').html(text);
		$.arcticmodal({
			content: cnt,
			afterClose: afterClose ? afterClose : function(){}
		});
	};

	application.showInfo = function(title, text, afterClose){
		var error_template = _.template($('#templates #skyvr-dialog-modal-information').html());
		var cnt = $(error_template({app: application}));
        cnt.find('.header p').text(title);
        cnt.find('.error-text').html(text);
		$.arcticmodal({
			content: cnt,
			afterClose: afterClose ? afterClose : function(){}
		});
	};

    return application;
});
define("globalize", function (e) {
    return function () {
        var t;
        return t || e.Globalize
    }
}(this));

define('app',['config','backbone','underscore','application','marionette','event',
		'../app/controllers/md_zones_controller',
		'../app/controllers/camera_settings_controller',
		'timeline','player'
	], function(conf,bb,_,app,marionette,event, mdzc, camera_settings_controller,timeline,player){ // 
	var application =  app || new marionette.Application;
	console.log('app start!!!!!!!!!!!');

    application.listenTo(event, event.REGION_CLOSE_DECK, function () {
        application.deckRegion.close()
    });
    application.listenTo(event, event.REGION_SHOW_IN_HEADER, function (e) {
        application.headerRegion.show(e)
    });
    application.listenTo(event, event.REGION_SHOW_IN_DECK, function (e) {
        application.deckRegion.show(e)
    });
    application.listenTo(event, event.REGION_CLOSE_DECK, function () {
        application.deckRegion.close()
    });
    application.listenTo(event, event.UPDATE_USER_NAME, function () {
		CloudAPI.accountInfo().done(function(data){
			var user_name = data.email;
			if(data.contact_info){
				if(data.contact_info.first_name != '' || data.contact_info.last_name != ''){
					user_name = data.contact_info.first_name;
					if(user_name != '') user_name += ' ';
						user_name += data.contact_info.last_name;
				}
			}else{
				var first_name = ('' + data.first_name).trim();
				var last_name = ('' + data.last_name).trim();
				if(first_name != '' || last_name != ''){
					user_name = first_name;
					if(user_name != '') user_name += ' ';
					user_name += last_name;
				}
			}
			if(CloudAPI.config.user_name != user_name)
				CloudAPI.config.user_name = user_name; // cache

			if($('.cloud-user-name').text() != user_name){
				$('.cloud-user-name').text(user_name)
			}
		}).fail(function(r){
			console.error(r);
		});
    });

    application.listenTo(event, event.TOGGLE_STREAMING, function () {
		console.log("[APP] TOGGLE STREAMING event");
		// refresh p2p cache?
	});
    application.listenTo(event, event.CHECK_CAMERA_FIRMWARE, function () {
		console.log("[CHECK_CAMERA_FIRMWARE] begin");
		if(!CloudAPI.hasAccessSettings(application.cam)){
			console.error("CHECK_CAMERA_FIRMWARE: deny (has not enough permissions)");
			return;
		}
		
		CloudAPI.cameraFirmwares().done(function(firmwares){
			var latest_version = application.cam.fw_version;
			var max_released = 0;
			if(firmwares.length > 0){
				for(var i = 0; i < firmwares.length; i++){
					var released = Date.parse(firmwares[i].released + "Z");
					if(released > max_released){
						latest_version = firmwares[i].version;
						max_released = released;
					}
				}
			}
			
			if(application.cam.fw_version == undefined){
				console.error("fw_version is undefined");
			}
			
			if(latest_version
			&& latest_version != ""
			&& application.cam.status != "offline"
			&& application.cam.status != "unauthorized"
			&& latest_version != application.cam.fw_version){
				window['currentPage'] = 'upgrade-firmware';
				$('#camera-firmware-upgrade-modal').arcticmodal({
					"beforeClose": function(){
						window['currentPage'] = 'player';
						// clearInterval(application.updateSettingsInfoInterval);
					}
				});
				$('.camera-settings-popup .header p').text(application.polyglot.t('head_firmware_upgrade'));
				$('#camera-firmware-upgrade-modal-content').empty();
				$('#camera-firmware-upgrade-modal-content').append("<p>" + application.polyglot.t('current_firmware') + application.cam.fw_version + "</p>");
				$('#camera-firmware-upgrade-modal-content').append("<p>" + application.polyglot.t('available_new_firmware') + latest_version + "</p>");
				$('#camera-firmware-upgrade-modal-content').append("<p>" + application.polyglot.t('notice_upgrade_firmware') + "</p>");
				$('#camera-firmware-upgrade-now').html(application.polyglot.t("upgrade_now"));
				$('#camera-firmware-upgrade-now').attr({"latest_version": latest_version });
				$('#camera-firmware-upgrade-later').html(application.polyglot.t("upgrade_later"));
			};
		}).fail(function(){
			console.error("[CHECK_CAMERA_FIRMWARE] Not found firmwares");
		});
    });

	application.listenTo(event, event.UNAUTHORIZED_REQUEST, function () {
		$('#unauthorized-modal').arcticmodal({
			"beforeClose": function(){
				var user_profile_store = CloudAPI.store.user_profile();
				if(user_profile_store != null && user_profile_store != undefined){
					window.location = CloudAPI.store.user_profile();
				}else{
					if(CloudAPI.containsPageParam("lang")){
						window.location = '?lang='+CloudAPI.pageParams['lang'];
					}else{
						window.location = '?';
					}
				}
			}
		});
		$('.camera-settings-popup .header p').text(application.polyglot.t('head_unathorized'));
		$('#unauthorized-modal-content').empty();
		$('#unauthorized-modal-content').append("<p>" + application.polyglot.t('unathorized_message') + "</p>");
		$('#unauthorized-modal-goto-sign').html(application.polyglot.t("unathorized_goto_login_page"));
    });

    application.listenTo(event, event.CAMERA_SELECTED, function (e) {
        console.log('show page camera');
        _.extend(bb,{currentCamera : e[0]});
        application.cam = e[0];
        
        CloudAPI.cameraInfo(application.cam.id).done(function(){
			console.log("application.cam: ", application.cam);
			CloudCameraList.dispose();
			event.trigger(event.SHOW_PAGE_CAMERA);
			event.trigger(event.CHECK_CAMERA_FIRMWARE);
		})
    });

	application.listenTo(event, event.SHOW_PAGE_CAMERA, function (cb) {
		window['currentPage'] = 'player';
		CloudCameraList.dispose();
		CloudUI.clips.stopUpdatingClipList();
		if($('.card-container').hasClass('closed-container')){
			$('.card-container').removeClass('closed-container');
			$('.clip-container').addClass('incoming-container');
		}else{
			camera_template = _.template($('#templates #camera').html());
			$('.card-container').html(camera_template({app:application}));
			if(cc.clip_maker_hint_show){
				$('.clip-menu-popover .popover-done .hint').show();
			}
			application.card.events();
			setTimeout(function(){
				$('.cards .card').removeClass('incoming');
				$('#home-container').addClass('card-open');
			},1);
		}
		$('.card-container').removeClass('livestreamnotfound');

		event.trigger(event.GET_CAMERA,function(cam){
			application.camera = cam;
			if(!CloudAPI.hasAccessSettings(cam)){
				$('.card-container').addClass("deny-settings");
			}else{
				$('.card-container').removeClass("deny-settings");
			}
			
			if(!CloudAPI.hasAccessClips(cam)){
				$('.card-container').addClass("deny-clips");
			}else{
				$('.card-container').removeClass("deny-clips");
			}
			
			if(!CloudAPI.hasAccessLive(cam)){
				$('.card-container').addClass("deny-live");
			}else{
				$('.card-container').removeClass("deny-live");
			}

			if(!CloudAPI.hasAccessPlayback(cam)){
				$('.card-container').addClass("deny-playback");
			}else{
				$('.card-container').removeClass("deny-playback");
			}

			if(!CloudAPI.hasAccessMakeClip(cam) || CloudAPI.isP2PStreaming()){
				$('.card-container').addClass("deny-makeclip");
			}else{
				$('.card-container').removeClass("deny-makeclip");
			}
		});

        try {
            application.player = player;
            application.player.initialize(application);
            application.player.bindEvents();
            event.trigger(event.PLAYER_START_LIVE);
        }catch(e){
            console.error(e);
        }
        this.timeline = timeline;
		event.trigger(event.GET_CAMERA,function(cam){
			application.camera = cam;
		});

		if(CloudAPI.cache.cameraInfo().hosted){
			$('.card.type-camera').addClass('camera-hosted');
		}else{
			$('.card.type-camera').removeClass('camera-hosted');
		}
		
		if(CloudUI.isPlayerSingleMode() || CloudUI.isDemo()){
			if(window['ApplicationMobileInterface']){
				$('.cards .type-camera.card .card-header .close-card-button').show();
				$('.cards .type-camera.card .card-header .close-card-button').unbind('click').bind('click', function(e){
					ApplicationMobileInterface.logout();
				});
			}else{
				if(localStorage.getItem("profile_url") == null){
					$('.cards .type-camera.card .card-header .close-card-button').hide();
				}else{
					if(isFramed){
						console.log("Opened in frame");
						$('.cards .type-camera.card .card-header .close-card-button').hide();
					}else{
						$('.cards .type-camera.card .card-header .close-card-button').unbind('click').bind('click', function(e){
							// call demo_logout if demo mode
							if(CloudUI.isDemo()){
								var path = window.location.pathname.split("/");
								path.pop();
								path.pop();
								window.location = window.location.protocol + "//" + window.location.host + path.join("/") + "/?demo_logout";
							}else{
								var path = window.location.pathname.split("/");
								path.pop();
								path.pop();
								window.location = window.location.protocol + "//" + window.location.host + path.join("/") + "/";
							}
						});
					}
				}
			}
		}else{
			$('.cards .type-camera.card .card-header .close-card-button').unbind('click').bind('click', function(e){
				application.trigger('closedeck');
			});
		}

		// TODO redesign on CloudAPI.cameraMotionDetection()
		regions = true;
		if(!CloudAPI.cache.cameraInfo().url && CloudAPI.hasAccessMotionDetection(CloudAPI.cameraID())){
			console.log("APP: load motion_detection");
			regions = true;
			$.ajax({
				url : CloudAPI.config.url_cameras + CloudAPI.cameraID() + "/motion_detection/",
				type : "get",
				async: false,
				success : function(data){
					if(data['caps'].max_regions == 0){
						regions = false
					}
				}
			});
		}else{
			regions = false
		}

        setTimeout(function(){
            application.timeline.initialize();
            application.timeline.renderTimeline();
			if(!regions)
				$('.button-zone-create').hide();
        },800);

		$('#timeline-search-cursor').unbind().bind('click', function(e){
			console.log('show context menu (now: found cursor)');
			e.preventDefault();
			event.trigger(event.TIMELINE_SEARCH_CURSOR);
			$('.timeline-contextmenu').hide();
		});
		
		$('#clip-start-point').unbind().bind('click', function(e){
			$('#clipmaker-start').val($(this).attr('time'));
			$('.timeline-contextmenu').hide();
			if(!$('.zone-menu-popover').hasClass('popover-open')){
				$('.clip-menu-popover').addClass('popover-open');
			}
		});
		
		$('#clip-end-point').unbind().bind('click', function(e){
			$('#clipmaker-stop').val($(this).attr('time'));
			$('.timeline-contextmenu').hide();
			if(!$('.zone-menu-popover').hasClass('popover-open')){
				$('.clip-menu-popover').addClass('popover-open');
			}
		});

		if(cc.timeline_menu_condition_of_cache){
			$('#timeline-condition-of-cache').unbind().bind('click',function(e){
				// alert('TODO: show');
				app.createDialogModal({
					'title' : app.polyglot.t('dialog_title_timeline_condition_of_cache'),
					'content' : '<canvas id="timeline-condition-of-cache-canvas" width="620px" height="600px"></canvas>',
					'buttons' : [
						{text: app.polyglot.t('Close'), close: true}
					],
					'beforeClose' : function() {
					}
				});
				app.showDialogModal();
				var minifier = app.timeline.timelineLoader.recordList.minifier(0, 2000000000000);
				var eventsMinifier0450sec = app.timeline.timelineLoader.eventList.minifier(450, 0, 2000000000000);
				var eventsMinifier0036sec = app.timeline.timelineLoader.eventList.minifier(36, 0, 2000000000000);
				var eventsMinifier0002sec = app.timeline.timelineLoader.eventList.minifier(2, 0, 2000000000000);

				if(minifier.length > 0){
					var start = minifier[0].startTime;
					var end = minifier[minifier.length-1].endTime;

					// draw to canvas
					var el = document.getElementById('timeline-condition-of-cache-canvas');
					var ctx = el.getContext("2d");
					var th = 35;
					
					ctx.fillStyle = "#131313";
					ctx.fillRect(0, 0, el.width, el.height);

					var y = (el.height - th)/2;
					ctx.fillStyle = "#3b3b3b";
					ctx.fillRect(0, y, el.width, th);

					var padding = 10;
					var len = end-start+1;
					var k = (el.width - padding*2)/len;
					var tw = 20;

					var texts = [];
					
					var recordslen = 0;
					var allTimeRecords = 0;
					var allSizeRecords = 0;
					for(var t in app.timeline.timelineLoader.recordList.buffer){
						var list = app.timeline.timelineLoader.recordList.buffer[t];
						recordslen += list.length;
						for(var i = 0; i < list.length; i++){
							allTimeRecords += list[i].endTime - list[i].startTime;
							allSizeRecords += list[i].size;
						}
					};

					texts.push("Records: " + recordslen)
					allTimeRecords = allTimeRecords/1000;
					texts.push("Summary time: " + allTimeRecords + " sec");
					var secs = Math.floor(allTimeRecords % 60);
					allTimeRecords = (allTimeRecords - secs)/60;
					var mins = Math.floor(allTimeRecords % 60);
					var hours = Math.floor((allTimeRecords - mins)/60);

					texts.push("Summary time: " + hours + "h " + mins + "m " + secs + "s");
					texts.push("Summary size: " + allSizeRecords + " bytes");
					
					var tp = ["Kb", "Mb", "Gb"];
					var tp_res = "b";
					for(var i = 0; i < 4; i++){
						var val = allSizeRecords / 1024;
						if(val < 1){
							break;
						}
						allSizeRecords = val;
						tp_res = tp[i];
					}
					texts.push("Summary size: " + allSizeRecords.toFixed(2) + " " + tp_res);

					var events = app.timeline.timelineLoader.getEventsFullList();
					texts.push("Groups of records (by hour): " + minifier.length)
					texts.push("Events: " + events.length)
					texts.push("Groups of events(by 450 sec): " + eventsMinifier0450sec.length)
					texts.push("Groups of events(by 36 sec): "  + eventsMinifier0036sec.length)
					texts.push("Groups of events(by 2 sec): "   + eventsMinifier0002sec.length)

					ctx.fillStyle = '#ffffff';
					ctx.font = '12pt Calibri';
					ctx.textBaseline = 'middle';
					ctx.textAlign = 'left';
					var dt = (len/2)/((y-2*padding)/tw);
					var startY = padding;
					for(var t = start; t <= start + len/2; t = t + dt){
						var startX = (t - start)*k + padding;
						ctx.beginPath();
						ctx.moveTo(startX, y + th);
						ctx.lineTo(startX, startY);
						ctx.lineTo(startX+5, startY);
						ctx.lineWidth = 1;
						ctx.strokeStyle = '#ffffff';
						ctx.stroke();
						ctx.fillText(CloudAPI.convertUTCTimeToSimpleStr(t + CloudAPI.getOffsetTimezone()), startX + padding, startY);
						startY = startY + tw;
					}

					ctx.textAlign = 'right';
					startY = el.height - padding;
					for(var t = end; t > start + len/2; t = t - dt){
						var startX = (t - start)*k + padding;
						ctx.beginPath();
						ctx.moveTo(startX, y);
						ctx.lineTo(startX, startY);
						ctx.lineTo(startX-5, startY);
						ctx.lineWidth = 1;
						ctx.strokeStyle = '#ffffff';
						ctx.stroke();
						ctx.fillText(CloudAPI.convertUTCTimeToSimpleStr(t + CloudAPI.getOffsetTimezone()), startX - padding, startY);
						startY = startY - tw;
					}

					ctx.fillStyle = "#00A3D9";
					for(var i = 0; i < minifier.length; i++){
						var p = minifier[i];
						var startX = (minifier[i].startTime - start)*k;
						var endX = (minifier[i].endTime+1 - start)*k;
						ctx.fillRect(Math.round(startX) + padding, y + th - 15, Math.ceil(endX-startX), 5);
					}

					// print texts
					ctx.fillStyle = '#ffffff';
					ctx.font = '12pt Calibri';
					ctx.textBaseline = 'middle';
					ctx.textAlign = 'right';
					for(var i = 0; i < texts.length; i++)
						ctx.fillText(texts[i], el.width - padding, padding + tw/2 + tw*i);
				}
			});
		}else{
			$('#timeline-condition-of-cache').hide();
		}

		$('.timeline-contextmenu').unbind().bind('contextmenu', function(){
			// nothing
		});

        // Trigger action when the contexmenu is about to be shown
        $('.timeline-container').unbind('contextmenu');
		$('.timeline-container').bind("contextmenu", function (e) {
			e.preventDefault();
			console.log("[DEBUG] show context menu");
			app.timeline.dismissThumbnail();

			$('.timeline-contextmenu').unbind('mouseleave');
			$('.timeline-contextmenu').show();
			var h = $('.timeline-contextmenu').height();
			$('.timeline-contextmenu').css({
				top: (e.pageY - h + 10) + "px",
				left: e.pageX - 10 + "px"
			});
			$('.timeline-contextmenu').unbind().bind('mouseleave', function(){
				console.log("[DEBUG] hide context menu");
				$('.timeline-contextmenu').hide();
			});

			var left = $('#sess-backgound').offset().left;
			var x = e.pageX - left;
			var a = app.timeline.timeScale.invert(x);
			a = app.timeline.correctTime(a.getTime());
			var convTime = ("00" + (a.getMonth()+1)).slice(-2) + "/" + ("00" + a.getDate()).slice(-2) + "/"
				+ a.getFullYear() + " "
				+ ("00" + a.getHours()).slice(-2) + ":"
				+ ("00" + a.getMinutes()).slice(-2) + ":"
				+ ("00" + a.getSeconds()).slice(-2);
			$('#clip-start-point').text(app.polyglot.t("timeline_contextmenu_set_clip_begin") + convTime);
			$('#clip-start-point').attr('time', convTime);
			$('#clip-end-point').text(app.polyglot.t("timeline_contextmenu_set_clip_end") + convTime);
			$('#clip-end-point').attr('time', convTime);
		});
	});
	application.listenTo(event, event.SHOW_PAGE_CLIPS, function (page_clips_params) {
		window['currentPage'] = 'clips';
		console.log("go to clips ", page_clips_params);

		try{
			if(application.player)
				application.player.disposeVideo();
		}catch(e){
			console.error(e);
		}

		if(CloudAPI.isCameraID() && !AudioStreaming.isDeactivated()){
			console.log("[APP] AudioStreaming.deactivate");
			AudioStreaming.deactivate();
			CloudAPI.cameraBackwardStop();
			if(CloudAPI.store.prev_volume()){
				CloudAPI.store.volume(CloudAPI.store.prev_volume());
			}
		}

		if(application.timeline)
			application.timeline.dispose();

		if(application.apiToken){
			/*CloudCameraList.initialize($('#camlist-container'));*/
		}
		//this.player && this.player.disposeVideo();

		SkyUI.showPageClips(app).done(function(){
			$('.clip-container .card-header a').unbind().click(function(){
				$('.skyvr-dialog-clipshow').hide();
				try{if(mPlayer) mPlayer.dispose();}catch(e){};
				event.trigger(event.SHOW_PAGE_CAMERA);
			});
			
			$('.card-container').addClass('closed-container');
			$('.clip-container').removeClass('incoming-container');
		});
	});
	
    application.listenTo(event, event.GET_CAMERA, function (cb) {
        cb(application.cam);
    });

	//application.listenTo(event, event.PLAYER_TIME_CHANGED, function (time) {
    //    console.log("PLAYER time change ", time);
    //});

	application.lightbox = {
		el: '#lightbox .lightbox-popup',
		state : [],
		show : function(section,pushstate){
			if(!pushstate){
				this.state.push(section);
			}
			console.log('show: ' + section);
			$('#lightbox').css('display','block').css('opacity',1);
			var main_content_template = _.template($("#templates #"+ section).html());
			$(this.el).css('display','block').html(main_content_template({app:application}));
			this.initEvents();
			return this;
		},

		back : function(){
			this.state.pop();
			if(this.state.length){
				this.show(this.state[this.state.length-1],0);
			} else {
				console.log('close');
				this.close();
			}
			return this;
		},
		close : function(){
			this.state = [];
			$('#lightbox').css('display','none').css('opacity',1);
			$(this.el).css('display','none');
			$(this.el).html('');
			return this;
		},
		initEvents : function(){
			var self = this;
			var close_btn = $('.lightbox-popup .close-button');
			var back_btn = $('.lightbox-popup .back-button');
			if(close_btn.length){
				close_btn.click(function(){self.close()});
			}
			if(back_btn.length) {
				back_btn.click(function(){self.back()});
			}
			$(this.el + " #settings li div").click(function(){
				console.log($(this).parent().attr('class'))
				self.runEventByClass($(this).parent().attr('class'), $(this));
			});
		},
		runEventByClass : function(classList,el){
			switch (classList){
				case 'disclosure':
					if($(el).data('target') != 'undefined') {
						var action = this.state[this.state.length - 1] + '-' + $(el).data('target');
						console.log(action);
						if($("#templates #"+action ).length > 0){
							this.show(action,0);
						}
					}
					break;
				case 'default':
					break;
			}
		}
	};
	application.menuOpened = 0;

	application.on('showcamera',function(){ // TODO REMOVE
		
	});

	application.card = {
		events:function(){
			/*$('.zoom-levels span').click(function(){
				$('.zoom-levels span').removeClass('active')
				$(this).addClass('active');
			})*/
			$('.card .card-settings-button').click(function(){
				camera_settings_controller.show();
			});

			$('.card .card-title .title').unbind().dblclick(function(){
				var logs = [];
				var logInterval = undefined;
				var lastLoggingTimeUpdate = '';
				function updateLog(){
					$('.skyvr-logging-status-update').text(app.polyglot.t('logging_updating'));
					CloudAPI.cameraLogUpdate();
					CloudAPI.cameraLog().fail(function(){
						$('.skyvr-logging-status-update').text(app.polyglot.t('logging_not_found'));
					}).done(function(result){
						if(lastLoggingTimeUpdate != result.time){
							CloudAPI.cameraLogDownload(result.url).fail(function(){
								$('.skyvr-logging-status-update').text(app.polyglot.t('logging_not_found'));
							}).done(function(text){
								$('.skyvr-logging-time').text("UTC: " + result.time);
								lastLoggingTimeUpdate = result.time;
								var new_logs = text.split("\n");
								if(new_logs.length > 0)
									$('.skyvr-logging').html('<div class="skyvr-logging-line">' + new_logs.join('</div><div class="skyvr-logging-line">') + '</div>');
								$('.skyvr-logging-status-update').text(app.polyglot.t('logging_updated'));
							});
						}else{
							$('.skyvr-logging-status-update').text(app.polyglot.t('logging_updated'));
						}
					});
				};
				logInterval = setInterval(updateLog,35000);
				// TODO Start poling
				application.createDialogModal({
					'title' : app.polyglot.t('dialog_title_logging'),
					'content' : '<div class="skyvr-logging-status-update"></div>'
						+ '<div class="skyvr-logging-time"></div>'
						+ '<div class="skyvr-logging" scrolling="auto">'
						+ '</div>'
						+ '<a style="display: none" id="download_logfile_link" href="" download="log.txt"></a>',
					'buttons' : [
						{text: app.polyglot.t('Download'), id: 'download_logfile', close: false},
						{text: app.polyglot.t('Close'), close: true},
					],
					'beforeClose':function(){
						// TODO remove poling
						clearInterval(logInterval);
					}
				});
				application.showDialogModal();
				updateLog();
				
				$('#download_logfile').unbind().bind('click', function(){
					CloudAPI.cameraLog().fail(function(){
						application.showError("Error", "Sorry but log file did not exists. Try later");
					}).done(function(result){
						$('#download_logfile_link').attr({'href': result.url});
						$('#download_logfile_link')[0].click();
					});
				});
			});
			$('.player-header .power').click(function(){
				if($(this).hasClass('on')){
					$(this).addClass('off');
					$(this).removeClass('on');
				} else {
					$(this).removeClass('off');
					$(this).addClass('on');
				}
			})
			$('.datepicker-container button.player-button, .datepicker-container  > div > span').click(function(e){
					$('.calendar-popover').addClass('popover-open');
			})
	
			$('.calendar .days strong').click(function(){
				$('.calendar .days strong').removeClass('active');
				$(this).addClass('active');
			});

			$('.calendar-popover .popover-overlay').unbind().bind('click', function(){
				$('.calendar-popover').removeClass('popover-open')
			})
			
			//zone regions
			$('.zone-menu-container button.player-button').click(function(e){
				application.trigger('md_filter_init');
				$('.zone-menu-popover').addClass('popover-open');
			})
	
			$('.zone-menu-container .popover-overlay').unbind().bind('click', function(){
				$('.zone-menu-popover').removeClass('popover-open')
			});
			
			$('.zone-menu-popover .popover-item').click(function(){});
			
			//tooltip clips
			$('#clipmaker-start-open-editor').unbind().bind('click', function(){
				clips_datetimepicker('clipmaker-start', 'clipmaker-start-datetimepicker');
			});
			
			$('#clipmaker-stop-open-editor').unbind().bind('click', function(){
				clips_datetimepicker('clipmaker-stop', 'clipmaker-stop-datetimepicker');
			});

			$('.clip-menu-container button.player-button').unbind().click(function(){
					if($('.card-container').hasClass('deny-makeclip')){
						event.trigger(event.SHOW_PAGE_CLIPS);
					}else{
						if($('.zone-menu-popover').hasClass('popover-open')){
							$('.zone-menu-popover').removeClass('popover-open');
							return false;
						}
						$('.clip-menu-popover').addClass('popover-open');
					}
			});

			if(!cc.clips || (cc.clips && cc.clips == false)){
				$('.clip-menu-container button.player-button').hide();
			}
			
			if(!cc.clips_tags){
				$('#clip_group_creation').hide();
			}

			$('.popover-overlay').unbind().click(function(){
				$('.clip-menu-popover').removeClass('popover-open');
				$('.calendar-popover').removeClass('popover-open');
				$('.zone-menu-popover').removeClass('popover-open');
			});
			
			if(CloudAPI.containsPageParam('mobile')){
				$('#full-player-container').unbind('click').bind('click', function(){
					if($('.card.type-camera').hasClass('mobile-fullscreen')){
						$('.card.type-camera').removeClass('mobile-fullscreen');
						app.timeline.resizeEventHandler();
						if(window['ApplicationMobileInterface'])
							ApplicationMobileInterface.switchFullscreenMode('no-fullscreen');
					}else{
						$('.card.type-camera').addClass('mobile-fullscreen');
						if(window['ApplicationMobileInterface'])
							ApplicationMobileInterface.switchFullscreenMode('fullscreen');
					}
				});
			}
		}
	}

	$("#camera-firmware-upgrade-now").unbind().click(function(){
		var latest_version = $("#camera-firmware-upgrade-now").attr('latest_version');
		CloudAPI.cameraFirmwaresUpgrade(latest_version).done(function(response){
			$.arcticmodal('close');
			console.error("[FIRMWARE_UPGRADE] ok");
		}).fail(function(){
			console.error("[FIRMWARE_UPGRADE] error");
			// $.arcticmodal('close');
		});
	});

	$(document).on('click','.button-zone-create',function(){
		mdzc.trigger('showEditMDZones');
	});

	console.log("Loaded page!");

	if(SkyVR.containsPageParam("mobile")){
		window['currentPage'] = "first";
		window['handlerBackButton'] = function(){
			if(window['currentPage'] == "first"){
				ApplicationMobileInterface.finish();
			}else if(window['currentPage'] == "camlist"){
				if(window['ApplicationMobileInterface']){
					ApplicationMobileInterface.logout();
				}
			}else if(window['currentPage'] == "settings"){
				if(CloudUI.isPlayerSingleMode())
					SkyUI.trigger('showfirstcameraplayer', app, event);
				else
					application.trigger('ShowMainPage');
			}else if(window['currentPage'] == 'upgrade-firmware'){
				$('#camera-firmware-upgrade-modal .camera-settings-popup .header .box-modal_close.arcticmodal-close').click();
			}else if(window['currentPage'] == "player"){
				application.trigger('closedeck');
			}else if(window['currentPage'] == 'cameraSettings'){
				$('.settings-popup.camera-settings-popup .header .box-modal_close.arcticmodal-close').click();
			}else if(window['currentPage'] == "clips"){
				$('.clip-container .card-header a').click();
			}else if(window['currentPage'] == "clip"){
				$('#skyvr-clipviewer-close').click();
			}
		}
		if(window['ApplicationMobileInterface']){
			ApplicationMobileInterface.setBackCallback('handlerBackButton');
		}
	}
	
	var path = window.location.pathname;
	if(path[path.length-1] == '/'){
		path += 'index.html';
	}
	var arr = path.split('/').filter(function(val){ return val != ""; });
	last_page = arr[arr.length - 1];
	if(last_page == 'shared_clips'){
		console.log("Show page clips");
		setTimeout(function(){
			$('.content').html('<div class="cards"><div class="clip-container"></div></div>');
			event.trigger(event.SHOW_PAGE_CLIPS, {onlyclips: true});
		},5000);
	}else{
		console.log("Try open main page");
		if(CloudAPI.config.apiToken.token){
			if(application.apiToken){
				application.apiToken.destroy();
			}
			application.loginToken = null;
			application.apiToken = application.expiredToken(CloudAPI.config.apiToken);
			CloudAPI.setToStorage("SkyVR_apiToken", JSON.stringify(CloudAPI.config.apiToken));
			application.apiToken.setTokenHeader();
			application.apiToken.addUpdateInterval();
			bb.token = application.apiToken;
			var camid = "";
			var params = {};
			if(CloudAPI.containsPageParam("camid")){
				params['camid'] = CloudAPI.pageParams['camid'];
			}
			CloudAPI.changeLocationState(params);
			setTimeout(function(){
				if(CloudUI.isPlayerSingleMode()){
					$('body').addClass('fc');
					CloudUI.trigger('showfirstcameraplayer', app, event);
				}else{
					application.trigger('ShowMainPage');
				}
			},3000);
			
			if(CloudAPI.containsPageParam('sharedclips')){
				CloudUI.trigger('showsharedclips', app, event);
			}
		}else{
			event.trigger(event.UNAUTHORIZED_REQUEST);
		}
	}
	return application;
});
