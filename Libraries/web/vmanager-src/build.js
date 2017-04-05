var mkdirp = require('mkdirp');
var jsonfile = require('jsonfile')
var fs = require('fs');
var xml2js = require('xml2js');
var CleanCSS = require('clean-css');
var UglifyJS = require("uglify-js");

// detect version
var version = 'unknown';
var pattern = new RegExp(/^[\d]+\.[\d]+\.[\d]+$/);
process.argv.forEach(function (val, index, array) {
	if(pattern.test(val)){
		version = val;
	}
});

var dist_dir = "./dist";

if(!fs.existsSync(dist_dir)){
	fs.mkdirSync(dist_dir);
}


var vendors = []
var tasks = [];

// Print build version
tasks.push(function (resolve, reject) {
	console.log("Building version of " + version);
	resolve();
});

// Remove dist directory
tasks.push(function (resolve, reject) {
	var dirs = [];
	dirs.push(dist_dir);
	
	while(dirs.length > 0){
		var path = dirs[0];
		dirs.splice(0,1);
		if(!fs.existsSync(path))
			continue;
		var list = fs.readdirSync(path);
		var d_inc = 0;
		list.forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				dirs.push(curPath);
				d_inc++;
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		})
		if(d_inc == 0){
			fs.rmdirSync(path)
		}else{
			dirs.push(path);
		}
	}
	resolve();
});

	

// Make dirs
var mkDirsList = []
mkDirsList.push(dist_dir)
mkDirsList.push(dist_dir + "/css")
mkDirsList.push(dist_dir + "/images")
mkDirsList.push(dist_dir + "/js")
mkDirsList.push(dist_dir + "/vendor")
mkDirsList.push(dist_dir + "/swf")
mkDirsList.push(dist_dir + "/files")
mkDirsList.push(dist_dir + "/files/font")
mkDirsList.push(dist_dir + "/files/fonts")
mkDirsList.push(dist_dir + "/files/fonts/SegoeUIItalic")
mkDirsList.push(dist_dir + "/files/fonts/SegoeUIRegular")
mkDirsList.push(dist_dir + "/files/js")
mkDirsList.push(dist_dir + "/files/js/app")
mkDirsList.push(dist_dir + "/files/js/app/views")
mkDirsList.push(dist_dir + "/files/js/app/controllers")
mkDirsList.push(dist_dir + "/files/js/lib")
mkDirsList.push(dist_dir + "/files/tz")
mkDirsList.push(dist_dir + "/files/images")
mkDirsList.push(dist_dir + "/files/images/player")
mkDirsList.push(dist_dir + "/files/images/camera_setting")

tasks.push(function (resolve, reject) {
	console.log("Make dirs");
	for(var i = 0; i < mkDirsList.length; i++){
		if(!fs.existsSync(mkDirsList[i])){
			console.log("Create dir " + mkDirsList[i]);
			fs.mkdirSync(mkDirsList[i]);
		}
	}
	resolve();
});

// Get list of vendors
tasks.push(function (resolve, reject) {
  console.log("Prepare vendor list");
  var list = fs.readdirSync('src/vendor')
  list.forEach(function(file) {
		var vendor = file;
        file = 'src/vendor/' + file
        var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) {
			vendors.push(vendor);
			var vendor_dir = dist_dir + '/vendor/' + vendor;
			if(!fs.existsSync(vendor_dir)){
				fs.mkdirSync(vendor_dir);	
			}
			
		}
  });
  console.log("Finish");
  resolve();
});

// Copy cc.js
tasks.push(function (resolve, reject) {
	console.log("Copy cc.js ");
	for(var i in vendors){
		var filename_src = 'src/vendor/' + vendors[i] + '/cc.js';
		var filename_dst = dist_dir + '/vendor/' + vendors[i] + '/cc.js';
		fs.createReadStream(filename_src).pipe(fs.createWriteStream(filename_dst));
	}
	resolve();
});

// Copy vendor/c/images
tasks.push(function (resolve, reject) {
	console.log("Copy vendor/images ");
	for(var i in vendors){
		var images_src = 'src/vendor/' + vendors[i] + '/images/';
		var images_dst = dist_dir + '/vendor/' + vendors[i] + '/images/';
		
		if(fs.existsSync(images_src) && !fs.existsSync(images_dst)){
			fs.mkdirSync(images_dst);
			var list = fs.readdirSync(images_src)
			list.forEach(function(file){
				fs.createReadStream(images_src + file).pipe(fs.createWriteStream(images_dst + file));
			});
		}
	}
	resolve();
});


