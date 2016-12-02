window.AccpApi = new function (){
	var self = this;
	self.base_url = location.origin + '/' + location.pathname;
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

	this.logout = function(){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});
		var data = {};
		$.ajax({
			url: self.base_url + "api/v1/account/logout/",
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

	this.signup = function(username,password){
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
			url: self.base_url + "api/v1/account/signup/",
			type: 'POST',
			data:  JSON.stringify(data),
			contentType: 'application/json',
            xhrFields: {
			  withCredentials: true
		   }
		}).done(function(response){
			if(response['result'] == 'ok'){
				d.resolve(response);
			}else{
				d.reject();
			}
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.account = function(){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});
		var data = {};
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
	}

	this.setacls = function(acls){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});
		var data = {};
		data['acls'] = acls;
		$.ajax({
			url: self.base_url + "api/v1/account/setacls/",
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
	}
}

