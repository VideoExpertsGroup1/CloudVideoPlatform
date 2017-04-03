# CloudAPI js-library

It's wrapepr for call cloud client api

## Requirements 

* jquery library

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

