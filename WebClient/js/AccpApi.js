window.AccpApi = new function (){
	var self = this;

	var debugServer="http://10.20.16.28/accp_frontend/";
	self.base_url =(window.location.host!=="10.20.16.28")?window.location.protocol+"//"+window.location.host+"/":debugServer;
	this.getBaseUrl=function(){return self.base_url;};
	this.isDebuggable=function(){return debug;};
	this.getDebugServer=function(){return debugServer;};
	
	this.getCurrentUrl = function(){
		var current_url = window.location.pathname.split("/");
		current_url.pop();
		return window.location.protocol + "//" + window.location.host + current_url.join("/") + "/";
	}
	
	this.getSvcpAuthWebUrl_WithRedirect = function(){
		var vmanager_path = window.location.pathname.split("/");
		vmanager_path.pop();
		vmanager_path.push("vmanager");
		var redirect_url = window.location.protocol + "//" + window.location.host + vmanager_path.join("/") + "/";
		return localStorage.getItem("svcp_auth_web_url") + "&redirect=" + redirect_url;
	}
	
	this.getSvcpHost = function(){
		return localStorage.setItem("svcp_host");
	}
	
	this.getSvcpAuthWebUrl = function(){
		return localStorage.setItem("svcp_host");
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
		return localStorage["is_opened_like_demo"] == "true";
	}
	
	this.demo_login = function(){
		localStorage.setItem("is_opened_like_demo", false);
		localStorage.removeItem('selectedCam');
		var d = $.Deferred();
		$.ajax({
			url: self.base_url + "api/v1/account/demo_login/",
			type: 'POST',
            xhrFields: {
			  withCredentials: true
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
		localStorage.setItem("is_opened_like_demo", false);
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
	this.deleteCamera=function(id){
		
		
		$.ajax({
			url: self.base_url + "api/v1/cameras/"+id+"/",
			type: 'DELETE'}
           ).done();
		
		
	}
    this.newCamera=function(){
		
		 var data = {};
		     data.name = $('#new-camera-name').val();
			 data.url = $('#new-camera-live-stream-link').val();
			 data.login = $('#new-camera-live-stream-link-login').val();
			 data.password = $('#new-camera-live-stream-link-password').val();
			 data.timezone = $('#new-camera-timezone').val();
		var d = $.Deferred();
		$.ajax({
			url: self.base_url+"api/v1/cameras/",
			type: 'POST',
			data: JSON.stringify(data),
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
		$.ajaxSetup({
			crossDomain: true,
			
			cache: false,
			beforeSend: function(xhr,settings) {
				// xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
			}
		});

		$.ajax({
			url:  self.base_url+"api/v1/cameras/",
			type: 'GET'
            
		}).done(function(response){
			d.resolve(response);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
}

