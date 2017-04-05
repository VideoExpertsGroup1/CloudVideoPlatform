
/* CloudCameraList implementation */

window.CloudCameraList = window.CloudCameraList || {};
window.CloudCameraList.cache = window.CloudCameraList.cache || {}
window.CloudCameraList.config = window.CloudCameraList.config || {}

CloudCameraList.config.slide = {
	width:220,
	height: 220,
	color:'#3788b1',
	radius: 10,
	padding: '18px',
	margin : '10px',
	image : {
		width:184,
		height:131
	}
}
        
CloudCameraList.initialize = function(element){
	$(element).html(''
		+ '				<div class="structure">'
		+ '					<div class="sidebar-container" >'
		+ '						<div class="sidebar">'
		+ '						</div>'
		+ '					</div>'
		+ '				</div>'
	);
	CloudCameraList.container = $($(element).find('.sidebar'));
	// this.container.attr('id','transition_disabled');
	CloudCameraList.slides = new Array();
	CloudCameraList.pager = new Array();
	CloudCameraList.structure = null;
	CloudCameraList.currentPosition = 0;
	CloudCameraList.hideArrows = 0;
	$(window).on('resize',CloudCameraList.resizeHandler);
	// try render and start updating list
	CloudCameraList.render();
	CloudCameraList.startUpdatingCamList();
}

CloudCameraList.dispose = function(){
	CloudCameraList.stopUpdatingCamList();
	CloudCameraList.slides = new Array();
	CloudCameraList.pager = new Array();
	CloudCameraList.structure = null;
	CloudCameraList.currentPosition = 0;
	CloudCameraList.hideArrows = 0;
	if(CloudCameraList.container){
		CloudCameraList.container.html('');
	}
}

CloudCameraList.render = function(){
	console.log('[SLIDER] render');
	CloudCameraList.drawThrobber();
	CloudCameraList.createWrapper();
	CloudAPI.camerasList().done(function(data){
		CloudCameraList.structure = data.objects;
		if(cc.sort_cameralist){
			console.log('sort_cameralist');
			data.objects.sort(cc.sort_cameralist)
		}
		CloudCameraList.calcSizes();
		CloudCameraList.resizeHandler();
		CloudCameraList.drawSlides();
		CloudCameraList.bindEvents();
		CloudCameraList.updatePreview();
	}).fail(function(r){
		console.error(r);
		if(r.status && r.status == 401){
			CloudCameraList.unauthorizedFail();
		}
	});
}

CloudCameraList.drawThrobber = function(){
	CloudCameraList.container.html('<div class="throbber-wrapper"><span class="spinner gray" style="margin: 0px auto; transition: transform 0ms;"></div></div>');
}

CloudCameraList.hideThrobber = function(){
	CloudCameraList.container.find('.throbber-wrapper').css('display','none');
}

CloudCameraList.createWrapper = function(){
	// TODO if defined in cc.package_sample
	CloudCameraList.container.append(''
		+ (cc.is_package_sample ? '<div class="addcamera" id="addcamera"></div>' : '')
		+ '<div class="slider_wrapper" id="transition_disabled">'
		+	'<div class=slider">'
		+	'<div class="margin-l" style="width: 52px; float: left; height: 100px;"><span class="arrow left" style="display:none; width:30px; height:40px; float:right;margin-top: 100px; background-image: url('+'files/images/left_arrow.png'+');margin-right: 40px;cursor: pointer; background-repeat: no-repeat; background-position: center center;"></span></div>' +
				'<div class="slides" style="overflow:hidden; float:left"><div class="slide-wrapper" style="position:relative;width:826%;transition: all 800ms;"></div></div>' +
				'<div class="margin-r" style="width: 52px; float: left; height: 100px;"><span class="arrow right" style="display:none; width:30px; height:40px; float:left;margin-top: 100px;background-image: url('+'files/images/right_arrow.png'+');margin-left: 40px;cursor: pointer; background-repeat: no-repeat; background-position: center center;"></span></div>' +
			'</div>' +
			'<div style="clear: both;"></div> <div class="pager"></div>' +
		'</div>'
	);
}

CloudCameraList.drawPager = function(){
	var self = this;
	var cntr = CloudCameraList.container.find('.pager');
	cntr.html('');
	if(parseInt(CloudCameraList.slides.length / CloudCameraList.perPage)){
		for(var i=0; i < (CloudCameraList.slides.length / CloudCameraList.perPage); i++){
			el = $('<i class="page-icon" ></i>');
			el.data('page', i);
			if (i == CloudCameraList.currentPosition) {
				el.addClass('active');
			}
			el.click(function(){ CloudCameraList.currentPosition = $(this).data('page');  CloudCameraList.page($(this).data('page'))});
			cntr.append(el);
		}
	}
}

CloudCameraList.drawArrows = function(){
	CloudCameraList.container.find('.arrow').css('display', 'none');
	if(CloudCameraList.currentPosition != 0){
		CloudCameraList.container.find('.left').css('display', 'block');
	}if(CloudCameraList.container.find('.pager i').length && CloudCameraList.currentPosition != CloudCameraList.container.find('.pager i').last().data('page')){
		CloudCameraList.container.find('.right').css('display', 'block');
	}
}

CloudCameraList.changeActivePage = function(){
	var arr = CloudCameraList.container.find('.pager i');
	arr.removeClass('active');
	arr.each(function(el,i)     {
		if(el == CloudCameraList.currentPosition){
			$(i).addClass('active')
		}
	});
	CloudCameraList.drawArrows();
}

CloudCameraList.page = function(pos){
	CloudCameraList.container.find('.slide-wrapper').css('transform',CloudCameraList.calcTransform(pos));
	CloudCameraList.changeActivePage(CloudCameraList.currentPosition);
}

CloudCameraList.pageLeft = function(){
	CloudCameraList.currentPosition  != 0 ? CloudCameraList.currentPosition -= 1 : CloudCameraList.currentPosition = parseInt(CloudCameraList.slides.length / CloudCameraList.perPage);
	CloudCameraList.page(CloudCameraList.currentPosition);
}

CloudCameraList.pageRight = function(){
	CloudCameraList.currentPosition != parseInt((CloudCameraList.slides.length -1) / CloudCameraList.perPage) ? CloudCameraList.currentPosition += 1: CloudCameraList.currentPosition = 0 ;
	CloudCameraList.page(CloudCameraList.currentPosition);

}

CloudCameraList.calcTransform = function(page){
	return "translateX(-" + ((CloudCameraList.perPage * 240 *  page) )+ "px)";
}

CloudCameraList.fixView = function(){
	CloudCameraList.container.find('.slide-wrapper').width(CloudCameraList.sliderWidth);
	if(CloudCameraList.hideArrows || window.isFramed){
		CloudCameraList.container.find('.margin-l').hide();
		CloudCameraList.container.find('.margin-r').hide();
		CloudCameraList.container.find('.pager').css('display','none');
		CloudCameraList.container.find('.slide-wrapper').css('transform',CloudCameraList.calcTransform(CloudCameraList.currentPosition));
		CloudCameraList.container.find('.slide').css('float','none');
	}else{
		CloudCameraList.container.find('.slide-wrapper').width(CloudCameraList.slides.length * 240);
		CloudCameraList.container.find('.margin-l').show();
		CloudCameraList.container.find('.margin-r').show();
		CloudCameraList.container.find('.pager').css('display','');
		CloudCameraList.currentPosition = 0;
		CloudCameraList.container.find('.slide-wrapper').css('transform',CloudCameraList.calcTransform(CloudCameraList.currentPosition));
		CloudCameraList.container.find('.slide').css('float','left');
	}
}

CloudCameraList.setCameraPreviews = function(){
	CloudCameraList.container.find(".slide").each(function(){
		var slide = this;
		var camId = $(this).data('cid');
		var cam = CloudCameraList.structure.filter(function(el){if(el.id == camId){return true}else {return false}})[0];
	});
}

CloudCameraList.drawSlides = function (){
	var cnt = CloudCameraList.container.find('.slider_wrapper .slides .slide-wrapper');
	if(CloudCameraList.slides.length){
		_.each(CloudCameraList.slides, function(el){cnt.append(el.render())});
		CloudCameraList.setCameraPreviews();
		CloudCameraList.container.find('.slide-wrapper').css({
			'overflow-y': 'auto',
			'overflow-x': 'hidden',
			'width': CloudCameraList.slides.length * 240,
			'max-height': $(document).height() - 47
		});
		CloudCameraList.fixView();
		CloudCameraList.drawPager();
	}else{
		CloudCameraList.container.css('width','220px').find('.slider_wrapper').html('').append($('<div class="empty-cameras">'
			+ '<div style="display: table-cell; vertical-align: middle;">'
			+ CloudUI.polyglot.t("no_cameras")
			+ '</div>'
			+ '</div>'
		));
	}
}

CloudCameraList.bindEvents = function () {
	CloudCameraList.drawArrows();
	CloudCameraList.container.remove('id');
	CloudCameraList.clickState = false;
	CloudCameraList.container.find('.slider_wrapper').remove('id');
	CloudCameraList.container.find('.left').click(function(){CloudCameraList.pageLeft()});
	CloudCameraList.container.find('.right').click(function(){CloudCameraList.pageRight()});
	CloudCameraList.hideThrobber();
	CloudCameraList.container.find('.slide img').click(function(){
		if(!CloudCameraList.clickState) {
			CloudCameraList.clickState = true;
			var cid = $(this).closest('.slide').data('cid')
			var cam = CloudCameraList.structure.filter(function (el) {
				if (el.id == cid) {
					return true
				} else {
					return false
				}
			});
			CloudAPI.setCameraID(cam[0].id);
			console.log('selection camera ', CloudAPI.cache.cameraInfo());
			CloudUI.event.trigger(CloudUI.event.CAMERA_SELECTED, [CloudAPI.cache.cameraInfo() || cam]);
		}
	});
	CloudCameraList.container.find('#addcamera').unbind().bind('click',function(){
		app.createDialogModal({
			'class': 'addcameradialog',
			'title': app.polyglot.t('dialog_title_create_camera'),
			'content': app.polyglot.t('dialog_content_create_camera').replace(new RegExp("%S%",'g'), '#' + CloudAPI.cache.account.id +  ' ' + CloudAPI.cache.account.name),
			'buttons': [
				{text: app.polyglot.t('Close'), close: true}
			],
			'beforeClose' : function() {
			}
		});
	});
}

