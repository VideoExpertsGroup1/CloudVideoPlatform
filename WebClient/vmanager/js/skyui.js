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
	
	this.lang = function(){
		return SkyVR.lang();
	};

	this.polyglot = new function(){
		this.t = function(s){
			if(this['translates']){
				if(this.translates[s])
					return this.translates[s];
				else
					console.warn("Not found translate for '" + s + "'");
			}
			if(window['app']){ // deprecated
				return app.polyglot.t(s);
			}
			return s;
		}
	}();

	this.loadTranslates = function(path){
		var d = $.Deferred();
		$.ajax({
			url: path + 'lang/' + SkyVR.lang() + ".json",
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
	this.osname = function(){
		var os="unknown";
		if (navigator.appVersion.indexOf("Win")!=-1) os="win";
		if (navigator.appVersion.indexOf("Mac")!=-1) os="mac";
		if (navigator.appVersion.indexOf("X11")!=-1) os="unix";
		if (navigator.appVersion.indexOf("Linux")!=-1) os="linux";
		return os;
	};
	this.updateCamlist = function(slider, app){
		app.stopUpdatingCamList();
		SkyVR.camerasList().done(function(response){
			if(response.objects){
				// detect diff
				var old_ids = [];
				for(var i = 0; i < slider.structure.length; i++){
					old_ids.push(slider.structure[i].id);
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
					slider.dispose();
					// slider.currentPosition
					slider.render(app);
					app.startUpdatingCamList();
				}else{
					slider.structure = response.objects;
					slider.updatePreview(app);
				}
			}
		});
	}
	this.triggers = {};
	this.trigger = function(eventname, app, event){ // app, event - temporary variables
		if(CloudUI.triggers[eventname]){
			setTimeout(function(){
				CloudUI.triggers[eventname](app, event);
			},1);
		}
	}
	this.on = function(eventname, func){
		this.triggers[eventname] = func;
	};
	
	this.off = function(eventname){
		if(this.triggers[eventname]){
			delete this.triggers[eventname];
		}
	};
}();

// for feature
window.CloudUI = window.SkyUI;

CloudUI.htmlEscape = function(str){
	return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

CloudUI.on('showcameranotfound', function(app, event){
	$('.skyvr-cell-content').html('<div class="camera_not_found">' + CloudUI.polyglot.t("camera_not_found") + '</div>');
});

CloudUI.isPlayerSingleMode = function(){
	return cc.goto_first_camera && !CloudAPI.containsPageParam("fcno");
}

CloudUI.on('showfirstcameraplayer', function(app, event){
	console.log("[CLOUDUI] showfirstcameraplayer");
	SkyVR.camerasList().done(function(data){
		if(data.objects.length == 0){
			CloudUI.trigger('showcameranotfound', app, event);
		}else{
			if(data.objects.length > 1)
				console.warn('[CLOUDUI] Cameras more than one please check cc.goto_first_camera');
			var main_content_template = _.template($('#templates #main-content').html());
			var cnt = $(main_content_template({app: app}));
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

			SkyVR.setCameraID(openCamId);
			console.log('selection camera', SkyVR.cache.cameraInfo());
			event.trigger(event.CAMERA_SELECTED, [openCam]);
		}
	}).fail(function(){
		console.error("Could not found cameras or unathorized");
	});
	// event.trigger(event.CAMERA_SELECTED, [SkyVR.cache.cameraInfo() || cam]);
	// app.trigger('ShowMainPage');
});

		
// experiment
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

CloudUI.clips = new function(){
	var self = this;
	this.clipFilter = function(clip){
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
	
	this.makeClipTime = function(duration){
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
	
	this.onlyclips = false;
	this.shareToken = '';
	
	this.funcClipList = function(){
		if(CloudUI.clips.onlyclips)
			return SkyVR.storageClipListAnon(CloudUI.clips.shareToken);
		return SkyVR.storageClipList();
	}
	
	this.funcClipInfo = function(clipid){
		if(CloudUI.clips.onlyclips)
			return SkyVR.storageClipAnon(clipid, CloudUI.clips.shareToken);
		return SkyVR.storageClip(clipid);
	}
	
	this.changeClip = function(){
		bClickOnWindow = true;
		var nDiff = 0;
		var page_params = SkyVR.parsePageParams();
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
	
	this.startUpdatingClipList = function(){
		self.stopUpdatingClipList();
		self.updateClipListInterval = setInterval(function(){
			CloudUI.clips.funcClipList().done(function(clips){
				CloudUI.clips.updateClipListView(clips);
			});
		},30000);
	};
	
	this.stopUpdatingClipList = function(){
		clearInterval(self.updateClipListInterval);
	};
	
	this.updateClipList = function(){
		CloudUI.clips.funcClipList().done(function(clips){
			CloudUI.clips.updateClipListView(clips);
		});
	};

	this.updateClipTags = function(clips){
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
		self.startUpdatingClipList();
	}
	
	this.deleteClip = function(clipid){
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

	this.hasAccessAll = function(clip){
		if(CloudUI.isDemo())return true;
		return clip['access'][0] == 'all';
	}
	
	this.hasAccessPlay = function(clip){
		if(CloudUI.isDemo())return true;
		return clip['access'][0] == 'play';
	}
		
	this.makeClipTile = function(clip){
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
	
	self.updateClipListViewProcessed = false;
	this.updateClipListView = function(clips){
		if(self.updateClipListViewProcessed){
			setTimeout(function(){
				updateClipListView(clips);
			},50);
			return;
		}
		self.stopUpdatingClipList();

		self.updateClipListViewProcessed = true;
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
					share_data['clips'] = [];
					for(var i = 0; i < shared_clips.length; i++){
						share_data['clips'].push($(shared_clips[i]).attr('clipid'));
					}
					SkyVR.accountShare(share_data).done(function(response){
						var token = response['token'];
						var url = window.location.protocol + '//' + window.location.host + '/share/clips/?vendor=' + cc.vendor + '&token=' + token;
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
			self.updateClipListViewProcessed = false;
			self.startUpdatingClipList();
		}
	}

	
	this.updateClipViewer = function(clip){
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
	
	this.updateClipList = function(){
		CloudUI.clips.funcClipList().done(function(clips){
			CloudUI.clips.updateClipListView(clips);
		});
	};
	this.elemId = '';
	this.mPlayer = undefined;
	this.showClipViewer = function(clipid){
		self.funcClipInfo(clipid).done(function(clip){
			window['currentPage'] = 'clip';
			console.log(clip);
			var page_params = SkyVR.parsePageParams();
			page_params['clipid'] = clip.id;
			SkyVR.changeLocationState(page_params);

			videojs.options.flash.swf = cc.custom_videojs_swf ? cc.custom_videojs_swf : "swf/video-js-custom-SkyVR.swf";
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
					var share_data = {'clips':[clipid]};
					SkyVR.accountShare(share_data).done(function(response){
						var token = response['token'];
						var url = window.location.protocol + '//' + window.location.host + '/share/clips/?vendor=' + cc.vendor + '&token=' + token;
						
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
			SkyVR.changeLocationState(page_params);
		});
	}

}();

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
