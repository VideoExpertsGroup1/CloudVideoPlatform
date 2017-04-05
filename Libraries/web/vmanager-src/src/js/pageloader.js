var pageloader_progress = 0;

function loadScripts(files, callback){
	var idx = -1;
	var maxidx = files.length;
	function loadNext(){
		idx++;
		var path = files[idx]
		if(path){
			var module = undefined;
			if(path.slice(-3) == ".js"){
				// console.log("Loading js..." + path);
				module = document.createElement('script');
				module.src = path;
			}else if(path.slice(-4) == ".css"){
				// console.log("Loading css..." + path);
				module = document.createElement('link');
				module.rel  = 'stylesheet';
				module.type = 'text/css';
				module.href = path;
				module.media = 'all';
			}else{
				console.log("Unknown resource... " + path);
			}
			if(module){
				module.onload = function() {
					pageloader_progress = Math.ceil(((idx+1)/maxidx)*100);
					console.log("Loaded (" + pageloader_progress + "%): " + path);
					loadNext();
				}
				module.onerror = module.onload;
				document.head.appendChild(module);
			}else{
				loadNext();
			}
		}else{
			callback();
		}
	}
	idx = -1;
	loadNext();
}

CloudAPI.onLoadedVendorScript = function(event) {
	CloudAPI.updatePageProgressCaption();
	var progressInterval = setInterval(function(){
		if(pageloader_progress >= 100){
			if(document.getElementById('progress-content'))
				document.getElementById('progress-content').style.width = '100%';
			clearInterval(progressInterval);
		}else{
			if(document.getElementById('progress-content'))
				document.getElementById('progress-content').style.width = pageloader_progress + '%';
		}
	},200);
	
	var pageloader_files = [];
	pageloader_files.push('js/ifvisible.js');
	// pageloader_files.push('./files/js/lib/jquery.js');
	pageloader_files.push('./js/iframe.js');
	pageloader_files.push('./js/skyui.js');
	pageloader_files.push('./js/CloudUI.min.js');
	
	// load ui plugins
	if(cc.plugins_ui){
		console.log(cc.plugins_ui);
		for(var i in cc.plugins_ui){
			console.log(cc.plugins_ui[i]);
			pageloader_files.push(cc.plugins_ui[i]);
		}
	}
	
	// load css plugins
	if(cc.plugins_css){
		console.log(cc.plugins_css);
		for(var i in cc.plugins_css){
			console.log(cc.plugins_css[i]);
			pageloader_files.push(cc.plugins_css[i]);
		}
	}
	
	pageloader_files.push('./js/videojs-5.18.3.min.js');
	pageloader_files.push('./js/videojs-contrib-hls-5.3.3.min.js');
	pageloader_files.push('./js/videojs.thumbnails.js');
	pageloader_files.push('./files/app.css') // TODO removing after redesign
	pageloader_files.push('./css/CloudUI.min.css')
	pageloader_files.push('./css/hint-2.4.1.min.css')
	pageloader_files.push('./css/video-js502.min.css')
	pageloader_files.push('./css/videojs.thumbnails.css')

	if(CloudAPI.containsPageParam('shared_token')){
		var pageloader_starttime = (new Date()).getTime();
		// load translates
		loadScripts(pageloader_files, function(){
			CloudUI.trigger('showsharedclips');
			var pageloader_stoptime = (new Date()).getTime();
			console.log("Loading time: " + (pageloader_stoptime - pageloader_starttime)/1000 + " seconds");
		});
		return;
	}

	pageloader_files.push('./js/vxg-vmanager.min.js');
	// pageloader_files.push('./js/Calendar.min.js')
	// pageloader_files.push('./js/ThumbnailsList.js')
	// pageloader_files.push('./js/TimelineLoader.js')
	// pageloader_files.push('./js/CameraSettings.min.js')
	// pageloader_files.push('./js/CloudPlayer.min.js')
	// pageloader_files.push('./js/AndroidRTMPPlayer.js')
	pageloader_files.push('./js/clips_datetimepicker.js')
	pageloader_files.push('./files/js/lib/is.js')
	pageloader_files.push('./files/js/lib/moment.js')
	pageloader_files.push('./files/js/lib/moment-timezone.js')
	// pageloader_files.push('./js/scheduler24hours.js')
	// pageloader_files.push('./js/audio-streaming.js')
	pageloader_files.push('./files/js/lib/require.js')

	var params1 = window.location.search.slice(1).split("&");
	var params = {};
	for(var i in params1){
		if(params1[i].indexOf("=") != -1){
			var name = params1[i].split("=")[0];
			var val = params1[i].slice(params1[i].indexOf("=")+1);
			params[name] = val;
		}else{
			params[params1[i]] = "";
		}
	};

	if(params["mobile"] != undefined){
		pageloader_files.push('css/mobile.css');
	}

	var pageloader_starttime = (new Date()).getTime();
	loadScripts(pageloader_files, function(){
		if(is.touchDevice()){
			document.documentElement.className += ' touch-device';
			console.log("is touch");
		}else{
			document.documentElement.className += ' not-touch-device';
			console.log("is not touch");
		}
		requirejs(['./files/js/common'], function (common) {
			requirejs(['app/main1']);
		});
		var pageloader_stoptime = (new Date()).getTime();
		console.log("Loading time: " + (pageloader_stoptime - pageloader_starttime)/1000 + " seconds");
	});
};