CloudCameraList.resizeHandler = function() {
	$('.slider_wrapper .slides .slide-wrapper').css({'max-height': $(document).height() - 47});
	if(!CloudCameraList.slides.length){
		return;
	}
	CloudCameraList.winWidth = $(document).width() / 1.5;
	if (CloudCameraList.winWidth < 344) {
		CloudCameraList.winWidth = 344;
	}
	if (CloudCameraList.winWidth > ((240 * 3) + 104)) {
		CloudCameraList.winWidth = ((240 * 3) + 104);
	}
	CloudCameraList.sliderWidth = 0;
	CloudCameraList.perPage = parseInt((CloudCameraList.winWidth - 104) / 240);
	switch (CloudCameraList.perPage) {
		case 1 :
			CloudCameraList.sliderWidth = CloudCameraList.perPage * 240;
			CloudCameraList.hideArrows =1;
			break
		default :
			CloudCameraList.hideArrows = 0;
			CloudCameraList.sliderWidth = CloudCameraList.perPage * 240 + 104;
	}
	if(CloudCameraList.slides.length < 3 && CloudCameraList.perPage == 3) {
		CloudCameraList.hideArrows = 0;
		CloudCameraList.sliderWidth = (CloudCameraList.slides.length * 240 + 104);
	}
	CloudCameraList.container.find('.slides').width(CloudCameraList.hideArrows ? CloudCameraList.sliderWidth : CloudCameraList.sliderWidth - 104);
	CloudCameraList.container.width(CloudCameraList.sliderWidth);
	CloudCameraList.drawPager();
	CloudCameraList.fixView();
	return;
}

CloudCameraList.unauthorizedFail = function(){
	CloudCameraList.hideThrobber();
	CloudCameraList.container.css('width','220px').find('.slider_wrapper').html('').append(''
		+ CloudUI.polyglot.t("Unauthorized")
	);
} 

CloudCameraList.updateCamlist = function(){
	CloudCameraList.stopUpdatingCamList();
	CloudAPI.camerasList().done(function(response){
		if(response.objects){
			// detect diff
			var old_ids = [];
			for(var i = 0; i < CloudCameraList.structure.length; i++){
				old_ids.push(CloudCameraList.structure[i].id);
			}
			var new_ids = [];
			for(var i = 0; i < response.objects.length; i++){
				new_ids.push(response.objects[i].id);
			}
			var count = 0;
			for(var i = 0; i < new_ids.length; i++){
				if(old_ids.indexOf(new_ids[i]) == -1) count++;
			}
			for(var i = 0; i < old_ids.length; i++){
				if(new_ids.indexOf(new_ids[i]) == -1) count++;
			}
			if(count>0){
				console.log("[SLIDER] Cameras list was change");
				$('.sidebar').html('');
				CloudCameraList.dispose();
				// slider.currentPosition
				CloudCameraList.render(app);
				CloudCameraList.startUpdatingCamList();
			}else{
				CloudCameraList.structure = response.objects;
				CloudCameraList.updatePreview(app);
			}
		}
	}).fail(function(r){
		console.error(r);
		if(r.status && r.status == 401){
			CloudCameraList.unauthorizedFail();
		}
	});
}

CloudCameraList.Slide = function(params){
	var self = this;
	var obj = new Object();
	obj.params = params;
	_.extend(obj.params, CloudCameraList.config.slide);
	obj.render = function(){
		var item = $('<div class="slide"></div>');
		item.css({float:CloudCameraList.hideArrows ? 'initial' : 'left'})
		item.data('cid',this.params.id);
		var camstat = {
			'active' : CloudUI.polyglot.t('On'),
			'inactive' : CloudUI.polyglot.t('Off'),
			'inactive_by_scheduler' : CloudUI.polyglot.t('Off'),
			'offline' : CloudUI.polyglot.t('Disconnected'),
			'unauthorized' : CloudUI.polyglot.t('Wrong configuration')
		};
		var camstat_text = '';
		if(this.params.status && camstat[this.params.status]){
			camstat_text = camstat[this.params.status];
		};
		item.append($("<img class='slide-img " + this.params.status + "' id='capture_screen_" + this.params.id + "' border='0'>").on('error', 
			function(){
				if($(this).attr('src') != ''){
					console.error("could not load image: " + $(this).attr('src') + " For " + $(this).attr('id') + " change to default");
					$(this).attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AUNCR061qtorgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXY/z//z8DAwMDAxMDFAAAMAYDAZWbBRUAAAAASUVORK5CYII%3D');
				}
			})
			.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AUNCR061qtorgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXY/z//z8DAwMDAxMDFAAAMAYDAZWbBRUAAAAASUVORK5CYII%3D')
		);
		var name = this.params.name != "" ?  this.params.name : CloudUI.polyglot.t('Noname');
		item.append($("<div class='slide_description'></div>")
			.append("<span class='main'>"+name+"</span>")
			// .append('<span class="italic">'+camstat_text+'</span>')
		);
		return item;
	};
	return obj;
}


CloudCameraList.calcSizes = function(){
	_.each(CloudCameraList.structure, function(el){CloudCameraList.slides.push( CloudCameraList.Slide(el))});
}
 
CloudCameraList.updatePreview = function(){
	// console.log("[SLIDER] update preview begin");
	var self = this;
	P2PProvider.cleanup();

	// beheivor for update preview for not p2p camera
	var preview = function(pos, cameraID){
		if(!SkyVR.hasAccessCameraPreview(cameraID)) return false;
		SkyVR.cameraPreview(cameraID).done(function(response){
			// console.log("[SLIDER] preview 2");
			// console.log(response);
			// preview not work
			var status = CloudCameraList.structure[pos].status;
			if(status == 'active'){
				$("#capture_screen_" + cameraID).attr("src",response.url);
			}
			var lastTime1 = new Date(response.time).getTime();
			var lastTime2 = new Date().getTime();
			// console.log("lastTime1: " + lastTime1);
			// console.log("lastTime2: " + lastTime2);
			// check date and call upgrade preview if need
			if(lastTime2 - lastTime1 > 60000){ // more than 1 minute
				if(CloudAPI.hasAccessCameraUpdatePreview(cameraID)){
					CloudAPI.cameraUpdatePreview(cameraID);
				}else{
					console.warn("Do not have permission to access updating preview");
				}
			}
		}).fail(function(xhr, ajaxOptions, thrownError){
			console.error("[SLIDER] preview fail " + xhr.status);
			if(xhr.status=404){
				if(SkyVR.hasAccessCameraUpdatePreview(cameraID)){
					SkyVR.cameraUpdatePreview(cameraID);
				}
			}
		});
	};

	// beheivor for update preview for p2p camera
	var p2p_preview = function(pos, cameraID){
		SkyVR.cameraP2PSettings(cameraID).done(function(response){
			if(response.p2p_streaming && response.p2p_streaming == true){
				// CloudCameraList.structure[pos].image_file = "files/images/camimg_default.jpg"; // will be init later
				CloudCameraList.structure[pos].p2p = response;
				P2PProvider.findP2PHost(CloudCameraList.structure[pos].id).done(function(web_url,rtmp_url){
					console.log("[DEBUG] web_url " + web_url);
					var status = CloudCameraList.structure[pos].status;
					if(status == 'active'){
						var new_img = web_url + "capture/ch0.jpg?time=" + Date.now();
						$("#capture_screen_" + cameraID).attr("src",new_img);
					}
				});
			}else{
				try{preview(pos, cameraID)}catch(e){ console.error(e)};
			}
		});
	};
	
	function tryPreview(i0, camid){
		SkyVR.cameraInfo(camid).done(function(cam){
			if(cam['p2p_streaming'] && cam['p2p_streaming'] == true){
				try{p2p_preview(i0, camid)}catch(e){ console.error(e)};
			}else{
				try{preview(i0, camid)}catch(e){ console.error(e)};
			}
		});
	};
		
	for(var i = 0; i < CloudCameraList.structure.length; i++){
		var status = CloudCameraList.structure[i].status;
		if(status == "active"){
			tryPreview(i, CloudCameraList.structure[i].id);
		}else{
			var cameraID = CloudCameraList.structure[i].id;
			$("#capture_screen_" + cameraID)
				.removeClass('active')
				.removeClass('inactive')
				.removeClass('inactive_by_scheduler')
				.removeClass('offline')
				.removeClass('unauthorized')
				.addClass(status);
			// $("#capture_screen_" + cameraID).attr("src",camimgs[status]);
		}
	}
	// console.log("[SLIDER] update preview end");
}
        
CloudCameraList.stopUpdatingCamList = function(){
	clearInterval(CloudCameraList.updateCamImages);
}

CloudCameraList.startUpdatingCamList = function(){
	CloudCameraList.stopUpdatingCamList();
	CloudCameraList.updateCamImages = setInterval(function(){
		console.log("[CAMLIST] updateCamImages");
		CloudCameraList.updateCamlist();
	}, 30000);
}

/* CloudMainPage implementation */

window.CloudMainPage = window.CloudMainPage || {}
window.CloudMainPage.initPanelButtons = function(el){
	el.find('#open-cloud-api-button').unbind().bind('click',function(){
		var url = "https://www.videoexpertsgroup.com/api/client.html?api_token=" + CloudAPI.config.apiToken.token + "&api_token_exp=" + CloudAPI.config.apiToken.expire;
		var win = window.open(url, '_blank');
		win.focus();
	});
}

