/* CloudCameraList plugin 3x2 implementation */

window.CloudCameraList = window.CloudCameraList || {};
window.CloudCameraList.cache = window.CloudCameraList.cache || {}
window.CloudCameraList.config = window.CloudCameraList.config || {}

CloudCameraList.previewStatistics = {}
        
CloudCameraList.initialize = function(element){
	$(element).html( ''
		+ '	<div class="camlist3x2-loader">'
		+ '		<div class="throbber-wrapper"><span class="spinner gray" style="margin: 0px auto; transition: transform 0ms;"></div>'
		+ '	</div>'
		+ '	<div class="camlist3x2-nocameras">'
		+ '		<font size="6">' + CloudUI.tr('no_cameras') + '</font>'
		+ '	</div>'
		+ '	<div class="camlist3x2-table">'
		+ '		<div class="camlist3x2-row">'
		+ '			<div class="camlist3x2-cell left"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_00"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_01"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_02"></div>'
		+ '			<div class="camlist3x2-cell right"></div>'
		+ '		</div>'
		+ '		<div class="camlist3x2-row">'
		+ '			<div class="camlist3x2-cell left"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_10"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_11"></div>'
		+ '			<div class="camlist3x2-cell" id="t3x2_12"></div>'
		+ '			<div class="camlist3x2-cell right"></div>'
		+ '		</div>'
		+ '	</div>'
		+ '	<div class="camlist3x2-pager"></div>'
	);
	$(element).find('.camlist3x2-nocameras').hide();
	$(element).find('.camlist3x2-table').hide();
	$(element).find('.camlist3x2-loader').show();
	
	CloudCameraList.container = $(element);

	// this.container.attr('id','transition_disabled');
	CloudCameraList.slides = new Array();
	CloudCameraList.pager = new Array();
	CloudCameraList.cameras = new Array();
	CloudCameraList.camerasRendered = new Array();
	CloudCameraList.currentPage = 0;
	$(window).on('resize',CloudCameraList.resizeHandler);
	// try render and start updating list
	CloudCameraList.render();
	CloudCameraList.startUpdatingCamList();
}

CloudCameraList.dispose = function(){
	CloudCameraList.stopUpdatingCamList();
	CloudCameraList.slides = new Array();
	CloudCameraList.pager = new Array();
	CloudCameraList.clearSlides();
	if(CloudCameraList.container){
		CloudCameraList.container.html('');
	}
}

CloudCameraList.showLoader = function(){
	CloudCameraList.container.find('.camlist3x2-loader').show();
	CloudCameraList.container.find('.camlist3x2-table').hide();
	CloudCameraList.container.find('.camlist3x2-pager').hide();
	CloudCameraList.container.find('.camlist3x2-nocameras').hide();
}

CloudCameraList.hideLoader = function(){
	CloudCameraList.container.find('.camlist3x2-loader').hide();
	if(CloudCameraList.cameras.length == 0){
		CloudCameraList.container.find('.camlist3x2-nocameras').show();
	}else{
		CloudCameraList.container.find('.camlist3x2-table').show();
		CloudCameraList.container.find('.camlist3x2-pager').show();
	}
}

CloudCameraList.render = function(){
	console.log('[SLIDER] render');
	CloudCameraList.showLoader();

	CloudAPI.camerasList({'detail': 'detail'}).done(function(response){
		if(cc.sort_cameralist){
			console.log('sort_cameralist');
			response.objects.sort(cc.sort_cameralist)
		}
		CloudCameraList.cameras = response.objects;
		CloudCameraList.hideLoader();
		CloudCameraList.clearSlides();
		CloudCameraList.drawSlides();
	}).fail(function(r){
		console.error(r);
		if(r.status && r.status == 401){
			CloudCameraList.unauthorizedFail();
		}
	});
}

CloudCameraList.drawPager = function(){
	var len = CloudCameraList.cameras.length;
	var t = len % 6;
	var pages = (len - t)/6;
	pages += t > 0 ? 1 : 0;
	var cntr = CloudCameraList.container.find('.camlist3x2-pager');
	cntr.html('');
	if(pages > 0){
		for(var i=0; i < pages; i++){
			el = $('<i class="page-icon" ></i>');
			el.attr({'page': i});
			if (i == CloudCameraList.currentPage) {
				el.addClass('active');
			}
			cntr.append(el);
		}
	}
	CloudCameraList.container.find('.camlist3x2-pager .page-icon').unbind().bind('click', function(){
		var page = $(this).attr('page');
		CloudCameraList.currentPage = page;
		CloudCameraList.clearSlides();
		CloudCameraList.drawSlides();
	});
}

