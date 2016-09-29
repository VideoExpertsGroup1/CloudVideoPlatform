window.EventList = function (event){
	var self = this;
	self.event = event;
	self.description = "Class EventList For SkyVR";
	self.buffer = new Array();
	
	// cache by every 3 hours
	self.durationGrid = 10800000;

	this.minifier0002sec = new Array();
	this.minifier0036sec = new Array();
	this.minifier0450sec = new Array();

	this.minifier = function(scale_sec, startTime, endTime){
		var st = self.normalizeT(startTime);
		var et = self.normalizeT(endTime);
		var res = [];
		var mini = '';
		if(scale_sec > 0 && scale_sec <= 15){
			mini = 'minifier0002sec';
		}else if(scale_sec > 15 && scale_sec <= 60){
			mini = 'minifier0036sec';
		}else if(scale_sec > 60 && scale_sec <= 700){
			mini = 'minifier0450sec';
		}
		if(self[mini]){
			for(var i = st; i <= et; i += self.durationGrid){
				if(self[mini][i]){
					res = res.concat(self[mini][i]);
				}
			}
		}
		return res;
	}

	this.applySortUniq = function(t){
		self.buffer[t].sort(function (a, b) {return a.time - b.time});
		var len = self.buffer[t].length;
		if(len > 1){
			var o = self.buffer[t][0];
			for (var i=1;i<len-1;i++){
				if(o.time == self.buffer[t][i].time){
					self.buffer[t].splice(i,1);
					i--;
					len = self.buffer[t].length;
				}else{
					o = self.buffer[t][i];
				}
			}
		}
	};

	this.removeBefore = function(time){
		function funcdel(t){
			var res = 0;
			if(self.buffer[t]){
				var len = self.buffer[t].length;
				self.buffer[t] = self.buffer[t].filter(function(el){ return el.startTime > time; })
				var removed = (len - self.buffer[t].length);
				if(self.buffer[t].length == 0){
					delete self.buffer[t];
					delete self.minifier0002sec[t];
					delete self.minifier0036sec[t];
					delete self.minifier0450sec[t];
				}else if(removed > 0){
					self.minifier0002sec[t] = self.makeMinifier(2, t);
					self.minifier0036sec[t] = self.makeMinifier(36, t);
					self.minifier0450sec[t] = self.makeMinifier(450, t);
				}
				res += removed;
			}
			return res;
		}
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		var res = funcdel(prev_t);
		res += funcdel(t);
		return res;
	}

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp % self.durationGrid;
		return tmp;
	}
	
	this.lock = false;
	this.append = function(res){
		if(this.lock){
			var res2 = res;
			setTimeout(function(){ self.append(res2); },100);
			return;
		}
		// console.log("Set eventlist lock");
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
				res[i].isoTime = res[i].time;
				res[i].time = Date.parse(res[i].isoTime + "Z");
				if(res[i].thumb){
					delete res[i].thumb;
				}
				minT = minT == undefined ? res[i].time : Math.min(minT, res[i].time);
				maxT = maxT == undefined ? res[i].time : Math.max(maxT, res[i].time);

				var part = self.normalizeT(res[i].time);
				if(for_uniq.indexOf(part) == -1){
					for_uniq.push(part);
				}
				if(!self.buffer[part]){
					self.buffer[part] = [];
				}
				self.buffer[part].push(res[i]);
			}

			for(var i in for_uniq){
				var t = for_uniq[i];
				self.applySortUniq(t);
				self.minifier0450sec[t] = self.makeMinifier(450, t);
				self.minifier0036sec[t] = self.makeMinifier(36, t);
				self.minifier0002sec[t] = self.makeMinifier(2, t);
			}
			if(minT && maxT)
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, minT, maxT);
		}finally{
			// console.log("Unset eventlist lock");
			this.lock = false;
		}
	};
	this.applyConcat = this.append;

	this.makeMinifier = function(scale_sec, t){
		scale_sec = scale_sec || 30;
		var result = [];
		var u = [];
		var list = self.buffer[t];
		for(var i = 0; i < list.length; i++){
			var obj = list[i];
			var new_obj = {}
			new_obj.time = obj.time - obj.time % (scale_sec*1000);
			if(u.indexOf(new_obj.time) == -1){
				new_obj.name = obj.name;
				result.push(new_obj);
				u.push(new_obj.time);
			};
		}
		result.sort(function (a, b) {return a.time - b.time});
		return result;
		return [];
	};

	
};