/* EventList implementation */
window.EventList = function (event){
	var self = this;
	self.event = event;
	self.description = "Class EventList For SkyVR";
	self.buffer = new Array();
	
	// cache by every 3 hours
	self.durationGrid = 10800000;

	this.minifier0002sec = new Array();
	this.minifier0036sec = new Array();
	this.minifier0450sec = new Array();

	this.minifier = function(scale_sec, startTime, endTime){
		var st = self.normalizeT(startTime);
		var et = self.normalizeT(endTime);
		var res = [];
		var mini = '';
		if(scale_sec > 0 && scale_sec <= 15){
			mini = 'minifier0002sec';
		}else if(scale_sec > 15 && scale_sec <= 60){
			mini = 'minifier0036sec';
		}else if(scale_sec > 60 && scale_sec <= 700){
			mini = 'minifier0450sec';
		}
		if(self[mini]){
			for(var i = st; i <= et; i += self.durationGrid){
				if(self[mini][i]){
					res = res.concat(self[mini][i]);
				}
			}
		}
		return res;
	}

	this.applySortUniq = function(t){
		self.buffer[t].sort(function (a, b) {return a.time - b.time});
		var len = self.buffer[t].length;
		if(len > 1){
			var o = self.buffer[t][0];
			for (var i=1;i<len-1;i++){
				if(o.time == self.buffer[t][i].time){
					self.buffer[t].splice(i,1);
					i--;
					len = self.buffer[t].length;
				}else{
					o = self.buffer[t][i];
				}
			}
		}
	};

	this.removeBefore = function(time){
		function funcdel(t){
			var res = 0;
			if(self.buffer[t]){
				var len = self.buffer[t].length;
				self.buffer[t] = self.buffer[t].filter(function(el){ return el.startTime > time; })
				var removed = (len - self.buffer[t].length);
				if(self.buffer[t].length == 0){
					delete self.buffer[t];
					delete self.minifier0002sec[t];
					delete self.minifier0036sec[t];
					delete self.minifier0450sec[t];
				}else if(removed > 0){
					self.minifier0002sec[t] = self.makeMinifier(2, t);
					self.minifier0036sec[t] = self.makeMinifier(36, t);
					self.minifier0450sec[t] = self.makeMinifier(450, t);
				}
				res += removed;
			}
			return res;
		}
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		var res = funcdel(prev_t);
		res += funcdel(t);
		return res;
	}

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp % self.durationGrid;
		return tmp;
	}
	
	this.lock = false;
	this.append = function(res){
		if(this.lock){
			var res2 = res;
			setTimeout(function(){ self.append(res2); },100);
			return;
		}
		// console.log("Set eventlist lock");
		this.lock = true;
		try{
			if(!res.concat){
				console.error("[TIMELINE] res.concat");
				return;
			}
			// filter by camid
			var camid = SkyVR.cameraID();
            res = res.filter(function(e){ return e.camid == camid; });
            var for_uniq = [];
            var minT = undefined;
			var maxT = undefined;
			for(var i = 0; i < res.length; i++){
				res[i].isoTime = res[i].time;
				res[i].time = Date.parse(res[i].isoTime + "Z");
				if(res[i].thumb){
					delete res[i].thumb;
				}
				minT = minT == undefined ? res[i].time : Math.min(minT, res[i].time);
				maxT = maxT == undefined ? res[i].time : Math.max(maxT, res[i].time);

				var part = self.normalizeT(res[i].time);
				if(for_uniq.indexOf(part) == -1){
					for_uniq.push(part);
				}
				if(!self.buffer[part]){
					self.buffer[part] = [];
				}
				self.buffer[part].push(res[i]);
			}

			for(var i in for_uniq){
				var t = for_uniq[i];
				self.applySortUniq(t);
				self.minifier0450sec[t] = self.makeMinifier(450, t);
				self.minifier0036sec[t] = self.makeMinifier(36, t);
				self.minifier0002sec[t] = self.makeMinifier(2, t);
			}
			if(minT && maxT)
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, minT, maxT);
		}finally{
			// console.log("Unset eventlist lock");
			this.lock = false;
		}
	};
	this.applyConcat = this.append;

	this.makeMinifier = function(scale_sec, t){
		scale_sec = scale_sec || 30;
		var result = [];
		var u = [];
		var list = self.buffer[t];
		for(var i = 0; i < list.length; i++){
			var obj = list[i];
			var new_obj = {}
			new_obj.time = obj.time - obj.time % (scale_sec*1000);
			if(u.indexOf(new_obj.time) == -1){
				new_obj.name = obj.name;
				result.push(new_obj);
				u.push(new_obj.time);
			};
		}
		result.sort(function (a, b) {return a.time - b.time});
		return result;
		return [];
	};
};

/* RecordList implementation */

window.RecordList = function (event){
	var self = this;
	window.RecordListGlobal = self;
	self.event = event;
	self.description = "Class RecordList For VXGCloud";
	self.buffer = {};
	
	// cache by every 3 hours
	self.durationGrid = 10800000;
	
	self.isP2P = CloudAPI.isP2PStreaming();
	console.log("[RecordList] isP2P=" + self.isP2P);
	
	this.minifier01hour = new Array();
	this.minifier = function(startTime, endTime){
		var st = self.normalizeT(startTime);
		var et = self.normalizeT(endTime);
		var res = [];
		for(var i = st; i <= et; i += self.durationGrid){
			if(self.minifier01hour[i]){
				res = res.concat(self.minifier01hour[i]);
			}
		}
		return res;
	}
	
	this.firstStartTime = function(){
		var t = undefined;
		for(var i in self.buffer){
			t = t == undefined ? i : Math.min(i, t);
		}
		// TODO if list is empty
		var list = self.buffer[t] || [];
		if(list.length > 0){
			return list[0].startTime;
		}
		return undefined;
	}

	self.lastEndTime = function(){
		var t = undefined;
		for(var i in self.buffer){
			t = t == undefined ? i : Math.max(i, t);
		}
		var list = self.buffer[t] || [];
		if(list.length > 0){
			return list[list.length-1].endTime;
		}
		return undefined;
	}

	this.removeBefore = function(time){
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		var res = 0;
		if(self.buffer[prev_t]){
			var len = self.buffer[prev_t].length;
			self.buffer[prev_t] = self.buffer[prev_t].filter(function(el){ return el.startTime > time; })
			var removed = (len - self.buffer[prev_t].length);
			if(self.buffer[prev_t].length == 0){
				delete self.buffer[prev_t];
				delete self.minifier01hour[prev_t];
			}else if(removed > 0){
				self.minifier01hour[prev_t] = self.makeMinifier(prev_t);
				
			}
			res += removed;
		}
		if(self.buffer[t]){
			var len = self.buffer[t].length;
			self.buffer[t] = self.buffer[t].filter(function(el){ return el.startTime > time; })
			var removed = (len - self.buffer[t].length);
			if(self.buffer[t].length == 0){
				delete self.buffer[t];
				delete self.minifier01hour[t];
			}else if(removed > 0){
				self.minifier01hour[t] = self.makeMinifier(t);
			}
			res += removed;
		}
		return res;
	}

	this.atTime = function(time){
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		if(self.buffer[prev_t]){
			var list = self.buffer[prev_t];
			for(var i in list){
				if(time >= list[i].startTime && time < list[i].endTime) return list[i];
			}
		}
		if(self.buffer[t]){
			var list = self.buffer[t];
			for(var i in list){
				if(time >= list[i].startTime && time < list[i].endTime) return list[i];
			}
		}
		return undefined;
	};
	this.afterTime = function(time){
		var t = self.normalizeT(time);
		var max = self.normalizeT(self.lastEndTime() || 0);
		while(t <= max){
			if(self.buffer[t]){
				var list = self.buffer[t];
				for(var i in list){
					if(list[i].startTime >= time){
						return list[i];
					}
				}
			}
			t += self.durationGrid;
		}
		return undefined;
	};
	this.recordDuringOrAfter = function (t){
		return  self.atTime(t) || self.afterTime(t);
	};
	this.next = function(o){
		if(o) return this.afterTime(o.endTime - 999);
		return undefined;
	};

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp%self.durationGrid;
		return tmp;
	}
	
	this.applySortUniq = function(t){
		self.buffer[t].sort(function (a, b) {
			return a.startTime - b.startTime
		});
		var len = self.buffer[t].length;
		if(len > 1){
			var o = self.buffer[t][0];
			for (var i=1;i<len-1;i++){
				if(o.startTime == self.buffer[t][i].startTime){
					self.buffer[t].splice(i,1);
					i--;
					len = self.buffer[t].length;
				}else{
					o = self.buffer[t][i];
				}
			}
		}
	};

	this.lock = false;
	this.append = function(res, def){
		var d = def || $.Deferred();
		if(this.lock){
			var res2 = res;
			var d2 = d;
			setTimeout(function(){ self.append(res2,d2); },100);
			return d2.promise();
		}
		this.lock = true;
		try{
			if(!res.concat){
				console.error("[TIMELINE] res.concat");
				return;
			}
			// filter by camid
			var camid = CloudAPI.cameraID();
			res = res.filter(function(e){ return e.camid == camid; });
			var for_uniq = [];
			var minT = undefined;
			var maxT = undefined;
			for(var i = 0; i < res.length; i++){
				res[i].startTime = Date.parse(res[i].start + 'Z');
				res[i].endTime = Date.parse(res[i].end + 'Z');
				if(res[i].endTime < res[i].startTime){ // this logic because bad server format on camera;
					if(self.isP2P == true){
						res[i].endTime += 86400000;
					}else{
						console.error("Wrong times: ", res[i]);
						continue;
					}
				}
				minT = minT == undefined ? res[i].startTime : Math.min(minT, res[i].startTime);
				maxT = maxT == undefined ? res[i].endTime : Math.max(maxT, res[i].endTime);
				var part = self.normalizeT(res[i].startTime);
				if(for_uniq.indexOf(part) == -1){
					for_uniq.push(part);
				}
				if(!self.buffer[part]){
					self.buffer[part] = new Array();
				}
				self.buffer[part].push(res[i]);
			}

			for(var i in for_uniq){
				var t = for_uniq[i];
				self.applySortUniq(t);
				self.minifier01hour[t] = self.makeMinifier(t);
			}
			d.resolve();

			if(minT && maxT){
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, minT, maxT);
			}
		}finally{
			this.lock = false;
		}
		return d.promise();
	};

	this.takeHour = function(t){
		return t - t%3600000;
	}

	this.makeMinifier = function(t, precision_ms){
		precision_ms = precision_ms || 1000;
		var hours = [];
		var list = self.buffer[t];

		function pushArr(t1,t2){
			if(t2 <= t1) return;
			var h = self.takeHour(t2);
			if(self.takeHour(t1) != h){
				pushArr(t1,h-1);
				pushArr(h,t2);
				return;
			}
			var count = 0;
			for (var i=0;i<hours.length;i++){
				if(hours[i].h == h){
					hours[i].periods.push({ startTime: t1, endTime: t2})
					count++;
					break;
				}
			}
			if(count == 0){
				hours.push({h: h, periods: [{startTime: t1, endTime: t2}]});
			}
		}
		for(var i = 0; i < list.length; i++){
			var obj = list[i];
			pushArr(obj.startTime,obj.endTime);
		}

		hours.sort(function (a, b) {
			return a.h - b.h
		});

		var result = [];
		for(var i = 0; i < hours.length; i++){
			var periods = hours[i].periods;
			periods.sort(function (a, b) {
				return a.startTime - b.startTime
			});
			var p = undefined;
			for(var hi = 0; hi < periods.length; hi++){
				if(p == undefined){
					p = {
						startTime: periods[hi].startTime,
						endTime: periods[hi].endTime
					}
				}else{
					if(p.endTime >= periods[hi].startTime-precision_ms){
						p.endTime = periods[hi].endTime;
					}else{
						result.push({startTime: p.startTime, endTime: p.endTime});
						p = {
							startTime: periods[hi].startTime,
							endTime: periods[hi].endTime
						}
					}
				}
			}
			if(p != undefined){
				result.push({startTime: p.startTime, endTime: p.endTime});
			}
		}
		return result;
		return [];
	};
	
	this.checkCache = function(){
		for(var t in self.buffer){
			console.log(t);
			var ar = self.buffer[t];
			var len = ar.length;
			for(var i = 0; len; i++){
				if(i+1 < len){
					if(ar[i].startTime > ar[i+1].startTime){
						console.log("not sorted ", ar[i]);
						console.log("not sorted ", ar[i+1]);
					}
				}
			}
		}
	}
};

