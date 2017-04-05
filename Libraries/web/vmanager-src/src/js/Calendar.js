window.Calendar = new function (){
	this.description = "Cloud Calendar";
	var self = this;
	this.activeDate = null;
	this.activeMonthDate = { month: 1, date: 1};
	this.curActiveDays = [];
	this.data = [];
	this.hashTable = [];
	this.init = false;
	this.timeouts = [];
	this.event = null;
            
	this.initialize = function(event){
		this.init = true;
		this.event = event;
		this.curActiveDays = [];
		Calendar.activeDate = new Date(CloudAPI.getCurrentTimeUTC());
		this._prepareData([]);
		this.buildCalendar();
	}

	this.getMonthNum = function(dt){
		return dt.getUTCMonth() + 1;
	}
	this.nextMonth = function () {
		var tmp = new Date(Calendar.activeDate);
		tmp.setUTCDate(1);
		tmp.setUTCMonth(tmp.getUTCMonth() + 1);
		return tmp;
	}
	this.prevMonth = function () {
		var tmp = new Date(Calendar.activeDate);
		tmp.setUTCDate(1);
		tmp.setUTCMonth(tmp.getUTCMonth() - 1);
		return tmp;
	}
	
	this.drawActivityDate = function(month, date){
		if(Calendar.activeMonthDate.month != month || Calendar.activeMonthDate.date != date){
			Calendar.activeMonthDate.month = month;
			Calendar.activeMonthDate.date = date;
			// $('.calendar .days strong').removeClass('active');	
			// console.log("drawActivityDate. month: " + month + ", date: " + date);
			var els = $('.calendar .days strong');
			for(var i = 0; i < els.length; i++){
				// console.log(els[i]);
			}
		}
	}
	
	this.renderCalendar = function () {
		console.log("[CALENDAR] Render called");
		var self = this;
		if(self.init == undefined){
			console.log("[CALENDAR] Render ended. activeSession is undefined");
			return;
		}
		var callback =  function (err, reslt) {
			if(self.init == undefined){
				console.log("[CALENDAR] Render ended. activeSession is undefined");
				return;
			}
			self.data = reslt.objects;
			self._prepareData(self.data);
			self.buildCalendar();
			self.bindEvents();
			console.log("[CALENDAR] Render ended");
		}
		// set empty data
		self._prepareData([]);
		self.buildCalendar();
		var cam = CloudAPI.cache.cameraInfo();
		console.log("[CALENDAR] Camera cache ", cam);
		console.log("[CALENDAR] Camera cameraID ", CloudAPI.config.cameraID);
		
		console.log("[CALENDAR] is p2p_streaming: ", CloudAPI.isP2PStreaming());
		if (CloudAPI.isP2PStreaming()){
			console.log("[CALENDAR] Camera is P2P");
			if (!cam){
				console.log("[CALENDAR] Camera did not found");
				return;
			}else if (cam && cam.status != "active"){
				console.log("[CALENDAR] Camera is not active");
				return;
			}

			var defer = $.Deferred();
			defer.done(function (data) {
				console.log("[CALENDAR] Data recived start render");
				callback(false,data);
			}).fail(function () {
				console.log("[CALENDAR] Data NOT recived start render & try get data after 10 sec ");
			});
			self.buildCalendar();
			P2PProvider.getActivity(defer);
		} else {
			console.log("[CALENDAR] Camera is Cloud mode");
			CloudAPI.storageActivity().done(function(data){
				// var test_array = JSON.parse('{"meta": {"previous": null, "total_count": 1, "offset": 0, "limit": 0, "next": null}, "objects": ["2016-10-31"]}');
				// callback(false,test_array);
				callback(false,data);
			});
		}
	}

	this.fixView = function () {
		var prev = new Date(Calendar.activeDate);
		prev.setUTCDate(1);
		prev.setUTCMonth(prev.getUTCMonth() - 1);
		prev = this.activeMonth(prev.getUTCFullYear(), Calendar.getMonthNum(prev));
		var next = new Date(Calendar.activeDate);
		next.setUTCDate(1);
		var year = next.getUTCFullYear();
		next.setUTCMonth(next.getUTCMonth()+1);
		next = this.activeMonth(next.getUTCFullYear(), Calendar.getMonthNum(next));
		var month = new Date(Calendar.activeDate).format('mmmm');
		$('.calendar .current-month').text(app.polyglot.t(month) + " " + year);
		$('.calendar .month').removeClass('next prev');
		if(next){
			$('.calendar .month').addClass('next');
		}
		if(prev){
			$('.calendar .month').addClass('prev');
		}
		var calendar_days = '<span>' + app.polyglot.t('calendar_sunday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_monday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_tuesday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_wednesday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_thursday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_friday_short') + '</span>'
			+ '<span>' + app.polyglot.t('calendar_saturday_short') + '</span>';
		$('.calendar .header').html(calendar_days);
	}

	this._prepareData = function (dat) {
		var list = Object.create({});
		this.maxDate = null;
		_.each(dat, function (el) {
			var calendarDate = new Date(el);
			self.maxDate = self.maxDate && self.maxDate > calendarDate ?  self.maxDate : calendarDate;
			var year = calendarDate.getUTCFullYear();
			var month = calendarDate.getUTCMonth() + 1;
			var date = calendarDate.getUTCDate();
			list[year] = list[year] || {};
			list[year][month] = list[year][month] || {};
			list[year][month][date] = list[year][month][date] = true;
		});
		this.hashTable = list;
		console.log(list);
	}
	
	this.getDaysInMonths = function (dt) {
		var tmp = new Date(Calendar.activeDate);
		tmp.setUTCDate(1);
		var monNum = tmp.getUTCMonth();
		var max_day = 28
		tmp.setUTCDate(max_day);
		while(monNum == tmp.getUTCMonth()){
			max_day++;
			tmp.setUTCDate(max_day);
		}
		max_day--;
		return max_day;
	}
	
	this.setDaysWithActivity = function (dt) {
		var d = dt || new Date(dt);
		if (!this.activeMonth(d.getUTCFullYear(), Calendar.getMonthNum(d))) {
			return [];
		}
		var year = d.getFullYear();
		var month = Calendar.getMonthNum(d);
		var tmp = this.hashTable[year][month];
		this.curActiveDays = _.isObject(tmp) ? tmp : [];
	}
	this.activeMonth = function (year, month) {
		return _.isObject(this.hashTable[year]) && _.isObject(this.hashTable[year][month]);
	}

	this.onClickDay = function(e){
		$('.calendar .days strong').removeClass('active');
		$(this).addClass('active');
		self.event.trigger(self.event.CALENDAR_DATE_CHANGED, $(this).data());
	}

	this.buildCalendar = function () {
		var tmp = new Date(Calendar.activeDate);
		tmp.setUTCDate(1);
		var cDays = self.getDaysInMonths(Calendar.activeDate);

		self.setDaysWithActivity(Calendar.activeDate);

		self.outer = $('.calendar .days');
		self.outer.html('');
		var ctr = 0;
		var getPrevDays = function (day) {
			var tmp1 = new Date(day);
			tmp1.setUTCDate(0);
			var pevMonthLastDay = tmp1.getUTCDate();
			var ret = [];
			while (pevMonthLastDay){
				ret.push(pevMonthLastDay);
				pevMonthLastDay -=1;
			}
			return ret;
		}
		var prevMonthDays = getPrevDays(tmp);
		var td = tmp.getUTCDay();
		for (var i = td-1; i >=0; i--) {
			this.outer.append($("<span style='color: #969696;'>"+prevMonthDays[i]+"</span>"));
		}
		prevMonthDays.reverse();
		for (var i = 0; i < cDays; i++) {
			var d = i + 1;
			if (self.curActiveDays[d]) {
				this.outer.append($("<strong>" + (d) + "</strong>").data('day', d).data('month', tmp.getUTCMonth()).data('year', tmp.getUTCFullYear()).click(Calendar.onClickDay));
			} else {
				this.outer.append($("<span>" + (d) + "</span>"));
			}
		}
		tmp.setUTCDate(cDays);
		var counter = 0;
		for (var i = tmp.getUTCDay(); i < 6; i++) {
			this.outer.append($("<span style='color: #969696;'>"+prevMonthDays[counter]+"</span>"));
			counter++;
		}
		var len = $('.days').children().length;
		if(len < 42){
			while($('.days').children().length != 42){
				this.outer.append($("<span style='color: #969696;'>"+prevMonthDays[counter]+"</span>"));
				counter++;
			}
		}
		this.curActiveDays = [];
		this.fixView();
	}

	this.bindEvents = function () {
		$('.calendar .month .next').unbind().click(function () {
			Calendar.activeDate = Calendar.nextMonth();
			self.buildCalendar();
		});
		$('.calendar .month .prev').unbind().click(function () {
			Calendar.activeDate = Calendar.prevMonth();
			self.buildCalendar();
		});
	}
	
	this.dispose = function(){
		$('.calendar .days').html('');
		$('.calendar .current-month').text("");
		$('.calendar .month').removeClass('next prev');
		$('.calendar .header').html('');
		self.init = false;
		self.activeDate = null;
	}
	
	this.cleanup = function(){
		$('.calendar .days').html('');
		$('.calendar .current-month').text("");
		$('.calendar .month').removeClass('next prev');
		$('.calendar .header').html('');
		self.init = false;
		self.curActiveDays = [];
		self.hashTable = [];
		self.activeDate = new Date(CloudAPI.getCurrentTimeUTC());
		self.buildCalendar(); // empty
	}
}();