// Prepare custom translates
tasks.push(function (resolve, reject) {
	console.log("Prepare translates " + version);
	var langs = ['en', 'ko', 'ru', 'it'];
	for(var c in vendors){
		var vendor = vendors[c];
		console.log("Prepare translate files for '" + vendor + "'");
		for(var l in langs){
			var lang = langs[l];
			var outputPath = dist_dir + '/vendor/' + vendor + '/lang/';
			var filename = lang + '.json';
			mkdirp.sync(outputPath);
			var baseJson = jsonfile.readFileSync(__dirname + '/src/lang/' + lang + '.json');
			var pathToVendor = __dirname + '/src/lang/' + vendor + '/' + lang + '.json';
			if (fs.existsSync(pathToVendor)) {
				var vendorJson = jsonfile.readFileSync(pathToVendor);
				for(var t in vendorJson){
					baseJson[t] = vendorJson[t];
				}
			}
			jsonfile.writeFileSync(outputPath + filename, baseJson);
		}
	}
	resolve();
});

// Prepare custom css
tasks.push(function (resolve, reject) {
	console.log("Prepare custom styles " + version);

	for(var i in vendors){
		var vendor = vendors[i];
		var filename = dist_dir + '/vendor/' + vendor + '/cc.min.css';
		var inFile1 = './src/css/skyvr.css';
		var inFile2 = './src/vendor/' + vendor + '/cc.css';
		console.log("Make minifier version from '" + inFile1 + "' and '" + inFile2 + "' to '" + filename + "' ... ");
		var cleancss = new CleanCSS({'rebase': false}).minify([inFile1, inFile2]);
		fs.writeFileSync(filename, cleancss.styles);	
	}
	resolve("OK");
});

//Prepare custom pageloader.css
tasks.push(function (resolve, reject) {
	console.log("Prepare custom pageloader styles " + version);
	for(var i in vendors){
		var vendor = vendors[i];
		var filename = dist_dir + '/vendor/' + vendor + '/pageloader.min.css';
		var inFile1 = './src/css/pageloader.css';
		var inFile2 = './src/vendor/' + vendor + '/pageloader.css';
		console.log("Make minifier version from '" + inFile1 + "' and '" + inFile2 + "' to '" + filename + "' ... ");
		var cleancss = new CleanCSS({'rebase': false}).minify([inFile1, inFile2]);
		fs.writeFileSync(filename, cleancss.styles);	
	}
	resolve("OK");
});

// Build minifier version for js
var jsScriptsForMinifier = []
jsScriptsForMinifier.push({src: ['src/js/CloudAPI.js'], dst: dist_dir + '/js/CloudAPI.min.js'});
jsScriptsForMinifier.push({src: ['src/js/CloudUI.js'], dst: dist_dir + '/js/CloudUI.min.js'});
jsScriptsForMinifier.push({src: ['src/js/CloudUI.plugin.CamerasList3x2.js'], dst: dist_dir + '/js/CloudUI.plugin.CamerasList3x2.min.js'});
jsScriptsForMinifier.push({src: ['src/js/videojs-contrib-hls-5.3.3.js'], dst: dist_dir + '/js/videojs-contrib-hls-5.3.3.min.js'});

jsScriptsForMinifier.push({src: [
	'src/js/P2PProvider.js',
	'src/js/Calendar.js',
	'src/js/CameraSettings.js',
	'src/js/ThumbnailsList.js',
	'src/js/TimelineLoader.js',
	'src/js/TimelineLoader.js',
	'src/js/CloudPlayer.js',
	'src/js/AndroidRTMPPlayer.js',
	'src/js/scheduler24hours.js',
	'src/js/audio-streaming.js'
], dst: dist_dir + '/js/vxg-vmanager.min.js'});
// jsScriptsForMinifier.push({src: ['src/js/Calendar.js'], dst: dist_dir + '/js/Calendar.min.js'});
// jsScriptsForMinifier.push({src: ['src/js/CameraSettings.js'], dst: dist_dir + '/js/CameraSettings.min.js'});
// jsScriptsForMinifier.push({src: ['src/js/CloudPlayer.js'], dst: dist_dir + '/js/CloudPlayer.min.js'});

tasks.push(function (resolve, reject) {
	for(var i in jsScriptsForMinifier){
		var filename_src = jsScriptsForMinifier[i].src;
		var filename_dst = jsScriptsForMinifier[i].dst;
		console.log("Minifier js-file from '" + filename_src + "' to '" + filename_dst + "' ... ");
		var result = UglifyJS.minify(filename_src);
		fs.writeFileSync(filename_dst, result.code);
	}
	resolve("OK");
});