/* Timeline implementation */

window.Timeline = window.Timeline || {};
window.Timeline.model = window.Timeline.model || {};
window.Timeline.model.time = Date.now();

window.Timeline.getDuration = function(e){
	return Timeline.duration;
}

window.Timeline.locked = false;

window.Timeline.lock = function(){
	Timeline.locked = true;
}

window.Timeline.unlock = function(){
	Timeline.locked = false;
}

window.CloudUI = window.CloudUI || {};

CloudUI.isPlayerSingleMode = function(){
	return cc.goto_first_camera && !CloudAPI.containsPageParam("fcno");
}

CloudUI.getPathToPlayerSwf = function(){
	if(localStorage.getItem("player_swf") != null){
		return localStorage.getItem("player_swf");
	}
	return cc.custom_videojs_swf ? cc.custom_videojs_swf : "swf/video-js-custom-vxg.swf";
}

CloudUI.htmlDialog = function(opt){
	return $('<div class="box-modal" id="' + opt.id + '">'
	+ '	<div class="list-content">'
	+ '		<div class="settings-popup camera-settings-popup dialog-popup">'
	+ '			<div class="header">'
	+ '				<p>' + opt.title + '</p>'
	+ '				<img class="box-modal_close arcticmodal-close" src="./files/images/camera_setting/close_white.svg">'
	+ '				<div class="clear"></div>'
	+ '			</div>'
	+ '			<div class="popup-wrapper dialog-content">'
	+ '			</div>'
	+ '		</div>'
	+ '	</div>'
	+ '</div>');
};

CloudUI.generateMediaStreamsSettings = function(cam_settings, s){
	if(!CloudAPI.hasAccessSettings()){
		return s;
	}
	if(cam_settings.media_streams && cam_settings.media_streams.mstreams_supported){
		var inputs = [];
		for(var i in cam_settings.media_streams.mstreams_supported){
			var st = cam_settings.media_streams.mstreams_supported[i];
			var name = st.id;
			var value = st.id;
			if(cam_settings.url){  // if hosted
				name = CloudUI.tr(name);
			}
			inputs.push({"name": name, 'value': value});
		}

		if(inputs.length > 1){
			var current_name = cam_settings.media_streams.live_ms_id;
			var current_value = cam_settings.media_streams.live_ms_id;
			if(cam_settings.url){
				current_name = CloudUI.tr(current_name);
			}
			s.options.push({
				'setting_name': CloudUI.polyglot.t('media_stream_set_title'),
				'desc': '',
				'type': 'dropdown',
				'first_state': CloudAPI.hasAccessSettings() ? '' : 'active',
				'input': true,
				'input_name': 'media_stream',
				'input_type': 'radio',
				'inputs' : inputs,
				'current': {'name': current_name, 'value': current_value}
			});
		}
	}
	return s;
}

CloudUI.bindMediaStreamsSettings = function(){
	$('form#media_stream input').click(function(){
		var current_value = CloudAPI.cache.cameraInfo().media_streams.live_ms_id;
		if(CloudUI.isDemo()){
			// Reset to original value
			$('#media_stream_' + current_value).prop('checked', true);
			// Show dialog
			CloudUI.showDialogDemo();
			return;
		}
		var elem = $(this).parent().parent().parent().find(".current-value");
		var val = $(this).val();
		var caption = val;
		CloudAPI.updateCameraMediaStreams({
			live_ms_id: val,
			rec_ms_id: val
		}).done(function(){
			if(CloudAPI.cache.cameraInfo().url){ // if hosted
				caption = CloudUI.tr(val);
			}
			elem.text(caption);
			CloudUI.needReinitPlayers = true;
			CloudUI.event.trigger(CloudUI.event.TIMELINE_REINIT_START_RECORD);
		}).fail(function(r){
			// reset to original value
			$('#media_stream_' + current_value).prop('checked', true);
			CloudUI.showError(CloudUI.tr('error'), CloudUI.tr('error_media_stream_change'));
			console.error(r);
		});
	});
}

CloudUI.generateStreamingSettings = function(cam_settings){
	var s = {};
	s.title = {'setting_name': CloudUI.tr('streaming_settings'), 'type': 'devider'};
	s.options = [];
	console.log(cam_settings);
	s = CloudUI.generateMediaStreamsSettings(cam_settings, s);
	return s;
}

CloudUI.generatePlayerSettings = function(){
	var s = {};
	s.title = {'setting_name': CloudUI.tr('player_settings'), 'type': 'devider'};
	s.options = [];

	var current_value = CloudUI.getPathToPlayerSwf();
	var current_name = '';
	if(localStorage.getItem("player_swf") == null){
		current_value = '';
		current_name = CloudUI.polyglot.t('smoothness');
	}else{
		current_name = CloudUI.polyglot.t('minimal_latency');
	}

	s.options.push({
		'setting_name': CloudUI.polyglot.t('buffering'),
		'desc': '',
		'type': 'dropdown',
		'first_state': CloudAPI.hasAccessSettings() ? '' : 'active',
		'input': true,
		'input_name': 'buffering',
		'input_type': 'radio',
		'inputs' : [
			{name:CloudUI.polyglot.t('smoothness'),value:''},
			{name:CloudUI.polyglot.t('minimal_latency'),value:'swf/video-js-by-vxg-buff100.swf'}
		],
		'current': {'name': current_name, 'value': current_value}
	});
	return s;
}

CloudUI.bindPlayerSettings = function(){
	$('form#buffering input').click(function(){
		var obj = {};
		var val = $(this).val();
		var caption = '';
		if(val == ""){
			localStorage.removeItem("player_swf");
			caption = CloudUI.tr('smoothness');
		}else{
			localStorage.setItem("player_swf", val);
			caption = CloudUI.tr('minimal_latency');
		}
		$(this).parent().parent().parent().find(".current-value").text(caption);
		CloudUI.needReinitPlayers = true;
		CloudUI.event.trigger(CloudUI.event.TIMELINE_REINIT_START_RECORD);
	});
}

CloudUI.bindSettings = function(){
	/* change media stream */
	CloudUI.bindMediaStreamsSettings();
	CloudUI.bindPlayerSettings();
}

CloudUI.mainPageHtml = function(){
	var s = ''
		+ '<div class="main-content">'
		+ '	<div class="skyvr-table-content spec-background animate-container">'
		+ '		<div class="skyvr-row-content">'
		+ '			<div class="skyvr-cell-content top-panel">'
		+ '				<div class="top-panel-menu">'
		if(cc.is_package_sample){
			s += ''
			+ '					<div class="top-panel-menu-item left">'
			+ '						<a id="logout" class="logout-button">' + CloudUI.polyglot.t('Logout') + '</a>'
			+ '					</div>'
			+ '					<div class="top-panel-menu-item">'
			+ '						<div id="settings-button" class="cloud-user-name"></div>'
			+ '					</div>'
			+ '					<div class="top-panel-menu-item right">'
			+ '						<div id="open-cloud-api-button" class="cloud-client-api">Try Cloud Client API</div>'
			+ '					</div>';
		}else{
			s += ''
			+ '					<div class="top-panel-menu-item left">'
			+ '						<div id="settings-button" class="cloud-user-name"></div>'
			+ '					</div>'
			+ '					<div class="top-panel-menu-item right">'
			+ '						<div id="open-cloud-api-button" class="cloud-client-api">Try Cloud Client API</div>'
			+ '						<a id="logout" class="logout-button">' + CloudUI.polyglot.t('Logout') + '</a>'
			+ '					</div>';
		}
		s += ''
		+ '				</div>'
		+ '			</div>'
		+ '		</div>'
		+ '		<div class="skyvr-row-content">'
		+ '			<div class="skyvr-cell-content" id="camlist-container">'
		+ '			</div>'
		+ '		</div>'
		+ '	</div>'
		+ '	<div class="cards">'
		+ '		<div class="card-container animate-container">'
		+ '		</div>'
		+ '		<div class="clip-container animate-container incoming-container">'
		+ '		</div>'
		+ '	</div>'
		+ '</div>';
		
	return s;
}

CloudUI.bindMenuButtons = function(){
	if(cc.is_package_sample){
		/*$('#settings-button').css({'cursor': 'pointer'});
		$('#settings-button').unbind().bind('click', function(){
			if(CloudAPI.cache.account 
				&& CloudAPI.cache.account.urls
				&& CloudAPI.cache.account.urls.profile){
					window.location = CloudAPI.cache.account.urls.profile;
			}
		});*/
	}
}

CloudUI.polyglot = {}

CloudUI.polyglot.t = function(s){
	if(CloudUI.polyglot['translates']){
		if(CloudUI.polyglot.translates[s]){
			return CloudUI.polyglot.translates[s];
		}else{
			console.warn("Not found translate for '" + s + "'");
		}
	}
	if(window['app']){ // deprecated
		return app.polyglot.t(s);
	}
	console.warn("Not found translate for '" + s + "'");
	return s;
}

CloudUI.lang = function(){
	return CloudAPI.lang();
};

CloudUI.loadTranslates = function(){
	var d = $.Deferred();
	$.ajax({
		url: 'vendor/' + CloudAPI.config.vendor + '/lang/' + CloudAPI.lang() + ".json",
		type: 'GET',
		contentType: 'application/json'
	}).done(function(translates){
		CloudUI.polyglot.translates = translates;
		d.resolve();
	}).fail(function(){
		d.reject();
	});
	return d;
}

if(!CloudUI.polyglot.translates){
	CloudUI.loadTranslates(); // load translates if not loaded
}

CloudUI.osname = function(){
	var os="unknown";
	if (navigator.appVersion.indexOf("Win")!=-1) os="win";
	if (navigator.appVersion.indexOf("Mac")!=-1) os="mac";
	if (navigator.appVersion.indexOf("X11")!=-1) os="unix";
	if (navigator.appVersion.indexOf("Linux")!=-1) os="linux";
	return os;
};

CloudUI.tr = CloudUI.polyglot.t; // symlink

