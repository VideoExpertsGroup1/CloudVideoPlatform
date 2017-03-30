window.TimelineLoader = function (event){
	var self = this;
	self.event = event;
	this.description = "Class timeline loader for Cloud";

	// cache by every 3 hours
	this.durationGrid = 10800000;

	if(CloudAPI.isP2PStreaming()){
		// in p2p mode camera can work only with 24 hours
		this.durationGrid = 86400000;
	}

	this.clearAllData = function(){
		self.recordList = new RecordList(self.event);
		self.eventList = new EventList(self.event);
		self.thumbnailList = new ThumbnailsList(self.event);
		self.eventsLoaded = new Array();
		self.recordsLoaded = new Array();
		self.thumbnailsLoaded = new Array();
	}

	this.clearAllData();

	this.getEventsMinifier = function(scale_sec, startTime, endTime){
		return self.eventList.minifier(scale_sec, startTime, endTime);
	}
	
	this.getEventsFullList = function(){
		var res = [];
		for(i in self.eventList.buffer){
			res = res.concat(self.eventList.buffer[i]);
		}
		return res;
	}

	this.searchThumbnail = function(t,scale){
		return self.thumbnailList.searchThumbnail(t,scale);
	}

	this.getRecordsMinifier = function(scale_sec, startTime, endTime){
		return self.recordList.minifier(scale_sec, startTime, endTime);
	}

	this.startDataPoling = function(){
		clearInterval(self.polingInterval);
		var polingTime = 30000;
		if(CloudAPI.isP2PStreaming())
			polingTime = 5*60000;

		function polingFunc(){
			var lastEndTime = self.recordList.lastEndTime();
			// var startTime = lastEndTime ? (lastEndTime - polingTime) : (CloudAPI.getCurrentTimeUTC() - 5*polingTime);
			var startTime = CloudAPI.getCurrentTimeUTC() - 5*polingTime;
			if(!CloudAPI.isP2PStreaming()){
				var startDT = CloudAPI.convertUTCTimeToUTCStr(startTime);
				CloudAPI.storageData(startDT).done(function(data){
					self.recordList.append(data.objects); // TODO make use done
				});
				CloudAPI.storageEvents(startDT).done(function(data){
					self.eventList.append(data.objects); // TODO make use done
				});
				CloudAPI.storageThumbnails(startDT).done(function(data){
					self.thumbnailList.append(data.objects); // TODO make use done
				});

				// poling firsts data
				CloudAPI.storageDataFirstRecord().done(function(record){
					var val = new Date(record.start + 'Z').getTime();
					if(!self.firstDataRecordTime) self.firstDataRecordTime = val;
					if(self.firstDataRecordTime < val){
						var prev = self.firstDataRecordTime;
						self.firstDataRecordTime = val;
						var cn = self.recordList.removeBefore(self.firstDataRecordTime);
						if(cn > 0)
							self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, prev, val);
					}
				});

				CloudAPI.storageEventsFirstRecord().done(function(record){
					var val = new Date(record.time + 'Z').getTime();
					if(!self.firstEventRecordTime) self.firstEventRecordTime = val;
					if(self.firstEventRecordTime < val){
						var prev = self.firstDataRecordTime;
						self.firstEventRecordTime = val;
						var cn = self.eventList.removeBefore(self.firstEventRecordTime);
						if(cn > 0)
							self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, prev, val);
					}
				});

				CloudAPI.storageThumbnailsFirstRecord().done(function(thumb){
					var val = new Date(thumb.time + 'Z').getTime();
					if(!self.firstThumbnailTime) self.firstThumbnailTime = val;
					if(self.firstThumbnailTime < val){
						self.firstThumbnailTime = val;
						self.thumbnailList.removeBefore(self.firstThumbnailTime);
					}
				});
			}else{
				// TODO p2p poling
				// TODO must be load lasts page
				P2PProvider.loadData(startTime).done(function(records, events){
					self.recordList.append(records.objects); // TODO make use done
					self.eventList.append(events.objects); // TODO make use done
				}).fail(function(){
					console.error("[TIMELINELOADER] Could not load data from p2p cam");
				});
			}
		}

		polingFunc();
		self.polingInterval = setInterval(polingFunc,30000);
	};

	this.stopDataPoling = function(){
		clearInterval(self.polingInterval);
	}

	this.isExistingRecord = function(t){
		var rec = self.recordList.recordDuringOrAfter(t);
		if(!rec) return false;
		return (t >= rec.startTime  && rec.endTime >= t);
	};

	this.getRecordsLoading = function(){
		var result = [];
		var curTime = CloudAPI.getCurrentTimeUTC();
		for(var e in this.recordsLoaded){
			var start = parseInt(e,10);
			var end = start + this.durationGrid;
			if(this.recordsLoaded[start].status == 0 && curTime > end){
				result.push({start: start, end: end});
			}
		}
		return result;
	}

	this.getEventsLoading = function(){
		var result = [];
		var curTime = CloudAPI.getCurrentTimeUTC();
		for(var e in this.eventsLoaded){
			var start = parseInt(e,10);
			var end = start + this.durationGrid;
			if(this.eventsLoaded[start].status == 0 && curTime > end){
				result.push({start: start, end: end});
			}
		}
		return result;
	}

	this.getLaststData = function(){
		if(!this['lastsDataTime']){
			this['lastsDataTime'] = CloudAPI.getCurrentTimeUTC();
		}
		var el = this.eventList.last();
		if(el){
			this['lastsDataTime']
			el.startTime
		}
	}

	this.loadEventsPortion = function(i){
		var d = $.Deferred();	
		if(this.eventsLoaded[i].status != 0){
			d.resolve();
			return d;
		}
		var self = this;
		var startDT = CloudAPI.convertUTCTimeToUTCStr(i);
		var endDT = CloudAPI.convertUTCTimeToUTCStr(i + this.durationGrid);
		// console.log("[TIMELEINELOADER] Loading events 3 hours of data from " + startDT);
		CloudAPI.storageEvents(startDT, endDT).done(function(data){
			var result = data.objects;
			if(!result.concat){
				console.error("[TIMELINE] res.concat");
				return;
			}
			if(self.eventsLoaded[i]){
				self.eventsLoaded[i].status = 1;
				self.eventList.append(result);
				d.resolve();
			}else{
				d.reject();
			}
		});
		return d;
	};

	this.loadThumbnailsPortion = function(i){
		var d = $.Deferred();
		if(this.thumbnailsLoaded[i].status != 0) {
			d.resolve();
			return d;
		}
		var self = this;
		var startDT = CloudAPI.convertUTCTimeToUTCStr(i);
		var endDT = CloudAPI.convertUTCTimeToUTCStr(i + this.durationGrid);
		CloudAPI.storageThumbnails(startDT, endDT).done(function(data){
			var result = data.objects;
			if(self.thumbnailsLoaded[i]){
				self.thumbnailList.append(result).done(function(){
					self.thumbnailsLoaded[i].status = 1;
					d.resolve();
				}).fail(function(){
					d.reject();
				})
			}else{
				d.reject();
			}
		});
		return d;
	}

	this.loadRecordsPortion = function(i){
		var d = $.Deferred();
		if(this.recordsLoaded[i].status != 0) {
			d.resolve();
			return d;
		}
		var self = this;
		var startDT = CloudAPI.convertUTCTimeToUTCStr(i);
		var endDT = CloudAPI.convertUTCTimeToUTCStr(i + this.durationGrid);
		// console.log("[TIMELEINELOADER] Loading records 3 hours of data from " + startDT);

		CloudAPI.storageData(startDT, endDT).done(function(data){
			var result = data.objects;
            self.recordList.append(result).done(function(){
				if(self.recordsLoaded[i]){
					self.recordsLoaded[i].status = 1;
					// self.recordsLoaded[i].d = undefined;
					d.resolve();
				}else{
					d.reject();
				}
			}).fail(function(){
				d.reject();
			});
		});
		return d;
	};

	this.loadP2PDataPortion = function(i){
		var d = $.Deferred();
		if(this.recordsLoaded[i].status != 0) {
			d.resolve();
			return d;
		}
		P2PProvider.loadData(i).done(function(records, events){
			self.recordList.append(records.objects).done(function(){
				self.recordsLoaded[i].status = 1;
				d.resolve();
			}); // TODO make use done
			self.eventList.append(events.objects); // TODO make use done
			self.eventsLoaded[i].status = 1;
		}).fail(function(){
			self.eventsLoaded[i].status = 1;
			d.reject();
		});
		return d;
	}

	this.normalizeT = function(t){
		var tmp = t;
		tmp = tmp - tmp%1000;
		tmp = tmp - tmp % this.durationGrid;
		return tmp;
	}

	this.isLoaded = function(start,end){
		// normilize - remove ms
		var start_grid = this.normalizeT(start);
		var end_grid = this.normalizeT(end);
		var bResult = true;
		for(var i = start_grid; i <= end_grid; i = i + this.durationGrid){
			if(this.recordsLoaded[i] == undefined){
				bResult = false;
			}else if(this.recordsLoaded[i].status == 0){
				bResult = false;
			}
			if(this.eventsLoaded[i] == undefined){
				bResult = false;
			}else if(this.eventsLoaded[i].status == 0){
				bResult = false;
			}
		}
		return bResult;
	}
	this.isLoad = this.isLoaded;

	this.load = function(start, end){
		var d = $.Deferred();

		var start_grid = this.normalizeT(start);
		var end_grid = this.normalizeT(end);
		var d_all = [];
		for(var i = start_grid; i <= end_grid; i = i + this.durationGrid){
			var ev = 0;
			if(!CloudAPI.isP2PStreaming()){
				if(this.recordsLoaded[i] == undefined){
					this.recordsLoaded[i] = { status: 0 };
					this.recordsLoaded[i].d = this.loadRecordsPortion(i);
					d_all.push(this.recordsLoaded[i].d);
				}else if(this.recordsLoaded[i].status == 0){
					d_all.push(this.recordsLoaded[i].d);
				}

				if(this.eventsLoaded[i] == undefined){
					this.eventsLoaded[i] = { status: 0 };
					this.eventsLoaded[i].d = this.loadEventsPortion(i);
					d_all.push(this.eventsLoaded[i].d);
				}else if(this.eventsLoaded[i].status == 0){
					d_all.push(this.eventsLoaded[i].d);
				}

				if(this.thumbnailsLoaded[i] == undefined){
					this.thumbnailsLoaded[i] = {status: 0};
					this.thumbnailsLoaded[i].d = this.loadThumbnailsPortion(i)
				}
			}else if(CloudAPI.isP2PStreaming() && CloudAPI.hasMemoryCard()){
				if(this.recordsLoaded[i] == undefined || this.eventsLoaded[i] == undefined){
					this.recordsLoaded[i] = { status: 0 };
					this.eventsLoaded[i] = { status: 0 };
					this.recordsLoaded[i].d = this.loadP2PDataPortion(i);
					this.eventsLoaded[i].d = this.recordsLoaded[i].d;
					d_all.push(this.recordsLoaded[i].d);
				}else if(this.recordsLoaded[i].status == 0 || this.eventsLoaded[i].status == 0){
					d_all.push(this.recordsLoaded[i].d);
				}
			}

			if(d_all.length > 0)
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADING, start_grid, end_grid);
		}
		if(d_all.length > 0){
			$.when.apply($, d_all).done(function(){
				self.event.trigger(self.event.TIMELINE_PORTION_DATA_LOADED, start_grid, end_grid);
				d.resolve();
			}).fail(function(){
				d.reject();
			});
		}else{
			d.resolve();
		}
		return d;
	};

	this.searchFirstRecord = function(t, def){
		var d = def || $.Deferred();
		var start = self.normalizeT(t - 15*60*1000);
		var end = self.normalizeT(t + self.durationGrid);
		if(!self.isLoaded(start,end)){
			self.event.trigger(self.event.TIMELINE_LOADING);
		}
		self.load(start,end).done(function(){
			var rec = self.recordList.recordDuringOrAfter(t);
			if(rec && rec.startTime <= end){
				self.event.trigger(self.event.TIMELINE_LOADED);
				d.resolve(rec);
			}else if(end <= self.normalizeT(CloudAPI.getCurrentTimeUTC() + self.durationGrid)){
				// clever search
				self.searchFirstRecord2(end, d);
			}else{
				self.event.trigger(self.event.TIMELINE_LOADED);
				d.reject();
			}
		});
		return d.promise();
	};
	
	this.searchFirstRecord2 = function(t, def){
		// try skip empty block records (request to cloud)
		var d = def || $.Deferred();
		var startDT = CloudAPI.convertUTCTimeToUTCStr(t);
		CloudAPI.storageDataFirstRecord(startDT).done(function(r){
			console.log("[TIMELINE_LOADER]", r);
			var t = CloudAPI.parseUTCTime(r.start);
			self.searchFirstRecord(t, d);
		}).fail(function(){
			d.reject();
		});
		return d.promise();
	}

	this.searchNextRecord = function(t, def){
		var d = def || $.Deferred();
		var start = t - 999;
		var end = t + self.durationGrid;
		if(!self.isLoaded(start,end))
			self.event.trigger(self.event.TIMELINE_LOADING);
		self.load(start,end).done(function(){
			var rec = self.recordList.afterTime(t - 999);
			if(rec &&  rec.startTime <= end){
				self.event.trigger(self.event.TIMELINE_LOADED);
				d.resolve(rec);
			}else if(end < CloudAPI.getCurrentTimeUTC()){
				// clever search
				// self.searchNextRecord(end, d);
				self.searchNextRecord2(end, d);
			}else{
				self.event.trigger(self.event.TIMELINE_LOADED);
				d.reject();
			}
		});
		return d.promise();
	};
	
	this.searchNextRecord2 = function(t, def){
		// try skip empty block records (request to cloud)
		var d = def || $.Deferred();
		var startDT = CloudAPI.convertUTCTimeToUTCStr(t);
		CloudAPI.storageDataFirstRecord(startDT).done(function(r){
			console.log("[TIMELINE_LOADER]", r);
			var t = CloudAPI.parseUTCTime(r.start);
			self.searchNextRecord(t, d);
		}).fail(function(){
			d.reject();
		});
		return d.promise();
	}
};