// Just copy js
var jsCopy = []
jsCopy.push({src: 'src/js/pageloader.js', dst: dist_dir + '/js/pageloader.js'});
jsCopy.push({src: 'src/js/iframe.js', dst: dist_dir + '/js/iframe.js'});
jsCopy.push({src: 'src/js/scheduler24hours.js', dst: dist_dir + '/js/scheduler24hours.js'});
jsCopy.push({src: 'src/js/clips_datetimepicker.js', dst: dist_dir + '/js/clips_datetimepicker.js'});
jsCopy.push({src: 'src/js/ifvisible.js', dst: dist_dir + '/js/ifvisible.js'});
jsCopy.push({src: 'src/js/skyui.js', dst: dist_dir + '/js/skyui.js'});
jsCopy.push({src: 'src/js/videojs.thumbnails.js', dst: dist_dir + '/js/videojs.thumbnails.js'});
// jsCopy.push({src: 'src/js/AndroidRTMPPlayer.js', dst: dist_dir + '/js/AndroidRTMPPlayer.js'});
jsCopy.push({src: 'src/js/oauth.js', dst: dist_dir + '/js/oauth.js'});
// jsCopy.push({src: 'src/js/ThumbnailsList.js', dst: dist_dir + '/js/ThumbnailsList.js'});
// jsCopy.push({src: 'src/js/audio-streaming.js', dst: dist_dir + '/js/audio-streaming.js'});
// jsCopy.push({src: 'src/js/TimelineLoader.js', dst: dist_dir + '/js/TimelineLoader.js'});
jsCopy.push({src: 'src/js/videojs-5.18.3.min.js', dst: dist_dir + '/js/videojs-5.18.3.min.js'});
jsCopy.push({src: 'src/files/template-loader.js', dst: dist_dir + '/files/template-loader.js'});
jsCopy.push({src: 'src/files/js/app.js', dst: dist_dir + '/files/js/app.js'});
jsCopy.push({src: 'src/files/js/common.js', dst: dist_dir + '/files/js/common.js'});
jsCopy.push({src: 'src/files/js/is.min.js', dst: dist_dir + '/files/js/is.min.js'});
jsCopy.push({src: 'src/files/js/lib/arcticmodal.js', dst: dist_dir + '/files/js/lib/arcticmodal.js'});
jsCopy.push({src: 'src/files/js/lib/backbone.babysitter.js', dst: dist_dir + '/files/js/lib/backbone.babysitter.js'});
jsCopy.push({src: 'src/files/js/lib/backbone.js', dst: dist_dir + '/files/js/lib/backbone.js'});
jsCopy.push({src: 'src/files/js/lib/backbone.wreqr.js', dst: dist_dir + '/files/js/lib/backbone.wreqr.js'});
jsCopy.push({src: 'src/files/js/lib/config.js', dst: dist_dir + '/files/js/lib/config.js'});
jsCopy.push({src: 'src/files/js/lib/d3.js', dst: dist_dir + '/files/js/lib/d3.js'});
jsCopy.push({src: 'src/files/js/lib/is.js', dst: dist_dir + '/files/js/lib/is.js'});
jsCopy.push({src: 'src/files/js/lib/jquery.cookie.js', dst: dist_dir + '/files/js/lib/jquery.cookie.js'});
jsCopy.push({src: 'src/files/js/lib/jquery.js', dst: dist_dir + '/files/js/lib/jquery.js'});
jsCopy.push({src: 'src/files/js/lib/jquery-ui.js', dst: dist_dir + '/files/js/lib/jquery-ui.js'});
jsCopy.push({src: 'src/files/js/lib/json2.js', dst: dist_dir + '/files/js/lib/json2.js'});
jsCopy.push({src: 'src/files/js/lib/lodash.js', dst: dist_dir + '/files/js/lib/lodash.js'});
jsCopy.push({src: 'src/files/js/lib/marionette.js', dst: dist_dir + '/files/js/lib/marionette.js'});
jsCopy.push({src: 'src/files/js/lib/moment.js', dst: dist_dir + '/files/js/lib/moment.js'});
jsCopy.push({src: 'src/files/js/lib/moment-timezone.js', dst: dist_dir + '/files/js/lib/moment-timezone.js'});
jsCopy.push({src: 'src/files/js/lib/player.js', dst: dist_dir + '/files/js/lib/player.js'});
jsCopy.push({src: 'src/files/js/lib/polyglot.js', dst: dist_dir + '/files/js/lib/polyglot.js'});
jsCopy.push({src: 'src/files/js/lib/raphael.js', dst: dist_dir + '/files/js/lib/raphael.js'});
jsCopy.push({src: 'src/files/js/lib/raphael-min.js', dst: dist_dir + '/files/js/lib/raphael-min.js'});
jsCopy.push({src: 'src/files/js/lib/require.js', dst: dist_dir + '/files/js/lib/require.js'});
jsCopy.push({src: 'src/files/js/lib/timeline.js', dst: dist_dir + '/files/js/lib/timeline.js'});
jsCopy.push({src: 'src/files/js/lib/timezonejs.js', dst: dist_dir + '/files/js/lib/timezonejs.js'});
jsCopy.push({src: 'src/files/js/lib/underscore.js', dst: dist_dir + '/files/js/lib/underscore.js'});
jsCopy.push({src: 'src/files/js/lib/video.js', dst: dist_dir + '/files/js/lib/video.js'});
jsCopy.push({src: 'src/files/js/app/main1.js', dst: dist_dir + '/files/js/app/main1.js'});
jsCopy.push({src: 'src/files/js/app/views/md_zones_view.js', dst: dist_dir + '/files/js/app/views/md_zones_view.js'});
jsCopy.push({src: 'src/files/js/app/views/camera_settings_view.js', dst: dist_dir + '/files/js/app/views/camera_settings_view.js'});
jsCopy.push({src: 'src/files/js/app/controllers/md_zones_controller.js', dst: dist_dir + '/files/js/app/controllers/md_zones_controller.js'});
jsCopy.push({src: 'src/files/js/app/controllers/camera_settings_controller.js', dst: dist_dir + '/files/js/app/controllers/camera_settings_controller.js'});