CloudUI.showError = function(title, text, afterClose){
	var error_html = ''
	+ '<div class="box-modal">'
	+ '<div class="list-content">'
	+ '<div class="settings-popup camera-settings-popup" style="background-color: white; min-height: 100px; height: auto;">'
	+ '<div class="header">'
	+ '<p>Something here header</p>'
	+ '<img class="box-modal_close arcticmodal-close" src="./files/images/camera_setting/close_white.svg">'
	+ '<div class="clear"></div>'
	+ '</div>'
	+ '<div class="popup-wrapper">'
	+ '<div class="skyvr-dialog-modal-status" style="padding-bottom: 0px;">'
	+ '<div style="display: table;">'
	+ '<div class="error-icon">'
	+ '<!-- TODO move to css -->'
	+ '<img style="padding: 5px" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4KCjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9IkxheWVyXzEiCiAgIHg9IjBweCIKICAgeT0iMHB4IgogICB3aWR0aD0iNTAiCiAgIGhlaWdodD0iNTAiCiAgIHZpZXdCb3g9IjAgMCA1MCA1MCIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45MSByMTM3MjUiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImVycm9yLnN2ZyI+PG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhMTEiPjxyZGY6UkRGPjxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlIC8+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgICAgaWQ9ImRlZnM5Ij48bGluZWFyR3JhZGllbnQKICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyIKICAgICAgIGlkPSJsaW5lYXJHcmFkaWVudDQxNDEiPjxzdG9wCiAgICAgICAgIHN0eWxlPSJzdG9wLWNvbG9yOiNhYTAwMDA7c3RvcC1vcGFjaXR5OjE7IgogICAgICAgICBvZmZzZXQ9IjAiCiAgICAgICAgIGlkPSJzdG9wNDE0MyIgLz48c3RvcAogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojYWEwMDAwO3N0b3Atb3BhY2l0eTowOyIKICAgICAgICAgb2Zmc2V0PSIxIgogICAgICAgICBpZD0ic3RvcDQxNDUiIC8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQKICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXJHcmFkaWVudDQxNDEiCiAgICAgICBpZD0ibGluZWFyR3JhZGllbnQ0MTQ3IgogICAgICAgeDE9IjcuNDc0NTc2IgogICAgICAgeTE9IjguODEzNTU5NSIKICAgICAgIHgyPSI5MC4xNTI1NDIiCiAgICAgICB5Mj0iODkuNTA4NDY5IgogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIC8+PC9kZWZzPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTg1NSIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDU2IgogICAgIGlkPSJuYW1lZHZpZXc3IgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTp6b29tPSI2LjU1NTU1NTYiCiAgICAgaW5rc2NhcGU6Y3g9IjM2LjYwNjQ0OSIKICAgICBpbmtzY2FwZTpjeT0iLTUuMTMwMzc2NSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iMTk4NSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iMjQiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJMYXllcl8xIiAvPjxlbGxpcHNlCiAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOnVybCgjbGluZWFyR3JhZGllbnQ0MTQ3KTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgIGlkPSJwYXRoNDEzNCIKICAgICBjeD0iMjUuMTA2NDYyIgogICAgIGN5PSIyNS4wNjg0MTUiCiAgICAgcng9IjI0LjY3NTAxMSIKICAgICByeT0iMjQuOTU3NzU2IiAvPjxnCiAgICAgaWQ9Imc0MTM2IgogICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuNDAzNDQxMiwwLDAsMS40MTUxODE5LC0wLjQ3NjgyNzk2LC0wLjAwNDQ5ODA0KSIKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS1vcGFjaXR5OjEiPjxyZWN0CiAgICAgICBpZD0icmVjdDMiCiAgICAgICBoZWlnaHQ9IjIiCiAgICAgICB3aWR0aD0iMzEuMTEzMDAxIgogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcxLDAuNzA3MSwtMC43MDcxLDAuNzA3MSwxOCwtNy40NTU4KSIKICAgICAgIHk9IjE3IgogICAgICAgeD0iMi40NDQiIC8+PHJlY3QKICAgICAgIGlkPSJyZWN0NSIKICAgICAgIGhlaWdodD0iMzEuMTEyNzAzIgogICAgICAgd2lkdGg9IjEuOTk5OTgwOCIKICAgICAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTA2NzgsMC43MDcxMDY3OCwtMC43MDcxMDY3OCwwLjcwNzEwNjc4LDAsMCkiCiAgICAgICB5PSItMTUuNTU1OTkyIgogICAgICAgeD0iMjQuNDU1NzExIiAvPjwvZz48L3N2Zz4=">'
	+ '</div>'
	+ '<div class="error-text"></div>'
	+ '</div>'
	+ '</div>'
	+ '</div>'
	+ '<div class="skyvr-dialog-modal-buttons">'
	+ '<div class="menu_btn arcticmodal-close" style="margin-left: 15px;">Ok</div>'
	+ '</div>'
	+ '</div>'
	+ '</div>'
	+ '</div>';

	var cnt = $(error_html);
	cnt.find('.header p').text(title);
	cnt.find('.error-text').html(text);
	$.arcticmodal({
		content: cnt,
		afterClose: afterClose ? afterClose : function(){}
	});
};

CloudUI.templates = {};
CloudUI.templates.createPageClips = function(options){
	var divCardClips = document.createElement('div');
	divCardClips.className = 'card type-clips';

	// header
	var divCardHeader = document.createElement('div');
	divCardHeader.className = "card-header";
	var h1CardTitle = document.createElement('h1');
	h1CardTitle.className = "card-title";
	h1CardTitle.innerHTML = CloudUI.polyglot.t("clips_title");
	divCardHeader.appendChild(h1CardTitle);
	if(!options.sharepage){
		var aHref = document.createElement('a');
		aHref.href = "#";
		aHref.innerHTML = '<div class="navigation-button close-card-button"><div class="icon"></div></div>';
		divCardHeader.appendChild(aHref);
	}
	var divClipFilter = document.createElement('div');
	divClipFilter.className="skyvr-clips-filter-open";
	divCardHeader.appendChild(divClipFilter);
	if(!options.sharepage){
		var divClipShare = document.createElement('div');
		divClipShare.className="skyvr-clips-shared-links";
		divCardHeader.appendChild(divClipShare);
		var divClipDelete = document.createElement('div');
		divClipDelete.className="skyvr-clips-delete-visible-clips";
		divCardHeader.appendChild(divClipDelete);
	}
	divCardClips.appendChild(divCardHeader);

	// content
	var divCardContent = document.createElement('div');
	divCardContent.className="card-content";
	var divCardSearchInfo = document.createElement('div');
	divCardSearchInfo.className="camera-with-clips-info-search";
	divCardContent.appendChild(divCardSearchInfo);
	var divCardWithClips = document.createElement('div');
	divCardWithClips.className="camera-with-clips";
	divCardContent.appendChild(divCardWithClips);
	divCardClips.appendChild(divCardContent);
	
	// search bar
	var divClipsFilterBack = document.createElement('div');
	divClipsFilterBack.className = 'skyvr-clips-filter-back';
	var divClipsFilter = document.createElement('div');
	divClipsFilter.className = 'skyvr-clips-filter';
	divClipsFilterBack.appendChild(divClipsFilter);
	var datalistClipsTitleList = document.createElement('datalist');
	datalistClipsTitleList.id = 'clips_title_list';
	divClipsFilter.appendChild(datalistClipsTitleList);
	var datalistClipsGroupList = document.createElement('datalist');
	datalistClipsGroupList.id = 'clips_title_list';
	divClipsFilter.appendChild(datalistClipsGroupList);
	var filterTable = document.createElement('div');
	filterTable.style = 'display: table; margin-left: auto;margin-right: auto;';
	var filterRow = document.createElement('div');
	filterRow.style = 'display: table-row';
	filterTable.appendChild(filterRow);
	var filterCell = document.createElement('div');
	filterCell.style = 'display: table-cell; text-align: center;'
	var inputTitle = document.createElement('input');
	inputTitle.className='skyvr-clips-filter-title';
	inputTitle.type='text';
	inputTitle.value='';
	inputTitle.list='clips_title_list';
	inputTitle.placeholder=CloudUI.polyglot.t('clip_title');
	inputTitle.onmouseup = "focus();";
	inputTitle.onmousedown = "focus();";
	inputTitle.onmouseover = "focus();";
	filterCell.appendChild(inputTitle);
	var inputGroup = document.createElement('input');
	inputGroup.className='skyvr-clips-filter-group';
	inputGroup.type='text';
	inputGroup.value='';
	inputGroup.list='clips_group_list';
	inputGroup.placeholder=CloudUI.polyglot.t('clip_group');
	inputGroup.onmouseup = "focus();";
	inputGroup.onmousedown = "focus();";
	inputGroup.onmouseover = "focus();";
	filterCell.appendChild(inputGroup);
	filterRow.appendChild(filterCell);
	var filterCell2 = document.createElement('div');
	filterCell2.style = 'display: table-cell; vertical-align: bottom;'
	var divClipsFilterApply = document.createElement('div');
	divClipsFilterApply.className = 'skyvr-clips-filter-apply';
	filterCell2.appendChild(divClipsFilterApply);
	filterRow.appendChild(filterCell2);
	divClipsFilter.appendChild(filterTable);
	// TODO
	divCardClips.appendChild(divClipsFilterBack);
	return divCardClips;
}

CloudUI.on('showsharedclips', function(){
	CloudUI.clips.onlyclips = true;
	CloudUI.clips.shareToken = CloudAPI.pageParams["shared_token"];
	$('.content').html(CloudUI.templates.createPageClips({'sharepage': true}));
	CloudUI.clips.mPlayer = undefined;
	CloudUI.clips.elemId = "videojs-clipshow";
	CloudUI.clips.updateClipList();
});

CloudUI.clips = {};

CloudUI.clips.clipFilter = function(clip){
	var filter_title = $('.skyvr-clips-filter-title').val();
	var filter_group = $('.skyvr-clips-filter-group').val();
	var untitled = CloudUI.polyglot.t('clip_untitled');
	var ungrouped = CloudUI.polyglot.t('clip_ungrouped');
	var title_contains_filter = clip.title.toUpperCase().indexOf(filter_title.toUpperCase()) >= 0;
	var group_contains_filter = clip.group.toUpperCase().indexOf(filter_group.toUpperCase()) >= 0;

	if(filter_title.length > 0 && filter_title != untitled && !title_contains_filter){
		return false;
	}

	if(filter_group.length > 0 && filter_group != ungrouped && !group_contains_filter){
		return false;
	}

	if(filter_title == untitled && clip.title != "" && !title_contains_filter){
		return false;
	}
	
	if(filter_group == ungrouped && clip.group != "" && !group_contains_filter){
		return false;
	}
	return true;
}
	
CloudUI.clips.makeClipTime = function(duration){
	var diff = duration;
	var arr = [];
	var sec = diff % 60;
	if (sec > 0){
		arr.push( sec + " sec")
	}
	diff = (diff - sec)/60;
	var mins = diff % 60;
	if (mins > 0){
		arr.push( mins + " min")
	}
	diff = (diff - mins)/60;
	var hours = diff;
	if (hours > 0){
		arr.push(hours + " h")
	}
	return arr.reverse().join(" ");
}

CloudUI.clips.onlyclips = false;
CloudUI.clips.shareToken = '';