CloudCameraList.initSlide = function(elem, caminfo){
	elem.attr({'camid': caminfo.id});
	var camname = caminfo.name != "" ? caminfo.name : CloudUI.tr("Noname");
	
	elem.html(''
		+ '<div class="camlist3x2-slide">'
		+ '		<div class="camlist3x2-camtitle">'
		+ '			<div class="camlist3x2-camname">' + camname + '</div>'
		+ '			<div class="camlist3x2-rec-status ' + caminfo.rec_status + '"></div>'
		+ '		</div>'
		+ '		<div class="camlist3x2-preview ' + caminfo.status + '">'
		+ '			<img src="">' // preview
		+ '		</div>'
		+ '</div>'
	);
	elem.find('img').attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AUNCR061qtorgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXY/z//z8DAwMDAxMDFAAAMAYDAZWbBRUAAAAASUVORK5CYII%3D');
	CloudCameraList.updatePreview(elem, caminfo);

	elem.find('img').unbind().bind('click', function(){
		CloudAPI.setCameraID(caminfo.id);
		console.log('selection camera ', CloudAPI.cache.cameraInfo());	
		CloudUI.event.trigger(CloudUI.event.CAMERA_SELECTED, [CloudAPI.cache.cameraInfo() || caminfo]);	
	});
}

CloudCameraList.updateSlide = function(elem, caminfo){
	$(elem).find('.camlist3x2-rec-status')
		.removeClass('on')
		.removeClass('off')
		.addClass('on');
	$(elem).find('.camlist3x2-camname').html(caminfo.name);
	CloudCameraList.updatePreview(elem, caminfo);
}

CloudCameraList.clearSlides = function(){
	for(var i = 0; i < 6; i++){
		var x = i%3;
		var y = (i - x)/3;
		var id = 't3x2_' + y + '' + x;
		$('#' + id).html('');
		$('#' + id).attr({'camid': ''})
	}
}

CloudCameraList.drawSlides = function (){
	var min = CloudCameraList.currentPage*6;
	var max = (CloudCameraList.currentPage+1)*6;
	max = max > CloudCameraList.cameras.length ? CloudCameraList.cameras.length : max;

	for(var i = min; i < max; i++){
		var x = (i - CloudCameraList.currentPage*6)%3;
		var y = (i - CloudCameraList.currentPage*6 - x)/3;
		CloudCameraList.initSlide($('#t3x2_' + y + '' + x), CloudCameraList.cameras[i]);
	}
	CloudCameraList.resizeHandler();
	// TODO no_cameras
	// CloudUI.polyglot.t("no_cameras")
	CloudCameraList.drawPager();
	
}

CloudCameraList.resizeHandler = function() {
	var h = $('.camlist3x2-table').height();
	if(h > 500){
		$('.camlist3x2-row').attr({'height' : '250px'});
	}else{
		$('.camlist3x2-row').attr({'height' : ''});
	}
	
	var w = $('.camlist3x2-preview').width();
	var h = Math.round((135/180)*w);
	$('.camlist3x2-preview').height(h);
	$('.camlist3x2-preview img').height(h);
	var row_height = $($('.camlist3x2-row')[0]).height();
	$($('.camlist3x2-row')[1]).height(row_height);
	return;
}

CloudCameraList.unauthorizedFail = function(){
	CloudCameraList.hideThrobber();
	CloudCameraList.container.css('width','220px').find('.slider_wrapper').html('').append(''
		+ CloudUI.polyglot.t("Unauthorized")
	);
}

