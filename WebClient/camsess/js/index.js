$( document ).ready(function() {
	AccpApi.base_url = "http://cnvrclient2.videoexpertsgroup.com/";
	if(window.location.href.split("#").length == 2 && window.location.href.split("#")[1].indexOf("token") != -1){
		CloudAPI.loadApiTokenFromHref();
		CloudAPI.applyApiToken();
		if(CloudAPI.containsPageParam("svcp_host")){
			console.log("svcp_host=" + CloudAPI.pageParams['svcp_host']);
			CloudAPI.setURL(CloudAPI.pageParams['svcp_host']);
			CamsessViewer.showCamsessList();
		}
		CloudAPI.changeLocationState({});
		
		CloudAPI.updateApiToken().done(function(new_token){
			CloudAPI.applyApiToken();
			window.updateapitoken = setInterval(function(){
				CloudAPI.updateApiToken().done(function(new_token){
					CloudAPI.applyApiToken();
				});
			}, 5*60000);
		}).fail(function(){
			console.log('Failed updated api token ' + window.location.href);
		});
		
	}else{
		AccpApi.demo_login().done(function(response){
			console.log(response);
			console.log(AccpApi.getSvcpAuthWebUrl_WithRedirect_camsess());
			window.location = AccpApi.getSvcpAuthWebUrl_WithRedirect_camsess();
		}).fail(function(){
			CamsessViewer.failedAuthorization();
		});
	}
});

window.CamsessViewer = {}

CamsessViewer.failedAuthorization = function(){
	$('#content').html("failed authorization");
}

CamsessViewer.convertMiliseconds2strtime = function(duration){
	duration = duration/1000;
	var sec = duration % 60;
	duration = (duration - sec)/60;
	var min = duration % 60;
	duration = (duration - min)/60;
	var hour = duration;
	sec = sec < 10 ? "0" + sec : "" + sec;
	min = min < 10 ? "0" + min : "" + min;
	hour = hour < 10 ? "0" + hour : "" + hour;
	return hour + ":" + min + ":" + sec;
}

CamsessViewer.camsessForm = function(obj){
	var duration = 0;
	if(obj.end){
		duration = Date.parse(obj.end) - Date.parse(obj.start);
	}
	var d = new Date(Date.parse(obj.start));
	var s = '';
	s += '<div class="camsess-item" id="camsess' + obj.id + '" camsessid="' + obj.id + '">';
	s += '	<div class="camsess-preview"></div>';
	s += '	<div class="camsess-info">';
	s += '		<div class="camsess-title">' + obj.title + '</div>';
	s += '		<div class="camsess-author">by ' + obj.author.preferred_name + '</div>';
	s += '		<div class="camsess-starttime">at ' + (d.getUTCMonth()+1) + '/' + d.getUTCDate() + ' ' + d.getUTCHours() + ':' + d.getUTCMinutes() + '</div>';
	if(!obj.active){
		s += '		<div class="camsess-duration">Duration: ' + CamsessViewer.convertMiliseconds2strtime(duration) + '</div>';
	}else{
		s += '		<div class="camsess-duration">LIVE</div>';
	}
	s += '		<div class="camsess-coord">latitude: ' + obj.latitude + '</div>';
	s += '		<div class="camsess-coord">latitude: ' + obj.longitude + '</div>';
	s += '	</div>';
	s += '</div>';
	return s;
}

CamsessViewer.playerUrls = [];
CamsessViewer.playerUrlsIdx = 0;
CamsessViewer.playerType = 'video/mp4';

CamsessViewer.playNextUrl = function(){
	CamsessViewer.playerUrlsIdx = CamsessViewer.playerUrlsIdx + 1;
	if(CamsessViewer.playerUrlsIdx < CamsessViewer.playerUrls.length){
		videojs('player0').src([{src: CamsessViewer.playerUrls[CamsessViewer.playerUrlsIdx], type: CamsessViewer.playerType}]);
	}else{
		CamsessViewer.stopVideo();
	}
}

CamsessViewer.playVideo = function(urls, type){
	CamsessViewer.playerUrls = urls;
	CamsessViewer.playerUrlsIdx = -1;
	CamsessViewer.playerType = type;

	$('.camsess-player').css({'left':'0px'});
	// videojs.options.flash.swf = "swf/video-js.swf"
	if($('#player0').length > 0){
		videojs('player0').dispose();
		$('.camsess-player0').html('');
	}
	$('.camsess-player0').html('<video crossorigin="anonymous" id="player0" class="video-js" controls preload="auto" width="480" height="320" class="video-js vjs-default-skin vjs-live" muted=true autoplay=true preload controls></video>');
	var player0 = videojs('player0').ready(function(){
		CamsessViewer.playNextUrl();
		this.on('ended', function() {
			CamsessViewer.playNextUrl();
		});
	});
	$('.camsess-player-background').unbind().bind('click', function(){
		CamsessViewer.stopVideo();
	})
}

