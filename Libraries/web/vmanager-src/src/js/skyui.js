window.SkyUI = new function (){
	var self = this;
	this.templates = {};
	this.description = "Class SkyVR For SkyVR";
	this.nextContainer = function(){
		var childrens = $('.content').children();
		for(var i = 0; i < childrens.length; i++){
			
			if($(childrens[i]).hasClass('incoming-container')){
				if(i-1 >= 0)
					$(childrens[i-1]).addClass('closed-container');
				$(childrens[i]).removeClass('incoming-container');
				break;
			}
		}
	};
	this.showDialogDemo = function(){
		this.reinitDemoVersionDialog();
		$('.skyvr-dialog-content-demo-version').text('Settings changing is disabled in the demo version');
		$('.skyvr-dialog-is-demo-version').show();
		CloudUI.mobileNavPages.push('demoversiondialog');
	};
	this.mobileNavPages = {};
	this.mobileNavPages.stack_pages = [];
	this.mobileNavPages.push = function(new_page){
		if(self.mobileNavPages.last() == new_page){
			return;
		}
		console.log("mobileNavPages.push: " + JSON.stringify(self.mobileNavPages.stack_pages));
		console.log("mobileNavPages.push: " + new_page);
		self.mobileNavPages.stack_pages.push(new_page);
	};
	this.mobileNavPages.pop = function(){
		if(self.mobileNavPages.stack_pages.length > 0){
			var page = self.mobileNavPages.last();
			console.log("mobileNavPages.pop: " + page);
			self.mobileNavPages.stack_pages.pop();
			console.log("mobileNavPages.pop: " + JSON.stringify(self.mobileNavPages.stack_pages));
			return page;
		}
	}
	this.mobileNavPages.last = function(){
		if(self.mobileNavPages.stack_pages.length > 0){
			var page = self.mobileNavPages.stack_pages[self.mobileNavPages.stack_pages.length-1];
			return page;
		}
	}
	this.isDemo=function(){
		return localStorage.getItem('is_opened_like_demo')==="true" || CloudAPI.containsPageParam("demo");
	};
	
	this.reinitDemoVersionDialog = function(){

		console.log("showDialogDemo " + $('.skyvr-dialog-is-demo-version').length);
		var html = $('.skyvr-dialog-is-demo-version').html();
		$('.skyvr-dialog-is-demo-version').remove();
		$('body').append($('<div class="skyvr-dialog-is-demo-version" style="display: none;">' + html + '</div>'));
		$('.skyvr-dialog-is-demo-version .skyvr-dlg-hdr-right').unbind().click(function(){
			CloudUI.mobileNavPages.pop();
			$('.skyvr-dialog-is-demo-version').hide();
		});

		var bClickOnWindow = false;
		$('.skyvr-dialog-is-demo-version .skyvr-clipshow-window').unbind().click(function(){
			bClickOnWindow = true;
		});

		$('.skyvr-dialog-is-demo-version .skyvr-clipshow-cell').unbind().click(function(){
			if(bClickOnWindow == true){
				bClickOnWindow = false;
				return;
			}
			bClickOnWindow = false;
			CloudUI.mobileNavPages.pop();
			$('.skyvr-dialog-is-demo-version').hide();
		});
	};
	this.prevContainer = function(){
		var childrens = $('.content').children();
		var c = -1;
		for(var i = 0; i < childrens.length; i++){
			if($(childrens[i]).hasClass('closed-container')){
				c = i;
			}
		}

		if (c >= 0){
			if(c+1 < childrens.length)
				$(childrens[c+1]).addClass('incoming-container');
			$(childrens[c]).removeClass('closed-container');
		}
	};
}();

// for feature
window.CloudUI = window.SkyUI;


CloudUI.triggers = {};
CloudUI.trigger = function(eventname, app, event){ // app, event - temporary variables
	if(CloudUI.triggers[eventname]){
		setTimeout(function(){
			CloudUI.triggers[eventname](app, event);
		},1);
	}
}
CloudUI.on = function(eventname, func){
	CloudUI.triggers[eventname] = func;
};

CloudUI.off = function(eventname){
	if(CloudUI.triggers[eventname]){
		delete CloudUI.triggers[eventname];
	}
};