CloudCameraList.updateCamlist = function(){
	console.log("Update camera list");
	CloudCameraList.stopUpdatingCamList();
	CloudAPI.camerasList({'detail': 'detail'}).done(function(response){
		if(response.objects){
			if(cc.sort_cameralist){
				response.objects.sort(cc.sort_cameralist)
			}

			// detect diff
			var old_ids = [];
			for(var i = 0; i < CloudCameraList.cameras.length; i++){
				old_ids.push(CloudCameraList.cameras[i].id);
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
				CloudCameraList.cameras = response.objects;
				CloudCameraList.clearSlides();
				CloudCameraList.drawSlides();
			}else{
				for(var i = 0; i < CloudCameraList.cameras.length; i++){
					var camFromCloud = response.objects[i];
					var camFromCache = CloudCameraList.cameras[i];
					var needUpdate = false;
					if(camFromCloud.id == camFromCache.id){
						if(camFromCloud.status != camFromCache.status){
							console.log("Changed status");
							CloudCameraList.cameras[i].status = camFromCloud.status;
							needUpdate = true;
						}
						if(camFromCloud.name != camFromCache.name){
							console.log("Changed name");
							CloudCameraList.cameras[i].name = camFromCloud.name;
							needUpdate = true;
						}
						if(camFromCloud.rec_status != camFromCache.rec_status){
							console.log("Changed rec_status");
							CloudCameraList.cameras[i].rec_status = camFromCloud.rec_status;
							needUpdate = true;
						}
						var elem = $('.camlist3x2-cell[camid=' + camFromCloud.id + ']');
						if(elem.length > 0){
							if(needUpdate){
								CloudCameraList.updateSlide(elem, camFromCloud);
							}else{
								CloudCameraList.updatePreview(elem, camFromCloud);
							}
						}
					}else{
						console.error("Wrong sorting");
					}
				}
			}
			CloudCameraList.startUpdatingCamList();
		}
	}).fail(function(r){
		console.error(r);
		if(r.status && r.status == 401){
			CloudCameraList.unauthorizedFail();
		}
	});
}

CloudCameraList.setPreview = function(elem, caminfo, url, lastTimeUpdated, tryagain){
	CloudCameraList.previewStatistics[caminfo.id] = {
		lastTimeUpdated: lastTimeUpdated,
		url: url
	}
	var camid = $(elem).attr('camid');
	console.log("camid = " + camid + " camid2= " + caminfo.id);
	if(camid != caminfo.id){
		console.error("Different camera");
		return;
	}
	$(elem).find('.camlist3x2-preview img').unbind('error').bind('error', function(){
		// some problem with cloud or preview incorrect
		if(tryagain > 3){
			console.error("Error on update preview, stop tries");
			return;
		}
		console.error("Error on update preview, try again after 1 sec");
		setTimeout(function(){
			CloudCameraList.updatePreview(elem, caminfo, tryagain++);	
		}, 1000);
	}).attr({
		"src": url
	});
}

CloudCameraList.updatePreview = function(elem, caminfo, tryagain){
	console.log("[SLIDER] update preview begin " + caminfo.id);
	tryagain = tryagain || 0;
	if(caminfo.status == "active"){
		/*if(!CloudAPI.hasAccessCameraPreview(caminfo.id)) {
			console.warn("Do not have permission to access updating preview");
			return false;
		}*/
		var stats = CloudCameraList.previewStatistics[caminfo.id];
		var lastTimeUpdated = 0;
		var lastTime2 = new Date().getTime();
		if(stats){
			lastTimeUpdated = stats.lastTimeUpdated;
		}
		if(lastTime2 - lastTimeUpdated < 30000){
			CloudCameraList.setPreview(elem, caminfo, stats.url, lastTimeUpdated, tryagain);
			return;
		}else{
			CloudAPI.cameraUpdatePreview(caminfo.id); // start update preview
			CloudAPI.cameraPreview(caminfo.id).done(function(response){
				lastTimeUpdated = new Date(response.time).getTime();
				CloudCameraList.setPreview(elem, caminfo, response.url, lastTimeUpdated, tryagain)
			}).fail(function(xhr, ajaxOptions, thrownError){
				console.error("[SLIDER] preview fail " + xhr.status);
				if(xhr.status=404){
					if(CloudAPI.hasAccessCameraUpdatePreview(caminfo.id)){
						CloudAPI.cameraUpdatePreview(caminfo.id);
					}
				}
				if(xhr.status == 0){
					CloudCameraList.updatePreview(elem, caminfo, tryagain);
				}
			});
		}
	}else{
		$(elem).find('.camlist3x2-preview')
			.removeClass('active')
			.removeClass('inactive')
			.removeClass('inactive_by_scheduler')
			.removeClass('offline')
			.removeClass('unauthorized')
			.addClass(caminfo.status);
	}
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
	// TODO start update preview
}