CloudUI.clips.funcClipList = function(){
	if(CloudUI.clips.onlyclips)
		return CloudAPI.storageClipListAnon(CloudUI.clips.shareToken);
	return CloudAPI.storageClipList();
}

CloudUI.clips.funcClipInfo = function(clipid){
	if(CloudUI.clips.onlyclips)
		return CloudAPI.storageClipAnon(clipid, CloudUI.clips.shareToken);
	return CloudAPI.storageClip(clipid);
}

CloudUI.clips.changeClip = function(){
	bClickOnWindow = true;
	var nDiff = 0;
	var page_params = CloudAPI.parsePageParams();
	if($(this).hasClass('skyvr-clipviewer-next')){
		nDiff = 1;
	}else if($(this).hasClass('skyvr-clipviewer-prev')){
		nDiff = -1;
	}
	var clipid = $('.skyvr-dlg-hdr-title').attr('clipid');
	clipid = parseInt(clipid, 10);
	CloudUI.clips.funcClipList().done(function(clips){
		var arr_ids = [];
		for(var i = 0; i < clips.objects.length; i++){
			if(clips.objects[i].status == "done" && CloudUI.clips.clipFilter(clips.objects[i]))
				arr_ids.push(clips.objects[i].id);
		}
		if(arr_ids.length == 0){
			$('.skyvr-dialog-clipshow').hide();
			try{CloudUI.clips.mPlayer.dispose();}catch(e){};
			$('#' + CloudUI.clips.elemId).remove();
			delete page_params['clipid'];
			SkyVR.changeLocationState(page_params);
			return;
		}
		clipid = parseInt(clipid, 10);
		var next_clip = undefined;
		var new_ind = arr_ids.indexOf(clipid);
		if(new_ind == -1 && arr_ids.length > 0){
			next_clip = 0;
		} else{
			new_ind = (new_ind+nDiff + arr_ids.length) % arr_ids.length;
			next_clip = arr_ids[new_ind];
		}
		if(next_clip && next_clip != clipid && next_clip >= 0){
			try{CloudUI.clips.mPlayer.dispose();}catch(e){};
			$('#' + CloudUI.clips.elemId).remove();
			CloudUI.clips.showClipViewer(next_clip);
			page_params['clipid'] = next_clip;
			SkyVR.changeLocationState(page_params);
		}
	});
};

CloudUI.clips.startUpdatingClipList = function(){
	CloudUI.clips.stopUpdatingClipList();
	CloudUI.clips.updateClipListInterval = setInterval(function(){
		CloudUI.clips.funcClipList().done(function(clips){
			CloudUI.clips.updateClipListView(clips);
		});
	},30000);
};

CloudUI.clips.stopUpdatingClipList = function(){
	clearInterval(CloudUI.clips.updateClipListInterval);
};

CloudUI.clips.updateClipList = function(){
	CloudUI.clips.funcClipList().done(function(clips){
		CloudUI.clips.updateClipListView(clips);
	});
};

CloudUI.clips.updateClipTags = function(clips){
	var titles = [];
	var titles_upper = [];
	var groups = [];
	var groups_upper = [];
	for(var i = 0; i < clips.objects.length; i++){
		var clip = clips.objects[i];
		var title = clip.title != '' ? clip.title : CloudUI.polyglot.t('clip_untitled');
		if(titles_upper.indexOf(title.toUpperCase()) < 0){
			titles.push(title);
			titles_upper.push(title.toUpperCase());
		}
		var group = clip.group != '' ? clip.group : CloudUI.polyglot.t('clip_ungrouped');
		if(groups_upper.indexOf(group.toUpperCase()) < 0){
			groups.push(group);
			groups_upper.push(group.toUpperCase());
		}
	}
	titles = titles.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
	groups = groups.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
	$('#clips_title_list').html('');
	for(var i = 0; i < titles.length; i++){
		$('#clips_title_list').append('<option value="' + CloudUI.htmlEscape(titles[i]) + '">' + CloudUI.htmlEscape(titles[i]) + '</option>');
	}
	$('#clips_group_list').html('');
	for(var i = 0; i < groups.length; i++){
		$('#clips_group_list').append('<option value="' + CloudUI.htmlEscape(groups[i]) + '">' + CloudUI.htmlEscape(groups[i]) + '</option>');
	}
	CloudUI.clips.startUpdatingClipList();
}

CloudUI.clips.deleteClip = function(clipid){
	var d = $.Deferred();
	// clip_delete_confirm
	app.createDialogModal({
		'title' : CloudUI.polyglot.t('dialog_title_clip_delete'),
		'content' : CloudUI.polyglot.t('dialog_content_clip_delete'),
		'buttons' : [
			{id: 'clip-delete-yes', text: CloudUI.polyglot.t('clip_delete_yes'), close: false},
			{text: CloudUI.polyglot.t('clip_delete_no'), close: true}
		],
		'beforeClose' : function() {
		}
	});
	app.showDialogModal();
	$('#clip-delete-yes').unbind().click(function(){
		app.destroyDialogModal();
		SkyVR.storageClipDelete(clipid).done(function(){
			$('#clip_' + clipid).remove();
			// updateClipList();
			d.resolve();
		}).fail(function(){
			console.log("Could not delete clip with id == " + clipid);
			d.reject();
		});
	});
	return d;
}

CloudUI.clips.hasAccessAll = function(clip){
	if(CloudUI.isDemo())return true;
	return clip['access'][0] == 'all';
}

CloudUI.clips.hasAccessPlay = function(clip){
	if(CloudUI.isDemo())return true;
	return clip['access'][0] == 'play';
}

CloudUI.clips.makeClipTile = function(clip){
	var clip_duration = CloudUI.clips.makeClipTime(clip.duration);
	var clip_start_time = SkyVR.parseUTCTime(clip.start);
	//clip_start_time = clip_start_time + SkyVR.getOffsetTimezone();
	clip_start_time = SkyVR.convertUTCTimeToStr(clip_start_time);
	var poster = clip.thumb ? clip.thumb.url : "";
	var title = clip.title != "" ? clip.title : CloudUI.polyglot.t('clip_untitled');
	var group = clip.group != "" ? clip.group : CloudUI.polyglot.t('clip_ungrouped');
	var shared = '';
	
	console.log(clip);
	var bAccessAll = CloudUI.clips.hasAccessAll(clip);
	if(cc.shared_clips && bAccessAll){
		shared = '<button class="share-icon ' + (clip.shared ? 'white' : 'blue') + '" shared="' + clip.shared + '" clipid="' + clip.id + '"></button>'
	}
	var delete_clip = '';
	if(bAccessAll){
		delete_clip = '<button class="delete-icon blue" clipid="' + clip.id + '"></button>';
	}

	var clip_tile = ''
		+ '	<div class="video done" style="background-image: url(' + poster + ');" clipid="' + clip.id + '">'
		+ '		<div class="play-anchor" clipid="' + clip.id + '">'
		+ '			<div class="fade"></div>'
		+ '			<div class="icon"></div>'
		+ delete_clip
		+ shared
		+ '		</div>'
		+ '		<span class="clip-duration">' + clip_duration + '</span>'
		+ '	</div>'
		+ '	<div class="video pending">'
		+ '		<div class="load-spinner"></div>'
		+ '	</div>'
		+ '	<div class="video error">'
		+ '		<div class="fade"><div class="text">' + CloudUI.polyglot.t('clip_problem_processing') + '<br/><br/><img src="images/warn_yellow_32x32.svg"></img><br/><br/>'
		+ (clip.error_code ? CloudUI.polyglot.t('clip_error_' + clip.error_code) : '')
		+ '</div></div>'
		+ delete_clip
		+ '	</div>'
		+ '	<div class="clip-info">'
		+ '		<div class="play success">'
		+ '			<div class="title" >' + title + '</div><div class="group-timestamp-panel">'
		+ (cc.clips_tags ? ' <div class="group" >' + group  + '</div>' : '<div class="group"></div>')
		+ '			<div class="timestamp">' + clip_start_time + '</div></div>'
		+ '		</div>'
		+ '</div>';
	return clip_tile;
};

