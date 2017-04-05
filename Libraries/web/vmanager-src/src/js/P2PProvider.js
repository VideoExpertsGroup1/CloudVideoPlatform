window.P2PProvider = new function (){
	var self = this;
	// var d_res = $.Deferred();
	this.cache = {
		cameras: [],
		queries: {}
	}

	this.rx = /\/data\/(\d{4})_(\d{2})_(\d{2})\/(\d{6})_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(_([AC\d]+)){0,1}\.mp4[ ]*(\d+\.\d+)(\w)/
	
	this.buildRecord = function(s, camid, host){
		var p = this.rx.exec(s);
		if(p == null){
			console.error('[P2P] Problem parse: ', s);
			return;
		}
		var record = {
			camid: camid,
			start: p[1] + '-' + p[2] + '-' + p[3] + 'T' + p[5] + ':' + p[6] + ':' + p[7],
			end: p[1] + '-' + p[2] + '-' + p[3] + 'T' + p[8] + ':' + p[9] + ':' + p[10],
			size: Math.round(parseFloat(p[13])*(p[14] == 'M' ? 1024*1024 : 1024)),
			url: host + s.split(" ")[0]
		};
		return record;
	}
	
	this.buildEvent = function(s, camid){
		var p = this.rx.exec(s);
		if(p == null){
			console.error('[P2P] Problem parse: ', s);
			return;
		}
		if(!p[12]) return;
		var events = p[12];
		if(events.length == 1 && events == 'C')
			return;

		var name = "";
		if(events.length == 1 && events == 'A')
			name = 'sound';
		else
			name = 'motion'; // todo: parse regions

		var event = {
			camid: camid,
			name: name,
			time: p[1] + '-' + p[2] + '-' + p[3] + 'T' + p[5] + ':' + p[6] + ':' + p[7]
		};
		return event;
	}

	this.runBuildTests = function(){
		
		function check(obj, objexpected){
			if(!obj){
				console.error("Expected not null object. " + objexpected.url);
				return;
			}
			for(var e in obj){
				if(obj[e] != objexpected[e]){
					console.error("Invalid '" + e + "', expected: '" + objexpected[e] + "' got: '" + obj[e] + "'");
				}
			}
		}
		
		var rec1 = P2PProvider.buildRecord("/data/2016_01_02/160102_115000_115454_A1.mp4       8.26M", 219, "http://localhost");
		var rec2 = P2PProvider.buildRecord("/data/2016_01_02/160102_115000_115454.mp4       8.26M", 219, "http://localhost");
		var recexpect = {
			camid: 219,
			size: 8661238,
			start: '2016-01-02T11:50:00',
			end: '2016-01-02T11:54:54',
			url: 'http://localhost/data/2016_01_02/160102_115000_115454_A1.mp4'
		}
		check(rec1, recexpect);
		recexpect.url = 'http://localhost/data/2016_01_02/160102_115000_115454.mp4';
		check(rec2, recexpect);

		var evnt = P2PProvider.buildEvent("/data/2016_01_02/160102_115000_115454.mp4       8.26M", 219, "http://localhost");
		var evnt1 = P2PProvider.buildEvent("/data/2016_01_02/160102_115000_115454_A1.mp4       8.26M", 220, "http://localhost");
		var evnt2 = P2PProvider.buildEvent("/data/2016_01_02/160102_115000_115454_A.mp4       8.26M", 220, "http://localhost");
		var evntexpect = {
			time: '2016-01-02T11:50:00',
			camid: 220,
			name: 'motion'
		}
		check(evnt1, evntexpect);
		evntexpect.name = 'sound';
		check(evnt2, evntexpect);
	}
	
	this.hasInCache = function(id){
		return self.cache.cameras[id] && self.cache.cameras[id] != null;
	};
	
	this.setToCache = function(id, ip, ports){
		self.cache.cameras[id].ip = ip;
		self.cache.cameras[id].ports = {};
		self.cache.cameras[id].ports.main_port = ports.main_port;
		self.cache.cameras[id].ports.rtmp_port = ports.rtmp_port;
		self.cache.cameras[id].ports.rtsp_port = ports.rtsp_port;
		self.cache.cameras[id].ports.web_port = ports.web_port;
		self.cache.cameras[id].wait_response = false;
		self.cache.cameras[id].web_url = "http://" + ip + ":" + ports.web_port + "/";
		self.cache.cameras[id].rtmp_url = "rtmp://" + ip + ":" + ports.rtmp_port + "/live/video1";
	};

	// TODO need update in setInterval
	this.queryCameraStatus = function(host, port, wait_sec){
		var d = $.Deferred();
		var xmlhttp = new XMLHttpRequest();
		var query_id = Date.now();
		self.cache.queries[query_id] = xmlhttp;
		// xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE){
				if(xmlhttp.status == 200){
					console.log('Winner ' + host + ':' + port);
					d.resolve(xmlhttp.responseText);
					delete self.cache.queries[query_id];
				}else if(xmlhttp.status == 400){
					d.reject();
					delete self.cache.queries[query_id];
				}else{
					d.reject();
					delete self.cache.queries[query_id];
				}
			}
		}
		xmlhttp.open("GET", 'http://' + host + ':' + port + '/httpapi/GetState?' + Date.now(), true);
		xmlhttp.timeout = wait_sec; // wait some sec for response
		xmlhttp.ontimeout = function () {
			console.error('Timeout: http://' + host + ':' + port + '/httpapi/GetState');
			d.reject();
			delete self.cache.queries[query_id];
		};
		xmlhttp.send();
		return d;
	};

	this.cleanup = function(){
		for(var k in self.cache.queries){
			if(self.cache.queries[k]){
				self.cache.queries[k].abort();
			}
		}
		self.cache.cameras = [];
	}

	this.findP2PHost = function(camid){
		var d = $.Deferred();
		if(!CloudAPI.isP2PStreaming_byId(camid)){
			d.reject();
			return d;
		}
		var cam = CloudAPI.cache.cameraInfo(camid);

		if(cam.status != "active"){
			console.error("[P2PPROVIDER] camera is inactive");
			d.reject();
			return d;
		}

		if(cam.p2p == undefined){
			console.error("[P2PPROVIDER] could not find p2p in camera info");
			d.reject();
			return d;
		}
		
		if(cam.p2p.local == undefined){
			console.error("[P2PPROVIDER] could not find p2p.local in camera info");
			d.reject();
			return d;
		}

		// hardcoded
		/*if(cam['external_ip'] == "31.24.28.9"){
			console.log("Hardcode for " + cam['external_ip']);
			// redirect_port tcp local:80 8008 // web
			// redirect_port tcp local:1935 1936 // rtmp
			// redirect_port tcp local:554 10564 // rtsp
			// redirect_port tcp local:2222 2220 // main
			if(cam.p2p.public){
				cam.p2p.public.ip = "";
				cam.p2p.public.main_port = 2220;
				cam.p2p.public.rtmp_port = 1936;
				cam.p2p.public.rtsp_port = 10564;
				cam.p2p.public.web_port = 8008;
			}
		}*/

		var local_web_port = cam.p2p.local.web_port;
		local_web_port = local_web_port == 0 ? 80 :  local_web_port;
		var public_web_port = cam.p2p.public ? cam.p2p.public.web_port : 0;
		public_web_port = public_web_port == 0 ? 80 : public_web_port;

		if (self.hasInCache(cam.id)) {
			if(self.cache.cameras[cam.id].d.state() == "pending"){
				return self.cache.cameras[cam.id].d;
			}
			d.resolve(self.cache.cameras[cam.id].web_url, self.cache.cameras[cam.id].rtmp_url);
			return d;
		}

		self.cache.cameras[cam.id] = {
			"ip": null,
			"ports": {},
			"web_url": null,
			"rtmp_url": null,
			"wait_response": true,
			"try_local_ip": "wait",
			"try_external_ip": "wait",
			"try_public_ip": "wait",
			"d": d
		};

		if(cam.p2p.tunnel && cam.p2p.tunnel.web_url){
			console.log("[DEBUG] Can use tunnel: " + cam.p2p.tunnel.web_url);
			self.cache.cameras[cam.id].tunnel_web_url = cam.p2p.tunnel.web_url;
		}

		// first we check camera by local ip 
		var local_ip = cam.ip;
		self.queryCameraStatus(local_ip, local_web_port, 10000).done(function(){
			if(d.state() == "pending") {
				self.setToCache(cam.id, local_ip, cam.p2p.local);
				var local_cam = self.cache.cameras[cam.id];
				d.resolve(local_cam.web_url, local_cam.rtmp_url);
			}
			self.cache.cameras[cam.id].try_local_ip = "found";
		}).fail(function(){
			console.log("Host '" + local_ip + ":" + local_web_port + "' did not found ");
			self.cache.cameras[cam.id].try_local_ip = "not_found";
		});

		if(typeof cam.p2p.public !== "undefined"){
			// second we check public.ip - it special configured by customer
			var public_ip = cam.p2p.public.ip;
			if(typeof cam.p2p.public.ip !== "undefined" && public_ip != "" && public_ip != local_ip){
				self.queryCameraStatus(public_ip, public_web_port, 10000).done(function(){
					if(d.state() == "pending"){
						self.setToCache(cam.id, public_ip, cam.p2p.public);
						d.resolve(self.cache.cameras[cam.id].web_url, self.cache.cameras[cam.id].rtmp_url);
					}
					self.cache.cameras[cam.id].try_public_ip = "found";
				}).fail(function(){
					console.log("[P2PProvider] public_ip, d.state():" + d.state());
					console.log("Host '" + public_ip + ":" + public_web_port + "' did not found ");
					self.cache.cameras[cam.id].try_public_ip = "not_found";
				});
			};

			// third we check external_ip - it detected remote ip addres by server
			var external_ip = cam.p2p.public.external_ip;
			if(external_ip != local_ip && external_ip != public_ip){
				self.queryCameraStatus(external_ip, public_web_port, 10000).done(function(){
					if(d.state() == "pending"){
						self.setToCache(cam.id, external_ip, cam.p2p.public);
						d.resolve(self.cache.cameras[cam.id].web_url, self.cache.cameras[cam.id].rtmp_url);
					}
					self.cache.cameras[cam.id].try_external_ip = "found";
				}).fail(function(){
					console.log("[P2PProvider] external_ip, d.state():" + d.state());
					console.log("Host '" + external_ip + ":" + public_web_port + "' did not found ");
					self.cache.cameras[cam.id].try_external_ip = "not_found";
				});
			}
		}else{
			self.cache.cameras[cam.id].try_public_ip = "not_found";
			self.cache.cameras[cam.id].try_external_ip = "not_found";
		}

		var wait_sec = 0;
		var wait_max_sec = 10;
		var wait_interval = setInterval(function(){
			wait_sec++;
			console.log("wait_sec: " + wait_sec);
			if(d.state() == "resolved"){
				clearInterval(wait_interval);
				console.log("[P2PProvider] Found host");
				return;
			}else{
				if(self.cache.cameras[cam.id].try_local_ip == "not_found"
				&& self.cache.cameras[cam.id].try_public_ip == "not_found"
				&& self.cache.cameras[cam.id].try_external_ip == "not_found"){
					console.log("[P2PProvider] Not found host");
					clearInterval(wait_interval);
					if(self.cache.cameras[cam.id]['tunnel_web_url']){
						console.log("[P2PProvider] Using tunnel, d.state(): " + d.state());
						self.cache.cameras[cam.id].web_url = self.cache.cameras[cam.id].tunnel_web_url;
						d.resolve(self.cache.cameras[cam.id].web_url, self.cache.cameras[cam.id].rtmp_url);
					}else{
						console.log("[P2PProvider] Tunnel not found");
						d.reject();
					}
				}
				if(wait_sec > wait_max_sec) {
					clearInterval(wait_interval);
					console.log("[P2PProvider] ");
					d.reject();
				}
			}		
		}, 1000);
		return d;
	}

	this.makeUrlWithParams = function(url, params){
		var str = "";
		for (k in params) {
			if (str.length > 0)
				str += "&";
			str += encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
		}
		return url + (str.length > 0 ? "?" + str : "");	
	}

	this.queryGet = function(url){
		var d = $.Deferred();
		if(typeof url === "undefined"){
			d.reject("URL is undefined");
			return d;
		};
		
		// Ad Hoc for: "http://null:undefined/httpapi/SearchData?getpagenum=0&action=getlist&date=2016_10_10"                                                                                        
		if(url && url.split("/")[2] == "null:undefined"){
			console.error("URL is undefined");
			d.reject("URL is undefined");
			return d;
		}

		var xmlhttp = new XMLHttpRequest();
		// xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
				if(xmlhttp.status == 200){
					d.resolve(xmlhttp.responseText);
				}else{
					d.reject('URL [' + url + '] did not found (xmlhttp.status: ' + xmlhttp.status + ')');
				}
			}
		}
		xmlhttp.open("GET", url, true);
		xmlhttp.send();
		return d.promise();
	};

	this.getWebHost = function(){
		var d = $.Deferred();
		var camid = CloudAPI.cameraID();
		P2PProvider.findP2PHost(camid).done(function(web_url,rtmp_url){
			console.log("p2p: web_url: " + web_url + "; rtmp_url: " + rtmp_url);
			d.resolve(web_url + 'httpapi/SearchData', web_url);
		}).fail(function(){
			console.log();
			d.reject();
		});
		return d;
	}

	this.getPages = function (params) {
		var p = Object.create(params);
		p.getpagenum = 0;
		var d = $.Deferred();
		self.getWebHost().done(function (url) {
			url = self.makeUrlWithParams(url, p);
			self.queryGet(url).done(function(res){
				try{
					var result = parseInt(res.split('=')[1], 10);
					d.resolve(result);
				}catch(e){
					d.reject();
				}
			}).fail(function(error){
				d.reject(error);
			});
		}).fail(function(){
			d.reject();
		});
		return d.promise();
	}

	this.parseDate = function (date, time) {
		var dt = [];
		var edt = [date[1], date[2], date[3]];
		dt = dt.concat(edt.map(function (el) {
			return parseInt(el)
		}), [time.slice(0, 2), time.slice(2, 4), time.slice(4)].map(function (el) {
			return parseInt(el)
		}));
		dt[1] = dt[1] - 1;
		dt = new Date(dt);
		return dt;
	};

	this.loadData = function(date, max_pages){
		var camid = CloudAPI.cameraID();
		var d = $.Deferred();
		var num_days = 4;
		var curr_cnt = 0;
		var tmp = new Date(date);
		var dt = tmp.getUTCFullYear() + "_" + ("00" + (tmp.getUTCMonth()+1)).slice(-2) + "_" + ("00" + tmp.getUTCDate()).slice(-2);
		console.log("[P2P] dt " + dt);
		var records = {objects: []};
		var events = {objects: []};
					
		var params = {action: 'getlist', date: dt};
		P2PProvider.getPages(params).done(function (pages) {
			if(pages == 0){
				d.resolve(records, events);
				return;
			}
			var count = 0;
			if (!pages) {
				d.reject('Could not get pages');
				return;
			}

			pages = max_pages || pages;
			var pages10 = Math.floor(pages/10) + 1;
			
			P2PProvider.getWebHost().done(function (host, root_host) {
				var d_dates = [];
				for(var i = 0; i < pages10; i++){
					params.page = i*10+1;
					params.pagenum = 10;
					url = P2PProvider.makeUrlWithParams(host, params);
					d_dates.push(P2PProvider.queryGet(url));
				}
				$.when.apply($, d_dates).done(function(){
					var res = [];
					for (var i = 0; i < arguments.length; i++) {
						var cdata = arguments[i].split(/[\n\r]+/);
						cdata = cdata.filter(function(val){ return val != ''});
						res = _.union(res, cdata);
					}
					
					for (var i = 0; i < res.length; i++){
						var rec = self.buildRecord(res[i],camid,root_host);
						if(rec) records.objects.push(rec);
						var ev = self.buildEvent(res[i],camid);
						if(ev) events.objects.push(ev);
					}
					records.objects.reverse();
					events.objects.reverse();
					d.resolve(records, events);
				}).fail(function(){
					console.log('some errors');
					d.reject('some errors');
				});
			});
		}).fail(function () {
			console.error('could not get pages');
			d.reject("some errors");
		});
		return d.promise();
	}
	
	this.getActivity = function(defer){
		var self = this;
		var d = defer || $.Deferred();
		var count = 0;
		params = {action: 'getroot'};
		P2PProvider.getWebHost().done(function (host) {
			if(host == null){
				console.log("[CAMERA-DATAPROVIDER] host is null");
				d.reject();
				return;
			}
			url = P2PProvider.makeUrlWithParams(host, {'action': 'getroot', 'getpagenum': 0});
			P2PProvider.queryGet(url).done(function(res_pages){
				var pages = 1;
				try{
					pages = parseInt(res_pages.split('=')[1], 10);
				}catch(e){
					console.log("[CAMERA-DATAPROVIDER] none pages");
					d.reject();
					return;
				}
				if(!pages || (pages && pages == 0)){
					d.resolve({objects:[]});
					return;
				}

				var d_all = [];
				for (var i = 0; i < pages; i++) {
					url = P2PProvider.makeUrlWithParams(host, {'action': 'getroot', 'page': i+1});
					d_all.push(P2PProvider.queryGet(url));
				}

				$.when.apply($, d_all).done(function(){
					var dates = [];
					for (var i=0; i < arguments.length; i++) {
						var cdata = arguments[i].split(/[\n\r]+/);
						cdata = cdata.filter(function(val){ return val != ''});
						dates = _.union(dates, cdata);
					}
					var d_dates = [];
					for (var i = 0; i < dates.length; i++) {
						// http://192.168.1.105/httpapi/SearchData?action=getlist&date=2015_12_22&getbeginend=1
						// getting first and last record
						url = P2PProvider.makeUrlWithParams(host, {'action': 'getlist', 'date': dates[i], 'getbeginend': 1});
						d_dates.push(P2PProvider.queryGet(url));
					}
					$.when.apply($, d_dates).done(function(){
						var l_dates = [];
						for (var i = 0; i < arguments.length; i++) {
							var cdata = arguments[i].split(/[\n\r]+/);
							cdata = cdata.filter(function(val){ return val != ''});
							l_dates = _.union(l_dates, cdata);
						}
						if(!self.timezoneOffset)
							self.timezoneOffset = CloudAPI.getOffsetTimezone();
						var result = {objects:[]};
						for (var i = 0; i < l_dates.length; i++) {
							var record = P2PProvider.buildRecord(l_dates[i]);
							record.startTime = new Date(record.start + 'Z').getTime() + self.timezoneOffset;
							var date = new Date(record.startTime);
							date = date.getUTCFullYear() + "-" + ("00" + (date.getUTCMonth()+1)).slice(-2) + "-" + ("00" + date.getUTCDate()).slice(-2);
							if(result.objects.indexOf(date) < 0){
								result.objects.push(date);
							}
						}
						d.resolve(result);
					}).fail(function(){
						console.log("[CAMERA-DATAPROVIDER] One from several query (getbeginend) has fail");
						d.reject();
					});
				}).fail(function(){
					console.log("[CAMERA-DATAPROVIDER] One from several query has fail");
					d.reject();
				});
			}).fail(function(){
				console.error("[CAMERA-DATAPROVIDER] Problem with getroot");
			});
		});
		return d.promise();
	};
}();
