window.AccpApi = new function (){
	var self = this;
	self.base_url = location.origin + '/';
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
			url: self.base_url + "api/v1/account/signin/",
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

	this.signout = function(){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});
		var data = {};
		$.ajax({
			url: self.base_url + "api/v1/account/signout/",
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

	this.checkAuthorization = function(){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false
		});
		var data = {};
		$.ajax({
			url: self.base_url + "api/v1/account/checkauth/",
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

