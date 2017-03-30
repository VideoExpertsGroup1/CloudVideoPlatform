SkyVR.oauth = function(){
	function loadAccountInfo_(){
		SkyVR.accountInfo().done(function(info){
			console.log('oauth authorization! info', info);
			if(!SkyVR.containsPageParam("vendor")){
				SkyVR.config.vendor = info.vendor;
				SkyVR.loadVendorScripts(info.vendor);
				// SkyVR.loadVendorTranslates(SkyVR.pageParams['vendor'], '../../');
			}
		});
	}

	if(SkyVR.containsPageParam("vendor")){
		SkyVR.config.vendor = SkyVR.pageParams['vendor'];
		SkyVR.loadVendorScripts(SkyVR.pageParams['vendor'], './');
	}else{
		// load default vendor
		SkyVR.config.vendor = 'VXG';
		SkyVR.loadVendorScripts(SkyVR.config.vendor, './');
	}

	if(window.location.pathname == '/share/clips/index.html' || window.location.pathname == '/share/clips/'){
		if(SkyVR.containsPageParam("vendor")){
			SkyVR.config.vendor = SkyVR.pageParams['vendor'];
			SkyVR.loadVendorScripts(SkyVR.pageParams['vendor'], '../../');
		}else{
			// load default
			SkyVR.config.vendor = 'VXG';
			SkyVR.loadVendorScripts(SkyVR.config.vendor, '../../');
		}
		if(SkyVR.containsPageParam("token")){
			SkyVR.config.shareToken.token = SkyVR.pageParams['token'];
			// SkyVR.applyShareToken();
		}
	}else if(window.location.href.split("#").length == 2 && window.location.href.split("#")[1].indexOf("token") != -1){
		console.log('new oauth authorization (v2)!');
		SkyVR.loadApiTokenFromHref();
		SkyVR.applyApiToken();
		if(SkyVR.containsPageParam("vendor")){
			SkyVR.config.vendor = SkyVR.pageParams['vendor'];
			SkyVR.loadVendorScripts(SkyVR.pageParams['vendor'], './');
		}else{
			// load default
			SkyVR.config.vendor = 'VXG';
			SkyVR.loadVendorScripts(SkyVR.config.vendor, './');
		}
		SkyVR.updateApiToken().done(function(new_token){
			SkyVR.applyApiToken();
			console.log('new oauth authorization!');
			loadAccountInfo_();
		}).fail(function(){
			console.log('Failed updated api token ' + window.location.href);
		});
	}else if(!SkyVR.isExpiredApiToken()){
		console.log('oauth authorization! old token is not expered');
		SkyVR.applyApiToken();
		if(SkyVR.containsPageParam("vendor")){
			SkyVR.config.vendor = SkyVR.pageParams['vendor'];
			SkyVR.loadVendorScripts(SkyVR.pageParams['vendor'], './');
		}else{
			// load default
			SkyVR.config.vendor = 'VXG';
			SkyVR.loadVendorScripts(SkyVR.config.vendor, './');
		}
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
	SkyVR.setURL(svcp_host);
}

SkyVR.oauth();


	
