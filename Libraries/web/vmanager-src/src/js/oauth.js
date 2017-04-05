CloudAPI.oauth = function(){
	function loadAccountInfo_(){
		CloudAPI.accountInfo().done(function(info){
			console.log('oauth authorization! info', info);
			if(!CloudAPI.containsPageParam("vendor")){
				CloudAPI.config.vendor = info.vendor;
				CloudAPI.loadVendorScripts(info.vendor);
				// CloudAPI.loadVendorTranslates(CloudAPI.pageParams['vendor'], '../../');
			}
		});
	}

	if(CloudAPI.containsPageParam("vendor")){
		CloudAPI.config.vendor = CloudAPI.pageParams['vendor'];
		CloudAPI.loadVendorScripts(CloudAPI.pageParams['vendor'], './');
	}else{
		// load default vendor
		CloudAPI.config.vendor = 'VXG';
		CloudAPI.loadVendorScripts(CloudAPI.config.vendor, './');
	}

	if(window.location.href.split("#").length == 2 && window.location.href.split("#")[1].indexOf("token") != -1){
		console.log('new oauth authorization (v2)!');
		CloudAPI.loadApiTokenFromHref();
		CloudAPI.applyApiToken();
		CloudAPI.updateApiToken().done(function(new_token){
			CloudAPI.applyApiToken();
			console.log('new oauth authorization!');
			loadAccountInfo_();
		}).fail(function(){
			console.log('Failed updated api token ' + window.location.href);
		});
	}else if(!CloudAPI.isExpiredApiToken()){
		console.log('oauth authorization! old token is not expered');
		CloudAPI.applyApiToken();
		loadAccountInfo_();
	}
}

if(CloudAPI.containsPageParam("svcp_host")){
	console.log("[OAUTH2] svcp_host=" + CloudAPI.pageParams['svcp_host']);
	CloudAPI.setURL(CloudAPI.pageParams['svcp_host']);
}

if(window['ApplicationMobileInterface']){
	var svcp_host = ApplicationMobileInterface.getSvcpHost();
	console.log("[OAUTH2] svcp_host " + svcp_host);
	localStorage.setItem("svcp_host", svcp_host)
	CloudAPI.setURL(svcp_host);
}

CloudAPI.oauth();


	
