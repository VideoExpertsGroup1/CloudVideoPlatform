window.AccpApi = new function (){
	var self = this;
	
	
	var debugServer="http://10.20.16.28/accp_frontend/";
	self.base_url =(window.location.host!=="10.20.16.28")?window.location.protocol+"//"+window.location.host+"/":debugServer;
	this.getBaseUrl=function(){return self.base_url;};
	this.isDebuggable=function(){return debug;};
	this.getDebugServer=function(){return debugServer;};
	this.login = function(username,password){
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
			document.getElementById('username').style.color='#046B90';
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