tasks.push(function (resolve, reject) {
	for(var i in jsCopy){
		var filename_src = jsCopy[i].src;
		var filename_dst = jsCopy[i].dst;
		console.log("Copy js-file from '" + filename_src + "' to '" + filename_dst + "' ... ");
		fs.createReadStream(filename_src).pipe(fs.createWriteStream(filename_dst));
	}
	resolve("OK");
});

// CSS minifies
var cssForMinifier = []
cssForMinifier.push({src: [
	'src/css/CloudUI.plugin.CamerasList3x2.css'
], dst: dist_dir + '/css/CloudUI.plugin.CamerasList3x2.min.css'});

cssForMinifier.push({src: [
	'src/css/player-container.css',
	'src/css/CloudUI.css',
	'src/css/fullscreen.css',
	'src/css/player.css',
], dst: dist_dir + '/css/CloudUI.min.css'});

tasks.push(function (resolve, reject) {
	for(var i in cssForMinifier){
		var filename_src = cssForMinifier[i].src;
		var filename_dst = cssForMinifier[i].dst;
		console.log("Minifier css-file from '" + filename_src + "' to '" + filename_dst + "' ... ");
		var cleancss = new CleanCSS({'rebase': false}).minify(filename_src);
		fs.writeFileSync(filename_dst, cleancss.styles);
	}
	resolve("OK");
});


// Just copy css
var cssCopy = []
cssCopy.push({src: 'src/css/iframe.css', dst: dist_dir + '/css/iframe.css'});
cssCopy.push({src: 'src/css/mobile.css', dst: dist_dir + '/css/mobile.css'});
cssCopy.push({src: 'src/css/videojs.thumbnails.css', dst: dist_dir + '/css/videojs.thumbnails.css'});
cssCopy.push({src: 'src/css/video-js502.min.css', dst: dist_dir + '/css/video-js502.min.css'});
cssCopy.push({src: 'src/css/hint-2.4.1.min.css', dst: dist_dir + '/css/hint-2.4.1.min.css'});
cssCopy.push({src: 'src/files/app.css', dst: dist_dir + '/files/app.css'});
cssCopy.push({src: 'src/files/video-js.css', dst: dist_dir + '/files/video-js.css'});

tasks.push(function (resolve, reject) {
	for(var i in cssCopy){
		var filename_src = cssCopy[i].src;
		var filename_dst = cssCopy[i].dst;
		console.log("Copy css-file from '" + filename_src + "' to '" + filename_dst + "' ... ");
		fs.createReadStream(filename_src).pipe(fs.createWriteStream(filename_dst));
	}
	resolve("OK");
});

// replace version in index.html
tasks.push(function (resolve, reject) {
	console.log("Read index.html from 'src/index.html' ... ");
	fs.readFile('src/index.html', 'utf8', function (err,data) {
		if (err) {
			reject(err)
		}else{
			var index_html = data;
			console.log("Replacing in index.html: '%VERSION%' -> '" + version + "'");
			index_html = index_html.replace('%VERSION%', version);
			console.log("Write index.html to 'dist/index.html' ...");
			fs.writeFile('dist/index.html', index_html, function (err) {
				if (err)
					reject(err);
				else
					resolve("OK");
			});
		};
	});
});