CamsessViewer.stopVideo = function(){
	videojs('player0').dispose();
	$('.camsess-player0').html('');
	$('.camsess-player').css({'left':''});
}

CamsessViewer.bindCamsessHandlers = function(obj){
	if(obj.preview && obj.preview.url){
		$('#camsess' + obj.id + ' .camsess-preview').css({'background-image': 'url(' + obj.preview.url + ')'});
	}
	$('#camsess' + obj.id).unbind().bind('click', function(){
		var camsessid = $(this).attr("camsessid");
		$('.camsess-player').css({'left':'0px'});
		CloudAPI.camsessInfo(camsessid).done(function(camsess){
			console.log(camsess);
			if(camsess.active){
				var urls = [];
				var url_rtmp = camsess.live_urls.rtmp;
				urls.push(url_rtmp);
				CamsessViewer.playVideo(urls, 'rtmp/mp4');
			}else{
				CloudAPI.camsessRecords(camsessid).done(function(records){
					var url_records = [];
					var len = records.objects.length;
					for(var i = 0; i < len; i++){
						url_records.push(records.objects[i].url);
					}
					console.log(url_records);
					CamsessViewer.playVideo(url_records, 'video/mp4');
				});
			}
		});
	});
}

CamsessViewer.camsessListForm = function(){
	var s = '';
	s += '<div class="camsess-filter">';
	s += '	<input type="text" id="camsess_title_author_preferred_name_filter" value="" placeholder="Author name..."/>';
	s += '	<select id="camsess_active_filter">';
	s += '		<option selected value="only_active">Only active</option>';
	s += '		<option value="only_not_active">Only not active</option>';
	s += '		<option value="all">All sessions</option>';
	s += '	</select><br>';
	s += '</div>';
	s += '<div class="camsess-list-count"></div>';
	s += '<div class="camsess-list">';
	s += '</div>';
	return s;
}

CamsessViewer.bindCamsessListHandlers = function(){
	$( "#camsess_active_filter" ).change(function() {
		CamsessViewer.updateCamsessList();
	});
	
	$('#camsess_title_author_preferred_name').on('input',function(e){
		CamsessViewer.updateCamsessList();
	});
}

CamsessViewer.showCamsessList = function(){
	$('#content').html(CamsessViewer.camsessListForm());
	CamsessViewer.bindCamsessListHandlers();
	CamsessViewer.updateCamsessList();
}

CamsessViewer.updateCamsessList = function(){
	
	var params = {};
	params["order_by"] = "-start";
	params["detail"] = "detail";
	var active_filter = $( "#camsess_active_filter" ).val();
	
	if(active_filter == "only_active" ){
		params["active"] = "true";
		params["streaming"] = "true";
	}else if(active_filter == "only_not_active" ){
		params["active"] = "false";
		params["has_records"] = "true";
	}else{
		// will be all sessions
	}

	// filter by author
	var author_filter = $( "#camsess_title_author_preferred_name_filter" ).val();
	params["author_preferred_name__icontains"] = author_filter;

	// filter by logitude && latitude
	// if($("#camsess_coords_filter").prop('checked')){
	var filter_by_coordinates = false;
	if(filter_by_coordinates){
		// TODO: don't forget check situation when MAX < MIN (if it possible, of course)!!!!
		var mLatitudeMin = -123.4567890;
		var mLatitudeMax = 123.4567890;
		var mLongitudeMin = -123.4567890;
		var mLongitudeMax = 123.4567890;
		
		if(mLatitudeMin <= mLatitudeMax){
			params["latitude__gte"] = mLatitudeMin;
			params["latitude__lte"] = mLatitudeMax;
		}
		
		if(mLongitudeMin <= mLongitudeMax){
			params["longitude__gte"] = mLongitudeMin;
			params["longitude__lte"] = mLongitudeMax;
		}
	}

	// will be get first 50 records
	$('.camsess-list').html('');
	CloudAPI.camsessList(params).done(function(response){
		var len = response.objects.length;
		$('.camsess-list-count').html("Found: " + response.meta.total_count);
		
		for(var i = 0; i < len; i++){
			var o = response.objects[i];
			$('.camsess-list').append(CamsessViewer.camsessForm(o));
			CamsessViewer.bindCamsessHandlers(o);
		}
		console.log(response);
	}).fail(function(){
		window.location = window.location.href.split("?")[0];
	})
}