CloudUI.clips.updateClipListViewProcessed = false;
CloudUI.clips.updateClipListView = function(clips){
	if(CloudUI.clips.updateClipListViewProcessed){
		setTimeout(function(){
			updateClipListView(clips);
		},50);
		return;
	}
	CloudUI.clips.stopUpdatingClipList();

	CloudUI.clips.updateClipListViewProcessed = true;
	try{
		CloudUI.clips.updateClipTags(clips);

		// remove clips which has not exists or changed tag			
		var list = $('.camera-with-clips').children();
		for(var i = 0; i < list.length; i++){
			var clipid = parseInt($(list[i]).attr('clipid'));
			var nFound = 0;
			for(var clipi = 0; clipi < clips.objects.length; clipi++){
				var clip = clips.objects[clipi];
				if(CloudUI.clips.clipFilter(clip) && clip.id == clipid){
					nFound = nFound + 1;
				}
			}
			if(nFound == 0 && $('#clip_' + clipid).length > 0){
				$('#clip_' + clipid).remove();
			}
		}
		var prev_id = '';
		var countOfSharedClips = 0;
		var found = 0;
		for(var i = 0; i < clips.objects.length; i++){
			var clip = clips.objects[i];
			if(clip.shared)
				countOfSharedClips++;
			if(CloudUI.clips.clipFilter(clip)){
				found++;
				var clip_el = $('#clip_' + clip.id);
				if(clip_el.length == 0){
					// add clip to list
					var clip_tile = ''
						+ '<div class="clip tile ' + clip.status + '" id="clip_' + clip.id + '" clipid="' + clip.id + '">'
						+ CloudUI.clips.makeClipTile(clip)
						+ '</div>' + "\n";
					// $('.camera-with-clips').append(clip_tile);
					if (prev_id == '')
						$('.camera-with-clips').prepend(clip_tile);
					else{
						if($("#clip_" + prev_id).length == 0){
							$('.camera-with-clips').append(clip_tile);
						}else{
							$("#clip_" + prev_id).after($(clip_tile));
						}
						
					}
				}else{
					var status = '';
					status = clip_el.hasClass('pending') ? 'pending' : status;
					status = clip_el.hasClass('done') ? 'done' : status;
					status = clip_el.hasClass('error') ? 'error' : status;
					title = clip_el.find('.title').text();
					group = clip_el.find('.group').text();
					clip.title = clip.title == "" ? CloudUI.polyglot.t('clip_untitled') : clip.title;
					clip.group = clip.group == "" ? CloudUI.polyglot.t('clip_ungrouped') : clip.group;
					if (status != clip.status || clip.title != title || (cc.clips_tags && clip.group != group)){
						clip_el.removeClass(status);
						clip_el.addClass(clip.status);
						clip_el.html(CloudUI.clips.makeClipTile(clip));
					}
				}
				prev_id = clip.id;
			}
		}
		
		var search_request_title = '"' + $('.skyvr-clips-filter-title').val() + '"';
		var search_request_group = '"' + $('.skyvr-clips-filter-group').val() + '"';
		var searches = [];
		if($('.skyvr-clips-filter-title').val() != ''){
			searches.push(CloudUI.polyglot.t("clip_title") + ' "' + $('.skyvr-clips-filter-title').val() + '"');
		}
		if($('.skyvr-clips-filter-group').val() != ''){
			searches.push(CloudUI.polyglot.t("clip_group") + ' "' + $('.skyvr-clips-filter-group').val() + '"');
		}
		var msg = "";
		if(searches.length > 0){
			msg += CloudUI.polyglot.t("search_request").replace('%S%', searches.join(", ")) + ". ";
		}

		
		if(found == 0){
			msg += CloudUI.polyglot.t("clips_did_not_found");
			$('.camera-with-clips-info-search').text(msg);
		}else if(found == 1){
			msg += CloudUI.polyglot.t("clips_one_found");
			$('.camera-with-clips-info-search').text(msg);
		}else if(found > 1 && found < 5 ){
			msg += CloudUI.polyglot.t("clips_2_3_4_found").replace('%N%', found);
			$('.camera-with-clips-info-search').text(msg);
		}else{
			msg += CloudUI.polyglot.t("clips_n_found").replace('%N%', found);
			$('.camera-with-clips-info-search').text(msg);
		}

		if($('.delete-icon.white').length > 0){
			$('.skyvr-clips-delete-visible-clips').addClass('active');
		}else{
			$('.skyvr-clips-delete-visible-clips').removeClass('active');
		}
		
		if($('.share-icon.white').length > 0){
			$('.skyvr-clips-shared-links').addClass('active');
		}else{
			$('.skyvr-clips-shared-links').removeClass('active');
		}

		$('.video.done').unbind().click(function(e){
			e.stopPropagation();
			var clipid = $(this).attr('clipid');
			CloudUI.clips.showClipViewer(clipid);
		});

		$('.delete-icon').unbind().click(function(e){
			e.stopPropagation();
			var el = $(this);
			var clipid = el.attr('clipid');
			if(el.hasClass('blue')){
				el.removeClass('blue');
				el.addClass('white');
			}else{
				el.removeClass('white');
				el.addClass('blue');
			}
			
			if($('.delete-icon.white').length > 0){
				$('.skyvr-clips-delete-visible-clips').addClass('active');
			}else{
				$('.skyvr-clips-delete-visible-clips').removeClass('active');
			}
			// deleteClip(clipid);
		});
		
		$('.video .share-icon').unbind().click(function(e){
			e.stopPropagation();
			var el = $(this);
			var clipid = el.attr('clipid');
			if(el.hasClass('blue')){
				el.removeClass('blue');
				el.addClass('white');
			}else{
				el.removeClass('white');
				el.addClass('blue');
			}
			if($('.share-icon.white').length > 0){
				$('.skyvr-clips-shared-links').addClass('active');
			}else{
				$('.skyvr-clips-shared-links').removeClass('active');
			}
		});
		
		$('.skyvr-clips-delete-visible-clips').unbind().click(function(){
			if(!$(this).hasClass('active')){
				return;
			}
			
			var els = $('.delete-icon.white');
			var clips_to_delete = [];
			for(var i = 0; i < els.length; i++){
				clips_to_delete.push($(els[i]).attr('clipid'));
			}
			// clip_delete_confirm
			app.createDialogModal({
				'title' : CloudUI.polyglot.t('dialog_title_clips_delete'),
				'content' : CloudUI.polyglot.t('dialog_content_clips_delete').replace('%N%', clips_to_delete.length),
				'buttons' : [
					{id: 'clips-delete-yes', text: CloudUI.polyglot.t('clips_delete_yes'), close: false},
					{text: CloudUI.polyglot.t('clips_delete_no'), close: true}
				],
				'beforeClose' : function() {
				}
			});
			app.showDialogModal();
			$('#clips-delete-yes').unbind().click(function(){
				app.destroyDialogModal();
				function deleteClip_silent(clipid){
					var d = $.Deferred();
					SkyVR.storageClipDelete(clipid).done(function(){
						$('#clip_' + clipid).remove();
						// updateClipList();
						d.resolve();
					}).fail(function(e){
						if(e.status == 404){
							console.log("Alredy removed")
							$('#clip_' + clipid).remove();
							d.resolve();
						}else{
							console.error("Could not delete clip with id == " + clipid);
							d.reject();
						}
					});
					return d;
				}
				
				var clips_del = clips_to_delete.length;
				var indx = 0;

				function delete_next(){
					if(indx < clips_del){
						app.showProcessing(CloudUI.polyglot.t('dialog_title_clips_delete'),(100*indx/clips_del).toFixed(0) + '%');
						var clipid = clips_to_delete[indx];
						indx = indx + 1;
						deleteClip_silent(clipid).done(delete_next).fail(delete_next);
					}else{
						app.showProcessing(CloudUI.polyglot.t('dialog_title_clips_delete'),(100*indx/clips_del).toFixed(0) + '%');
						setTimeout(function(){
							if($('.delete-icon.white').length > 0){
								$('.skyvr-clips-delete-visible-clips').addClass('active');
							}else{
								$('.skyvr-clips-delete-visible-clips').removeClass('active');
							}
							app.closeProcessing();	
						},1000);
					}
				}
				delete_next();
			});
		});

		$('.skyvr-clips-filter-title').unbind().keyup(function(event) {
			// console.log('keyup', event);
			if(event.which == 13) {
				$('.skyvr-clips-filter-back').css({left: ''});
				$('.skyvr-clips-filter-open').removeClass('inactive');
				CloudUI.clips.updateClipList();
			}
			return false;
		}).click(function(e){
			return false;
		});
		
		$('.skyvr-clips-filter-group').unbind().keyup(function(event) {
			if(event.which == 13) {
				$('.skyvr-clips-filter-back').css({left: ''});
				$('.skyvr-clips-filter-open').removeClass('inactive');
				CloudUI.clips.updateClipList();
			}
			return false;
		}).click(function(e){
			return false;
		});

		$('.skyvr-clips-filter-apply').unbind().click(function(event) {
			$('.skyvr-clips-filter-back').css({left: ''});
			$('.skyvr-clips-filter-open').removeClass('inactive');
			CloudUI.clips.updateClipList();
			return false;
		});
		
		$('.skyvr-clips-filter').unbind().click(function(event) {
			return false;
		});
		
		$('.skyvr-clips-filter-back').unbind().click(function(){
			$('.skyvr-clips-filter-open').removeClass('inactive');
			$('.skyvr-clips-filter-back').css({left: ''});
			return false;
		});

		$('.skyvr-clips-filter-open').unbind().click(function(){
			if($('.skyvr-clips-filter-open').hasClass('inactive')){
				$('.skyvr-clips-filter-open').removeClass('inactive');
				$('.skyvr-clips-filter-back').css({left: ''});
			}else{
				$('.skyvr-clips-filter-open').addClass('inactive');
				$('.skyvr-clips-filter-back').css({left: '0px'});
				$('.skyvr-clips-filter-title').focus();
			}
		});

		$('.skyvr-clips-shared-links').unbind().click(function(){
			var shared_clips = $('.share-icon.white');
			if(shared_clips.length > 0){
				var share_data = {};
				var clips_ids = [];
				for(var i = 0; i < shared_clips.length; i++){
					clips_ids.push($(shared_clips[i]).attr('clipid'));
				}
				CloudUI.clips.makeLinkShare(clips_ids).done(function(url){
					app.createDialogModal({
						'title' : CloudUI.polyglot.t('dialog_title_sharing'),
						'content' : CloudUI.polyglot.t('dialog_content_sharing') + shared_clips.length + '</br>'
							+ '<input readonly text="" id="copy_link_url" value="' + url + '">'
							+ '<font color="red" id="copy_link_error"></font>',
						'buttons' : [
							{id:'copy_link', text: CloudUI.polyglot.t('copy_link'), close: false},
							{text: CloudUI.polyglot.t('dialog_close'), close: true},
						],
						'beforeClose' : function(){
						}
					});
					$('#copy_link').unbind().click(function(){
						document.getElementById('copy_link_url').select();
						var successful = false;
						try{var successful = document.execCommand('copy');} catch (err) {}
						if(!successful){
							$('#copy_link_error').text(CloudUI.polyglot.t('dialog_content_copy_link_failed' + (CloudUI.osname() == "mac" ? '_mac' : '')));
						}
					});
					app.showDialogModal();
				}).fail(function(){
					alert("Problem with clip/share");
				});
			}
		});
		
	}finally{
		CloudUI.clips.updateClipListViewProcessed = false;
		CloudUI.clips.startUpdatingClipList();
	}
}


CloudUI.clips.updateClipViewer = function(clip){
	if(cc.shared_clips && CloudUI.clips.hasAccessAll(clip)){
		$('.skyvr-clipviewer-share').show();
	}else{
		$('.skyvr-clipviewer-share').hide();
	}

	$('.skyvr-clipviewer-download').unbind().bind('click', function(){
		var win=window.open(clip.url, '_blank'); win.focus();
	});
	
	$('.skyvr-dlg-hdr-title').attr('clipid', clip.id);
	
	$('#skyvr-clipviewer-title').val(clip.title);
	$('#skyvr-clipviewer-title').attr('placeholder', CloudUI.polyglot.t('clip_untitled'));
	var title = clip.title != "" ? clip.title : CloudUI.polyglot.t('clip_untitled');
	if(cc.clips_tags){
		var group = clip.group != "" ? clip.group : CloudUI.polyglot.t('clip_ungrouped');
		$('#skyvr-clipviewer-groupview').text(group + '/' + title);
	}else{
		$('#skyvr-clipviewer-groupview').text(title);
	}
	$('#skyvr-clipviewer-group').val(clip.group);
	$('#skyvr-clipviewer-group').attr('placeholder', CloudUI.polyglot.t('clip_ungrouped'));
};

CloudUI.clips.updateClipList = function(){
	CloudUI.clips.funcClipList().done(function(clips){
		CloudUI.clips.updateClipListView(clips);
	});
};
CloudUI.clips.elemId = '';
CloudUI.clips.mPlayer = undefined;
CloudUI.clips.makeLinkShare = function(clips_ids){
	var d = $.Deferred();
	CloudAPI.accountShare({'clips':clips_ids}).done(function(shared_token){
		console.log(shared_token);
		var token = shared_token['token'];
		
		var url = window.location.protocol + '//' + window.location.host + window.location.pathname 
			+ '?vendor=' + cc.vendor 
			+ '&svcp_host=' + encodeURIComponent(CloudAPI.store.svcp_host())
			+ '&shared_token=' + token;
		d.resolve(url);
	}).fail(function(){
		d.reject();
	});
	return d;
}

