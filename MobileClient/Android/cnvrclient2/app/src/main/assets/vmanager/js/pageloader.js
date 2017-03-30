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
			
document.addEventListener("DOMContentLoaded", function(event) {
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

	var pageloader_files = [
		'js/ifvisible.js',
		'./files/js/lib/jquery.js',
		'./js/iframe.js',
		'./js/skyui.js',
		'./js/CloudUI.min.js',
		'./js/P2PProvider.min.js',
		'./js/Calendar.min.js',
		'./js/ThumbnailsList.js',
		'./js/TimelineLoader.js',
		'./js/CameraSettings.js',
		'./js/CloudPlayer.min.js',
		'./js/AndroidRTMPPlayer.js',
		'./js/clips_datetimepicker.js',
		'./files/js/lib/is.js',
		'./files/js/lib/moment.js',
		'./files/js/lib/moment-timezone.js',
		'./js/video-502-min.js',
		'./js/videojs.thumbnails.js',
		// './js/videojs.hls.mod-cloud.js',
		'./js/scheduler24hours.js',
		'./js/audio-streaming.js',
		'./files/js/lib/require.js',
		'./css/player-container.css',
		'./files/app.css', // TODO removing after redesign
		'./css/CloudUI.css',
		'./css/fullscreen.css',
		'./css/video-js502.min.css',
		'./css/videojs.thumbnails.css',
		'files/player.css',
	];
	
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
});
