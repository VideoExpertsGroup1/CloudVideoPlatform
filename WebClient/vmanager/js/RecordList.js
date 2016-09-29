window.RecordList = function (event){
	var self = this;
	self.event = event;
	this.description = "Class RecordList For SkyVR";
	self.buffer = {};
	
	// cache by every 3 hours
	self.durationGrid = 10800000;
	
	this.minifier01hour = new Array();
	this.minifier = function(startTime, endTime){
		var st = self.normalizeT(startTime);
		var et = self.normalizeT(endTime);
		var res = [];
		for(var i = st; i <= et; i += self.durationGrid){
			if(self.minifier01hour[i]){
				res = res.concat(self.minifier01hour[i]);
			}
		}
		return res;
	}
	
	this.firstStartTime = function(){
		var t = undefined;
		for(var i in self.buffer){
			t = t == undefined ? i : Math.min(i, t);
		}
		// TODO if list is empty
		var list = self.buffer[t] || [];
		if(list.length > 0){
			return list[0].startTime;
		}
		return undefined;
	}

	self.lastEndTime = function(){
		var t = undefined;
		for(var i in self.buffer){
			t = t == undefined ? i : Math.max(i, t);
		}
		var list = self.buffer[t] || [];
		if(list.length > 0){
			return list[list.length-1].endTime;
		}
		return undefined;
	}

	this.removeBefore = function(time){
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		var res = 0;
		if(self.buffer[prev_t]){
			var len = self.buffer[prev_t].length;
			self.buffer[prev_t] = self.buffer[prev_t].filter(function(el){ return el.startTime > time; })
			var removed = (len - self.buffer[prev_t].length);
			if(self.buffer[prev_t].length == 0){
				delete self.buffer[prev_t];
				delete self.minifier01hour[prev_t];
			}else if(removed > 0){
				self.minifier01hour[prev_t] = self.makeMinifier(prev_t);
				
			}
			res += removed;
		}
		if(self.buffer[t]){
			var len = self.buffer[t].length;
			self.buffer[t] = self.buffer[t].filter(function(el){ return el.startTime > time; })
			var removed = (len - self.buffer[t].length);
			if(self.buffer[t].length == 0){
				delete self.buffer[t];
				delete self.minifier01hour[t];
			}else if(removed > 0){
				self.minifier01hour[t] = self.makeMinifier(t);
			}
			res += removed;
		}
		return res;
	}

	this.atTime = function(time){
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		if(self.buffer[prev_t]){
			var list = self.buffer[prev_t];
			for(var i in list){
				if(time >= list[i].startTime && time < list[i].endTime) return list[i];
			}
		}
		if(self.buffer[t]){
			var list = self.buffer[t];
			for(var i in list){
				if(time >= list[i].startTime && time < list[i].endTime) return list[i];
			}
		}
		return undefined;
	};
	this.afterTime = function(time){
		var t = self.normalizeT(time);
		var max = self.normalizeT(self.lastEndTime() || 0);
		while(t <= max){
			if(self.buffer[t]){
				var list = self.buffer[t];
				for(var i in list){
					if(list[i].startTime >= time){
						return list[i];
					}
				}
			}
			t += self.durationGrid;
		}
		return undefined;
	};
	this.recordDuringOrAfter = function (t){
		return  self.atTime(t) || self.afterTime(t);
	};
	this.next = function(o){
		if(o) return this.afterTime(o.endTime - 999);
		return undefined;
	};

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp%self.durationGrid;
		return tmp;
	}
	
	this.applySortUniq = function(t){
		self.buffer[t].sort(function (a, b) {
			return a.startTime - b.startTime
		});
		var len = self.buffer[t].length;
		if(len > 1){
			var o = self.buffer[t][0];
			for (var i=1;i<len-1;i++){
				if(o.startTime == self.buffer[t][i].startTime){
					self.buffer[t].splice(i,1);
					i--;
					len = self.buffer[t].length;
				}else{
					o = self.buffer[t][i];
				}
			}
		}
	};

	this.lock = false;
	this.append = function(res, def){
		var d = def || $.Deferred();
		if(this.lock){
			var res2 = res;
			var d2 = d;
			setTimeout(function(){ self.append(res2,d2); },100);
			return d2.promise();
		}
		this.lock = true;
		try{
			if(!res.concat){
				console.error("[TIMELINE] res.concat");
				return;
			}
			// filter by camid
			var camid = SkyVR.cameraID();
			res = res.filter(function(e){ return e.camid == camid; });
			var for_uniq = [];
			var minT = undefined;
			var maxT = undefined;
			for(var i = 0; i < res.length; i++){
				res[i].startTime = Date.parse(res[i].start + 'Z');
				res[i].endTime = Date.parse(res[i].end + 'Z');
				if(res[i].endTime < res[i].startTime){ // this logic because bad server format on camera;
					res[i].endTime += 86400000;
				}
				minT = minT == undefined ? res[i].startTime : Math.min(minT, res[i].startTime);
				maxT = maxT == undefined ? res[i].endTime : Math.max(maxT, res[i].endTime);
				var part = self.normalizeT(res[i].startTime);
				if(for_uniq.indexOf(part) == -1){
					for_uniq.push(part);
				}
				if(!self.buffer[part]){
					self.buffer[part] = new Array();
				}
				self.buffer[part].push(res[i]);
			}

			for(var i in for_uniq){
				var t = for_uniq[i];
				self.applySortUniq(t);
				self.minifier01hour[t] = self.makeMinifier(t);
			}
			d.resolve();

			if(minT && maxT)
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, minT, maxT);
		}finally{
			this.lock = false;
		}
		return d.promise();
	};

	this.takeHour = function(t){
		return t - t%3600000;
	}

	this.makeMinifier = function(t, precision_ms){
		precision_ms = precision_ms || 1000;
		var hours = [];
		var list = self.buffer[t];

		function pushArr(t1,t2){
			if(t2 <= t1) return;
			var h = self.takeHour(t2);
			if(self.takeHour(t1) != h){
				pushArr(t1,h-1);
				pushArr(h,t2);
				return;
			}
			var count = 0;
			for (var i=0;i<hours.length;i++){
				if(hours[i].h == h){
					hours[i].periods.push({ startTime: t1, endTime: t2})
					count++;
					break;
				}
			}
			if(count == 0){
				hours.push({h: h, periods: [{startTime: t1, endTime: t2}]});
			}
		}
		for(var i = 0; i < list.length; i++){
			var obj = list[i];
			pushArr(obj.startTime,obj.endTime);
		}

		hours.sort(function (a, b) {
			return a.h - b.h
		});

		var result = [];
		for(var i = 0; i < hours.length; i++){
			var periods = hours[i].periods;
			periods.sort(function (a, b) {
				return a.startTime - b.startTime
			});
			var p = undefined;
			for(var hi = 0; hi < periods.length; hi++){
				if(p == undefined){
					p = {
						startTime: periods[hi].startTime,
						endTime: periods[hi].endTime
					}
				}else{
					if(p.endTime >= periods[hi].startTime-precision_ms){
						p.endTime = periods[hi].endTime;
					}else{
						result.push({startTime: p.startTime, endTime: p.endTime});
						p = {
							startTime: periods[hi].startTime,
							endTime: periods[hi].endTime
						}
					}
				}
			}
			if(p != undefined){
				result.push({startTime: p.startTime, endTime: p.endTime});
			}
		}
		return result;
		return [];
	};
};