// Just copy html
var htmlCopy = [];
htmlCopy.push({src: 'src/vendor/index.html', dst: dist_dir + '/vendor/index.html'});
htmlCopy.push({src: 'src/testhls.html', dst: dist_dir + '/testhls.html'});
htmlCopy.push({src: 'src/favicon.ico', dst: dist_dir + '/favicon.ico'});

tasks.push(function (resolve, reject) {
	for(var i in htmlCopy){
		var filename_src = htmlCopy[i].src;
		var filename_dst = htmlCopy[i].dst;
		console.log("Copy html-file from '" + filename_src + "' to '" + filename_dst + "' ... ");
		fs.createReadStream(filename_src).pipe(fs.createWriteStream(filename_dst));
	}
	resolve("OK");
});

// Just copy files in folders
var filesInFolderCopy = [];
filesInFolderCopy.push("/files/images/");
filesInFolderCopy.push("/files/images/player/");
filesInFolderCopy.push("/files/images/camera_setting/");
filesInFolderCopy.push("/files/fonts/SegoeUIRegular/");
filesInFolderCopy.push("/files/fonts/SegoeUIItalic/");
filesInFolderCopy.push("/files/font/");
filesInFolderCopy.push("/swf/");
filesInFolderCopy.push("/files/tz/");
filesInFolderCopy.push("/images/");

tasks.push(function (resolve, reject) {
	for(var i in filesInFolderCopy){
		var b_path = filesInFolderCopy[i];
		var list = fs.readdirSync('src' + b_path);
		list.forEach(function(file) {
			filename_src = 'src' + b_path + file
			filename_dst = dist_dir + b_path + file
			console.log("Copy file from '" + filename_src + "' to '" + filename_dst + "' ... ");
			var stat = fs.statSync(filename_src)
			if (stat && !stat.isDirectory()) {
				fs.createReadStream(filename_src).pipe(fs.createWriteStream(filename_dst));
			}
		});
	}
	resolve("OK");
});

/*function minifierSVG(filename, callback){
	var xml = fs.readFileSync(filename, 'utf8');
	var pResult = null;
	// know async
	xml2js.parseString(xml, function (err, result) { pResult = result; });

	delete pResult['svg']['$']['xmlns:dc'];
	delete pResult['svg']['$']['xmlns:rdf'];
	delete pResult['svg']['$']['xmlns:inkscape'];
	delete pResult['svg']['$']['xmlns:cc'];
	delete pResult['svg']['$']['xmlns:svg'];
	delete pResult['svg']['$']['xmlns:sodipodi'];
	delete pResult['svg']['$']['inkscape:version'];
	delete pResult['svg']['$']['sodipodi:docname'];
	delete pResult['svg']['metadata'];
	delete pResult['svg']['defs'];
	delete pResult['svg']['sodipodi:namedview'];
	var builder = new xml2js.Builder({'renderOpts': { 'pretty': false, 'indent': '', 'newline': '' }});
	return builder.buildObject(pResult);
}*/

// SVG Minifer
/*tasks.push(function (resolve, reject) {
	var svg_files = [
		{ source: './src/images/arrow_bold_left_dark_14x25.svg', target: dist_dir + '/images/arrow_bold_left_dark_14x25.svg'},
		{ source: './src/images/arrow_bold_left_white_14x25.svg', target: dist_dir + '/images/arrow_bold_left_white_14x25.svg'},
		{ source: './src/images/arrow_bold_right_dark_14x25.svg', target: dist_dir + '/images/arrow_bold_right_dark_14x25.svg'},
		{ source: './src/images/arrow_bold_right_white_14x25.svg', target: dist_dir + '/images/arrow_bold_right_white_14x25.svg'},
	];
	for(var i = 0; i < svg_files.length; i++ ){
		xml = minifierSVG(svg_files[i].source);
		fs.writeFileSync(svg_files[i].target, xml);
	}
	resolve();
});*/

// RUN ALL TASKS
var currentTask = 0;
function runNextTask(){
	var prom = new Promise(tasks[currentTask]);
	prom.then(function(){
		currentTask++;
		if(currentTask < tasks.length) {
			runNextTask();
		}else{
			console.log('Done.');
		}
	},function(err){
		console.log('Fail.\n' + err);
	});
}
runNextTask();
