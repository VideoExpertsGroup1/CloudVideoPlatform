window.AccpApi = new function (){
	var self = this;

	var debugServer="http://10.20.16.28/accp_frontend/";
	self.base_url =(window.location.host!=="10.20.16.28") ? window.location.protocol+"//"+window.location.host+"/":debugServer;
	this.getBaseUrl=function(){return self.base_url;};
	this.isDebuggable=function(){return debug;};
	this.getDebugServer=function(){return debugServer;};
	
	this.getCurrentUrl = function(){
		var current_url = window.location.pathname.split("/");
		current_url.pop();
		return window.location.protocol + "//" + window.location.host + current_url.join("/") + "/";
	}
	
	this.generateRedirectURL = function(params){
		var vmanager_path = window.location.pathname.split("/");
		vmanager_path.pop();
		vmanager_path.push("vmanager");
		var vmanager_params = []
		for(var n in params){
			vmanager_params.push( encodeURIComponent(n) + "=" + encodeURIComponent(params[n]))
		}
		vmanager_params.push("svcp_host=" + encodeURIComponent(this.getSvcpHost()))
		var url = encodeURIComponent(window.location.protocol + "//" + window.location.host + vmanager_path.join("/") + "/?" + vmanager_params.join("&"));
		console.log("url redirect: " + url);
		return url;
	}
	
	this.getSvcpAuthWebUrl_WithRedirect = function(params){
		return localStorage.getItem("svcp_auth_web_url") + "&redirect=" + this.generateRedirectURL(params);
	}
	
	this.getSvcpAuthWebUrl_WithRedirect_camsess = function(params){
		var vmanager_path = window.location.pathname.split("/");
		vmanager_path.pop();
		var vmanager_params = []
		for(var n in params){
			vmanager_params.push( encodeURIComponent(n) + "=" + encodeURIComponent(params[n]))
		}
		vmanager_params.push("svcp_host=" + encodeURIComponent(this.getSvcpHost()))
		var url = encodeURIComponent(window.location.protocol + "//" + window.location.host + vmanager_path.join("/") + "/?" + vmanager_params.join("&"));
		return localStorage.getItem("svcp_auth_web_url") + "&redirect=" + url;
	}

	this.getSvcpAuthWebUrl_WithRedirect_GPLUS = function(){
		if(window.location.host == "54.173.34.172:12050"){
			var svcp_host = window.location.protocol + "//ec2-54-173-34-172.compute-1.amazonaws.com/";
			var svcp_auth_web_url = svcp_host + "svcauth/init?&src=doc&provider=ST_GOOGLE&vendor=VXG_DEV";
			localStorage.setItem("svcp_host", svcp_host);
			return svcp_auth_web_url + "&redirect=" + this.generateRedirectURL();	
		}else if(window.location.host == "cnvrclient2.videoexpertsgroup.com" || window.location.host == "localhost"){
			var svcp_host = window.location.protocol + "//web.skyvr.videoexpertsgroup.com/";
			var svcp_auth_web_url = svcp_host + "svcauth/init?&src=doc&provider=VXG_DOC_GOOGLE&vendor=VXG_DOC";
			localStorage.setItem("svcp_host", svcp_host);
			return svcp_auth_web_url + "&redirect=" + this.generateRedirectURL();
		}
	}

	this.getSvcpHost = function(){
		return localStorage.getItem("svcp_host");
	}

	this.getSvcpAuthWebUrl = function(){
		return localStorage.getItem("svcp_auth_web_url");
	}
	
	this.setSvcpAuthWebUrl = function(svcpAuthWebUrl){
		var parts = svcpAuthWebUrl.split('/');
		// change protocol
		parts[0] = window.location.protocol;
		svcpAuthWebUrl = parts.join('/');
		var svcphost = window.location.protocol+"//"+parts[2]+"/";
		localStorage.setItem("svcp_auth_web_url",svcpAuthWebUrl);
		localStorage.setItem("svcp_host",svcphost);
		console.log("svcphost: " + svcphost);
		var profile_path = window.location.pathname.split("/");
		profile_path.pop();
		var profile_url = window.location.protocol + "//" + window.location.host + profile_path.join("/") + "/"
		localStorage.setItem("profile_url",profile_url);
	}
		
	$.ajaxSetup({
		crossDomain: true,
		cache: false,
	});
	
	this.isDemo = function(){
		return localStorage["is_opened_like_demo"] ==="true";
	}
	
	this.demo_login = function(){
		localStorage.setItem("is_opened_like_demo", false);
		localStorage.removeItem('selectedCam');
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
		});
		$.ajax({
			url: self.base_url + "api/v1/account/demo_login/",
			type: 'POST',
			xhrFields: {
				withCredentials: true
			},
			beforeSend: function(xhr,settings) {
				// xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
			}
		}).done(function(response){
			self.setSvcpAuthWebUrl(response.svcp_auth_web_url);
			// self.svcp_auth_app_url = response.svcp_auth_app_url;
			localStorage.setItem("is_opened_like_demo", true);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.login = function(username,password){
		localStorage.setItem("is_opened_like_demo", false);
		localStorage.removeItem('selectedCam');
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			beforeSend: function(xhr,settings) {
				// xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
			}
		});
		var data = {};
		data.username = username;
		data.password = password;
		$.ajax({
			url: self.base_url + "api/v1/account/login/",
			type: 'POST',
			data:  JSON.stringify(data),
			contentType: 'application/json',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			self.setSvcpAuthWebUrl(response.svcp_auth_web_url);
			self.svcp_auth_app_url = response.svcp_auth_app_url;
			localStorage.setItem("is_opened_like_demo", false);
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.registration = function(data){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});

		$.ajax({
			url: self.base_url + "api/v1/account/register/",
			type: 'POST',
			data:  JSON.stringify(data),
			contentType: 'application/json',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.profile = function(data){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});

		$.ajax({
			url: self.base_url + "api/v1/account/",
			type: 'GET',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.logout = function(data){
		localStorage.removeItem("is_opened_like_demo");
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});

		$.ajax({
			url: self.base_url + "api/v1/account/logout/",
			type: 'POST',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			d.resolve(response);
			
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	this.cameraDelete=function(id){
		$.ajax({
			url: self.base_url + "api/v1/cameras/"+id+"/",
			type: 'DELETE',
            xhrFields: {
				withCredentials: true
			},
		});
	}
    this.cameraCreate=function(data){
		 data = data || {};
		var d = $.Deferred();
		$.ajax({
			url: self.base_url+"api/v1/cameras/",
			type: 'POST',
			data: JSON.stringify(data),
            xhrFields: {
				withCredentials: true
			},
			contentType: 'application/json',
			cache : false
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
        return d;
	};
	
	this.cameras = function(data){
		var d = $.Deferred();
		$.ajax({
			url:  self.base_url+"api/v1/cameras/",
			type: 'GET',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
}