CloudUI.htmlEscape = function(str){
	return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

CloudUI.on('showcameranotfound', function(app, event){
	$('.skyvr-cell-content').html('<div class="camera_not_found">' + CloudUI.polyglot.t("camera_not_found") + '</div>');
});

CloudUI.on('showfirstcameraplayer', function(app, event){
	console.log("[CLOUDUI] showfirstcameraplayer");
	SkyVR.camerasList().done(function(data){
		if(data.objects.length == 0){
			CloudUI.trigger('showcameranotfound', app, event);
		}else{
			if(data.objects.length > 1)
				console.warn('[CLOUDUI] Cameras more than one please check cc.goto_first_camera');
			var cnt = $(CloudUI.mainPageHtml());
			$('.content').html(cnt);
			var openCam = null;
			var openCamId = 0;
			if(CloudAPI.containsPageParam('camid')){
				var camid = CloudAPI.pageParams['camid'];
				for(var i = 0; i < data.objects.length; i++){
					if(camid == data.objects[i].id) {
						console.log("ID"+i+":"+data.objects[i].id);
						openCam = data.objects[i];
						openCamId = data.objects[i].id;
						break;
					}
				}
			} else if(localStorage.getItem('selectedCam') != null){
				var choosenCam=JSON.parse(localStorage.getItem('selectedCam'));
				console.log("ID "+choosenCam.svcp_id);
				for(var i = 0; i < data.objects.length; i++){
					if(choosenCam.svcp_id == data.objects[i].id) {
						console.log("ID"+i+":"+data.objects[i].id);
						openCam = data.objects[i];
						openCamId=data.objects[i].id;
						break;
					}
				}
			}else{
				openCam = data.objects[0];
				openCamId = data.objects[0].id;
			}
			
			// openCam = data.objects[2];
			// openCamId = data.objects[2].id;

			CloudAPI.cameraInfo(openCamId).done(function(){
				CloudAPI.setCameraID(openCamId);
				console.log('selection camera', CloudAPI.cache.cameraInfo());
				event.trigger(event.CAMERA_SELECTED, [CloudAPI.cache.cameraInfo()]);
			})
		}
	}).fail(function(){
		console.error("Could not found cameras or unathorized");
	});
	// event.trigger(event.CAMERA_SELECTED, [SkyVR.cache.cameraInfo() || cam]);
	// app.trigger('ShowMainPage');
});

CloudUI.showPageClips = function(app){
	var d = $.Deferred();
	var page_params = SkyVR.parsePageParams();
	var options = {'sharepage': false};
	if(SkyVR.containsPageParam('token')){
		CloudUI.clips.shareToken = SkyVR.pageParams['token'];
		CloudUI.clips.onlyclips = true;
		options['sharepage'] = true;
	}else{
		CloudUI.clips.onlyclips = false;
	}

	CloudUI.clips.mPlayer = undefined;
	CloudUI.clips.elemId = "videojs-clipshow";
	
	var el = CloudUI.templates.createPageClips(options);
	$('.clip-container').html($(el));
	
	if(!cc.account_sharing_clips){
		$('.skyvr-clips-shared-links').hide();
	}

	var bClickOnWindow = false;
	var self = this;
	if(!cc.clips_tags){
		$('.skyvr-clips-filter-group').hide();
	}
	
	if(!cc.account_sharing_clips){
		$('.skyvr-clips-shared-links').hide();
	}

	var bClickOnWindow = false;
	var self = this;
	if(!cc.clips_tags){
		$('.skyvr-clips-filter-group').hide();
	}
	
	
	// $('.card-container').addClass('incoming-container');

	CloudUI.clips.updateClipList();

	// if(param_clipid) showClipViewer(param_clipid);
	
	d.resolve();
	return d;
};

window.CloudUI.getRealVideoSize = function (){
	var size = {}
	size.height = 0;
	size.width = 0;
	try{
		if(videojs('live-container').videoHeight() != 0){
			size.height = videojs('live-container').videoHeight();
			size.width = videojs('live-container').videoWidth();
			return size;
		}
	}catch(e){
		
	}
	try{
		if(videojs('record-container1').videoHeight() != 0){
			size.height = videojs('record-container1').videoHeight();
			size.width = videojs('record-container1').videoWidth();
			return size;
		}
	}catch(e){
		
	}
	
	try{
		if(videojs('record-container2').videoHeight() != 0){
			size.height = videojs('record-container2').videoHeight();
			size.width = videojs('record-container2').videoWidth();
			return size;
		}
	}catch(e){
		
	}
	return size;
}

window.CloudUI.calculateMotionZoneSize = function(from_size){
	var size = {};
	size.height = 0;
	size.width = 0;
	size.left = 0;
	
	var flash_size = {};
	flash_size.height = $('.flash-player-container')[0].clientHeight;
	flash_size.width = $('.flash-player-container')[0].clientWidth;
	
	var video_size = CloudUI.getRealVideoSize();
	if(from_size){
		video_size = from_size;
	}else{
		if(video_size.height == 0){
			size.height = flash_size.height;
			size.width = flash_size.width;
			return size;
		}
	}
	
	var k = flash_size.height / video_size.height;
	size.height = flash_size.height;
	size.width = Math.round(k*video_size.width);
	size.left = Math.ceil((flash_size.width - size.width)/2);
	
	return size;
}
