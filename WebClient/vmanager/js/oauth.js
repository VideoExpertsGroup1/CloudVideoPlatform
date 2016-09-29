SkyVR.oauth = function(){
	function loadAccountInfo_(){
		SkyVR.accountInfo().done(function(info){
			console.log('oauth authorization! info', info);
			if(!SkyVR.containsPageParam("vendor")){
				SkyVR.config.vendor = "VXG_DEV"; // info.vendor;
				SkyVR.loadVendorScripts(SkyVR.config.vendor);
				// SkyVR.loadVendorTranslates(SkyVR.config.vendor, '../../');
			}
		});
	}

	if(window.location.pathname == '/share/clips/index.html' || window.location.pathname == '/share/clips/'){
		if(SkyVR.containsPageParam("vendor")){
			SkyVR.config.vendor = "VXG_DEV"; // SkyVR.pageParams['vendor'];
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
			SkyVR.config.vendor = "VXG_DEV"; // SkyVR.pageParams['vendor'];
			SkyVR.loadVendorScripts(SkyVR.config.vendor, './');
		}
		SkyVR.updateApiToken().done(function(new_token){
			SkyVR.applyApiToken();
			console.log('new oauth authorization!');
			loadAccountInfo_();
		}).fail(function(){
			console.log('Failed updated api token');
		});
	}else if(SkyVR.containsPageParam("login")){
		// TODO deprecated
		console.log('new oauth authorization!');
		SkyVR.anonToken().done(function(anon){
			var data = {email: SkyVR.pageParams['login']};
			SkyVR.accountLogin(data).done(function(token){
				console.log('oauth authorization! logined');
				loadAccountInfo_()
			}).fail(function(){
				// could not authorize
			});
		});
	}else if(!SkyVR.isExpiredApiToken()){
		console.log('oauth authorization! old token is not expered');
		SkyVR.applyApiToken();
		if(SkyVR.containsPageParam("vendor")){
			SkyVR.config.vendor = "VXG_DEV"; // SkyVR.pageParams['vendor'];
			SkyVR.loadVendorScripts(SkyVR.config.vendor, './');
		}
		loadAccountInfo_();
	}
}
SkyVR.oauth();


	
