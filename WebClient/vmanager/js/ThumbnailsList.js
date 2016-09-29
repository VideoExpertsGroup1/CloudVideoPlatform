window.ThumbnailsList = function (event){
	var self = this;
	self.event = event;
	this.description = "Class ThumbnailsList For SkyVR";
	self.buffer = {};

	// cache by every 1 hour
	self.durationGrid = 3600000;
	
	this.searchThumbnail = function(timestamp,scale){
		// prepare timestamp
		var sc = Math.floor((scale > 30*60 ? 30*60 : scale)/2);
		timestamp = (timestamp - timestamp % 1000)/1000;
		var min = timestamp - 2*sc;
		var max = timestamp + sc;
		var t = self.normalizeT(timestamp);
		if(self.buffer[t]){
			var arr = self.buffer[t].filter(function(o){ return o.timeStamp >= min && o.timeStamp <= max; });
			if(arr.length > 0){
				// TODO search min distance
				var ind = 0;
				var min_dist = 600;
				for(var i = 0; i < arr.length; i++){
					var dist = Math.abs(arr[i].timeStamp - timestamp);
					if(dist < min_dist){
						ind = i;
						min_dist = dist;
					}
				}
				return arr[ind];
			}
		}
		return undefined;
	};

	this.removeBefore = function(time){
		var t = self.normalizeT(time);
		var prev_t = t - self.durationGrid;
		var res = 0;
		if(self.buffer[prev_t]){
			var len = self.buffer[prev_t].length;
			self.buffer[prev_t] = self.buffer[prev_t].filter(function(el){ return el.timeStamp > time; })
			var removed = (len - self.buffer[prev_t].length);
			if(self.buffer[prev_t].length == 0){
				delete self.buffer[prev_t];
			}
			res += removed;
		}
		if(self.buffer[t]){
			var len = self.buffer[t].length;
			self.buffer[t] = self.buffer[t].filter(function(el){ return el.timeStamp > time; })
			var removed = (len - self.buffer[t].length);
			if(self.buffer[t].length == 0){
				delete self.buffer[t];
			}
			res += removed;
		}
		return res;
	}

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp%self.durationGrid;
		return tmp;
	}

	this.applySortUniq = function(t){
		self.buffer[t].sort(function (a, b) {
			return a.timeStamp - b.timeStamp
		});
		var len = self.buffer[t].length;
		if(len > 1){
			var o = self.buffer[t][0];
			for (var i=1;i<len-1;i++){
				if(o.timeStamp == self.buffer[t][i].timeStamp){
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
				console.error("res.concat");
				return;
			}
			// filter by camid
			var camid = SkyVR.cameraID();
			res = res.filter(function(e){ return e.camid == camid; });
			var for_uniq = [];
			for(var i = 0; i < res.length; i++){
				var o = res[i];
				o.timeStamp = Date.parse(o.time + "Z");
				o.timeStamp = (o.timeStamp - o.timeStamp % 1000)/1000;

				var part = self.normalizeT(res[i].timeStamp);
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
			}
			d.resolve();
		}finally{
			this.lock = false;
		}
		return d.promise();
	};
};