CloudUI.clips.showClipViewer = function(clipid){
	CloudUI.clips.funcClipInfo(clipid).done(function(clip){
		window['currentPage'] = 'clip';
		console.log(clip);
		var page_params = SkyVR.parsePageParams();
		page_params['clipid'] = clip.id;
		SkyVR.changeLocationState(page_params);

		videojs.options.flash.swf = CloudUI.getPathToPlayerSwf();
		$('#skyvr-dialog-clipshow-content').html(
			'<video class="video-js vjs-default-skin" controls="true" autoplay="true" preload="auto" controls="true" id="' + CloudUI.clips.elemId + '">'
			+ '<source src="' + clip.url + '" type="video/mp4" />'
			+ '</video>'
		);

		CloudUI.clips.updateClipViewer(clip);

		if(CloudUI.clips.onlyclips){
			$('#skyvr-clipviewer-group').hide();
			$('#skyvr-clipviewer-title').hide();
			$('.skyvr-clipshow-save').hide();
			$('.skyvr-clipviewer-download').hide();
			$('.skyvr-clipshow-delete').hide();
			$('.skyvr-clipshow-window .skyvr-dlg-ftr').css({'height': '10px'});
		}
		
		if(!cc.clips_tags){
			$('#skyvr-clipviewer-group').hide();
		}

		$('.skyvr-clipviewer-next').unbind().bind('click', CloudUI.clips.changeClip);
		$('.skyvr-clipviewer-prev').unbind().bind('click', CloudUI.clips.changeClip);
		$('.skyvr-clipshow-window').unbind().bind('click', function(){
			console.log("click window");
			bClickOnWindow = true;
		});

		$('.skyvr-clipshow-cell').unbind().bind('click', function(){
			console.log("click cell");
			if(bClickOnWindow){
				bClickOnWindow = false;
				return;
			}
			$('.skyvr-dialog-clipshow').hide();
			try{CloudUI.clips.mPlayer.dispose();}catch(e){};
			$('#' + CloudUI.clips.elemId).remove();
			var page_params = SkyVR.parsePageParams();
			delete page_params['clipid'];
			SkyVR.changeLocationState(page_params);
		});

		$('.skyvr-dialog-clipshow').show();
		CloudUI.clips.mPlayer = videojs(CloudUI.clips.elemId);

		// console.log("make test thumbnails");
		var obj = {};
		// hardcode
		if(clipid == 3)
			obj = {"url": "clip_0003.mp4_thumbnails.jpg", "width": 120, "thumbnails": {"0": {"y": 0, "x": 0}, "2": {"y": 0, "x": 120}, "4": {"y": 0, "x": 240}, "6": {"y": 0, "x": 360}, "8": {"y": 0, "x": 480}, "10": {"y": 0, "x": 600}, "12": {"y": 0, "x": 720}, "14": {"y": 0, "x": 840}, "16": {"y": 0, "x": 960}, "18": {"y": 0, "x": 1080}, "20": {"y": 0, "x": 1200}, "22": {"y": 0, "x": 1320}, "24": {"y": 0, "x": 1440}, "26": {"y": 0, "x": 1560}, "28": {"y": 90, "x": 0}, "30": {"y": 90, "x": 120}, "32": {"y": 90, "x": 240}, "34": {"y": 90, "x": 360}, "36": {"y": 90, "x": 480}, "38": {"y": 90, "x": 600}, "40": {"y": 90, "x": 720}, "42": {"y": 90, "x": 840}, "44": {"y": 90, "x": 960}, "46": {"y": 90, "x": 1080}, "48": {"y": 90, "x": 1200}, "50": {"y": 90, "x": 1320}, "52": {"y": 90, "x": 1440}, "54": {"y": 90, "x": 1560}, "56": {"y": 180, "x": 0}, "58": {"y": 180, "x": 120}}, "height": 90};
		else if (clipid == 8)
			obj = {"url": "clip_0008.mp4_thumbnails.jpg", "width": 120, "thumbnails": {"0": {"y": 0, "x": 0}, "2": {"y": 0, "x": 120}, "4": {"y": 0, "x": 240}, "6": {"y": 0, "x": 360}, "8": {"y": 0, "x": 480}, "10": {"y": 0, "x": 600}, "12": {"y": 0, "x": 720}, "14": {"y": 0, "x": 840}, "16": {"y": 0, "x": 960}, "18": {"y": 0, "x": 1080}, "20": {"y": 0, "x": 1200}, "22": {"y": 0, "x": 1320}, "24": {"y": 0, "x": 1440}, "26": {"y": 0, "x": 1560}, "28": {"y": 90, "x": 0}, "30": {"y": 90, "x": 120}, "32": {"y": 90, "x": 240}, "34": {"y": 90, "x": 360}, "36": {"y": 90, "x": 480}, "38": {"y": 90, "x": 600}, "40": {"y": 90, "x": 720}, "42": {"y": 90, "x": 840}, "44": {"y": 90, "x": 960}, "46": {"y": 90, "x": 1080}, "48": {"y": 90, "x": 1200}, "50": {"y": 90, "x": 1320}, "52": {"y": 90, "x": 1440}, "54": {"y": 90, "x": 1560}, "56": {"y": 180, "x": 0}, "58": {"y": 180, "x": 120}}, "height": 90};
		else if (clipid == 20)
			obj = {"url": "clip_0020.mp4_thumbnails.jpg", "width": 120, "thumbnails": {"0": {"y": 0, "x": 0}, "2": {"y": 0, "x": 120}, "4": {"y": 0, "x": 240}, "6": {"y": 0, "x": 360}, "8": {"y": 0, "x": 480}, "10": {"y": 0, "x": 600}, "12": {"y": 0, "x": 720}, "14": {"y": 0, "x": 840}, "16": {"y": 0, "x": 960}, "18": {"y": 0, "x": 1080}, "20": {"y": 0, "x": 1200}, "22": {"y": 0, "x": 1320}, "24": {"y": 0, "x": 1440}, "26": {"y": 0, "x": 1560}, "28": {"y": 90, "x": 0}, "30": {"y": 90, "x": 120}, "32": {"y": 90, "x": 240}, "34": {"y": 90, "x": 360}, "36": {"y": 90, "x": 480}, "38": {"y": 90, "x": 600}, "40": {"y": 90, "x": 720}, "42": {"y": 90, "x": 840}, "44": {"y": 90, "x": 960}, "46": {"y": 90, "x": 1080}, "48": {"y": 90, "x": 1200}, "50": {"y": 90, "x": 1320}, "52": {"y": 90, "x": 1440}, "54": {"y": 90, "x": 1560}, "56": {"y": 180, "x": 0}, "58": {"y": 180, "x": 120}}, "height": 90};
		var new_thumbnails = {};
		for(var t in obj.thumbnails){
			var ind=parseInt(t,10);
			new_thumbnails[ind]={style:{}};
			new_thumbnails[ind].style['background-image'] = 'url("' + obj.url + '")';
			new_thumbnails[ind].style['background-repeat'] = 'no-repeat';
			new_thumbnails[ind].style['width'] = obj.width + 'px';
			new_thumbnails[ind].style['height'] = obj.height + 'px';
			new_thumbnails[ind].style['background-position'] = (-1*obj.thumbnails[t].x) + "px " + (-1*obj.thumbnails[t].y) + "px";
		}
		CloudUI.clips.mPlayer.thumbnails(new_thumbnails);

		if(cc.shared_clips){
			$('.skyvr-clipviewer-share').unbind().bind('click', function(){
				
				CloudUI.clips.makeLinkShare([clipid]).done(function(url){
					app.createDialogModal({
						'title' : CloudUI.polyglot.t('dialog_title_clip_shared'),
						'content' : CloudUI.polyglot.t('dialog_content_clip_shared') + clip.title + '</br>'
							+ '<input readonly text="" id="copy_link_url" value="' + url + '">'
							+ '<font color="red" id="copy_link_error"></font>',
						'buttons':[
							{id:'copy_link', text: CloudUI.polyglot.t('copy_link'), close: false},
							{text: CloudUI.polyglot.t('dialog_close'), close: true},
						],
						'beforeClose' : function() {
						}
					});
					$('#copy_link').unbind().click(function(){
						document.getElementById('copy_link_url').select();
						var successful = false;
						try{var successful = document.execCommand('copy');} catch (err) {}
						if(!successful){
							$('#copy_link_error').text(CloudUI.polyglot.t('dialog_content_copy_link_failed' + (CloudUI.osname() == "mac" ? '_mac' : '')));
						}
					});
					
					// close player dialog
					$('.skyvr-dialog-clipshow').hide();
					try{CloudUI.clips.mPlayer.dispose();}catch(e){};
					$('#' + CloudUI.clips.elemId).remove();

					app.showDialogModal();

				}).fail(function(){
					alert("Problem with clip/share");
				});
			});
		}
		// $('#videojs-clipshow').addClass('vjs-has-started');
		$('.skyvr-clipshow-save').text(CloudUI.polyglot.t("Save"));
		$('.skyvr-clipshow-save').unbind().bind('click', function(){
			var new_title = $('.skyvr-clipviewer-title').val();
			var new_group = $('.skyvr-clipshow-tag').val();
			SkyVR.storageClipUpdate(clipid, {title: new_title, group: new_group}).done(function(clip){
				CloudUI.clips.updateClipViewer(clip);
				// $('.skyvr-clipshow-titleview').text(clip.title);
				$('.skyvr-clipviewer-title').val(clip.title);
				if($('.skyvr-clips-filter-title').val().length > 0)
					$('.skyvr-clips-filter-title').val(CloudUI.htmlEscape(clip.title));
				CloudUI.clips.updateClipList();
			});
		});

		$('.skyvr-clipshow-delete').unbind().bind('click', function(){
			CloudUI.clips.deleteClip(clipid).done(function(){
				$('.skyvr-dialog-clipshow').hide();
				try{CloudUI.clips.mPlayer.dispose();}catch(e){};
				$('#' + CloudUI.clips.elemId).remove();
			});
		});

		$('#skyvr-clipviewer-close').unbind().bind('click', function(){
			$('.skyvr-dialog-clipshow').hide();
			try{CloudUI.clips.mPlayer.dispose();}catch(e){};
			$('#' + CloudUI.clips.elemId).remove();
			var page_params = SkyVR.parsePageParams();
			delete page_params['clipid'];
			SkyVR.changeLocationState(page_params);
			window['currentPage'] = 'clips';
		});
	}).fail(function(){
		alert("TODO Not found clip");
		var page_params = SkyVR.parsePageParams();
		delete page_params['clipid'];
		CloudAPI.changeLocationState(page_params);
	});
}
