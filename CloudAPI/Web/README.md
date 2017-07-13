# CloudAPI js-library

It's wrapepr for call cloud client api

## Requirements 

* jquery library (usually used >= 3.1)

## Sample usage login:

	Please look sample.html

## For got cameras list

	CloudAPI.camerasList().done(function(r){
		console.log(r);
	});
	
## For update token

	CloudAPI.updateApiToken();
	
## For get live_urls

	CloudAPI.cameraLiveUrls(3451).done(function(r){
		console.log(r);
	})

## Set api token, which got from another way

	// variable 'cloud_token' got from some server
	// 'svcp_host' - usually send server which worked with cloud
	
	CloudAPI.setURL(svcp_host);
	CloudAPI.config.apiToken = {};
	CloudAPI.config.apiToken.token = cloud_token.token;
	CloudAPI.config.apiToken.expire = cloud_token.expire;
	CloudAPI.config.apiToken.expireTimeUTC = Date.parse(cloud_token.expire + "Z");
	CloudAPI.config.apiToken.type = "api";

	CloudAPI.applyApiToken();
	CloudAPI.updateApiToken().done(function(new_token){
		CloudAPI.applyApiToken();
		clearInterval(vxgcloudplayer.updateapitoken);
		window.auto_update_token = setInterval(function(){
			CloudAPI.updateApiToken().done(function(new_token){
				CloudAPI.applyApiToken();
			});
		}, 5*60000); // check/update every 5 minutes
	}).fail(function(){
		console.log('Failed updated api token ' + window.location.href);
	});

## Create camera

This method will be create camera. But it's allowed only player users.

	var data = {
		'url': 'rtsp://some.your.camera/live',
		'tz': 'UTC',
		login: login, // optional, url can contains login
		password: password, // optional, url can contains login
	}

	// also if you wish create camera temporary time (for example, on 20 minutes), please use field 'delete_at'
	// Server automaticlly will be remove same cameras
	// data['delete_at'] = CloudAPI.convertUTCTimeToUTCStr((new Date()).getTime() + 20*60*1000)

	CloudAPI.cameraCreate(data).done(function(r){
		console.log(r); // will be return camera info
	}).fail(function(r){
		console.fail(r);
	})

## Get first record from thumbnails list

This method will be return begin record from thumbnails list

	// before you need call set your camera id
	CloudAPI.setCameraID(camid);

	CloudAPI.storageThumbnailsFirstRecord().done(function(r){
		console.log(r);
	}).fail(function(r){
		console.error(r);
	})

## Get thumbnails list

This method will be return part of thumbnails list. For format of date please use `CloudAPI.convertUTCTimeToUTCStr(t)`

	// before you need call set your camera id
	CloudAPI.setCameraID(camid);
	
	// get thumbnails from last 5 minutes
	var startDT = CloudAPI.convertUTCTimeToUTCStr((new Date()).getTime() - 5*60*1000);
	var endDT = CloudAPI.convertUTCTimeToUTCStr((new Date()).getTime());
	
	CloudAPI.storageThumbnails(startDT, endDT).done(function(r){
		console.log(r);
	}).fail(function(r){
		console.error(r);
	})

## Get scheduler

	// before you need call set your camera id
	CloudAPI.setCameraID(camid);

	CloudAPI.cameraSchedule().done(function(r){
		console.log(r);
	}).fail(function(r){
		console.error(r);
	})

## Set scheduler

	// example of data for scheduler
	var data = {
		"monday": [{
			'start' : '12:00',
			"stop" : "13:00",
			"record": 'on' // CM will be on
		},{
			'start' : '13:01',
			"stop" : "14:00",
			"record": 'off' // CM will be off
			
		},{
			'start' : '14:01',
			"stop" : "15:00",
			"record": 'by_event' // only if CM support this function 
		}],
		"tuesday": [],
		"wednesday": [],
		"thursday": [],
		"friday": [],
		"saturday": [],
		"sunday": [],
	}

	// before you need call set your camera id
	CloudAPI.setCameraID(camid);
	
	CloudAPI.updateCameraSchedule(data).done(function(r){
		console.log(r);
	}).fail(function(r){
		console.error(r);
	})

## Convert utc time integer to utc time string

	CloudAPI.convertUTCTimeToUTCStr(t)
	
Where

* t - integer, got from date object `(new Date()).getTime();`

## Convert utc time string to utc time integer

	CloudAPI.parseUTCTime("2017-07-07T00:00:00")

Will be return

	1499385600793
