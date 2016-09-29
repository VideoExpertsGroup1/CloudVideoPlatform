window.CloudApi = new function (){
	var self = this;
	self.base_url = 'http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/';
	this.setApiToken = function(token){
		self.token = token;
	}
		
	this.updateApiToken = function(){
		var d = $.Deferred();
		$.ajaxSetup({
			crossDomain: true,
			cache: false,
			beforeSend: function(xhr,settings) {
				xhr.setRequestHeader('Authorization', 'SkyVR ' + self.token);
			}
		});
		
		$.ajax({
			url: self.base_url + "api/v2/account/token/api/",
			type: 'GET',
			contentType: 'application/json'
		}).done(function(response){
			self.token = response.token;
			console.log("Updated token: ", self.token);
			d.resolve(self.token);
		}).fail(function(){
			d.reject();
		});
		return d;
	};
	
	this.camerasList = function(){
		var d = $.Deferred();
		var result = {
			meta: {
				limit: 20,
				offset: 0,
				total_count: -1
			},
			objects: []
		};
		var request_data = {
			limit: result.meta.limit,
			offset: result.meta.offset
		};
		function getData(req_data){
			var req_d = $.Deferred();
			$.ajax({
				url: self.base_url + "api/v2/cameras/",
				data: req_data,
				cache : false,
				type: 'GET'
			}).done(function(data){
				req_d.resolve(data);
			}).fail(function(){
				req_d.reject();
			});
			return req_d;
		};

		getData(request_data).fail(function(){
			d.reject();
		}).done(function(data){
			result.meta.total_count = data.meta.total_count;
			$.merge(result.objects, data.objects);
			if(data.meta.offset + data.objects.length >= data.meta.total_count){
				d.resolve(result);
			}else{
				var d_all = [];
				for(var i = result.meta.limit; i < data.meta.total_count; i = i + result.meta.limit){
					request_data.offset = i;
					d_all.push(getData(request_data));
				}
				// wait all response
				$.when.apply($, d_all).done(function(){
					for (var i=0; i < arguments.length; i++) {
						$.merge(result.objects,arguments[i].objects);
					}
					d.resolve(result);
				}).fail(function(){
					d.reject();
				});
			}
		});
		return d;
	}
}

