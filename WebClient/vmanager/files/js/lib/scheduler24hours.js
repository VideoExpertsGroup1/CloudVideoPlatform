/*
 * Library: Scheduler24hours.js
 * Author: Evgenii Sopov <mrseakg@gmail.com>
 * Sep 2015 - Oct 2015.
 * */

function myInterval(x1,x2) {
	this.x1 = x1;
	this.x2 = x2;
	this.has = function(x) {
		return (this.x1 < x && x < this.x2);
	}
	this.isMore = function(x) {
		return (x > this.x1 && x > this.x2);
	}
	this.isLess = function(x) {
		return (x < this.x1 && x < this.x2);
	}
	this.isEmpty = function() {
		return this.x1 == this.x2;
	}
};

window.Scheduler24 = new function () {
	this.config = {
		padding: 30,
		dR1R2: 50, // distance between r1 and r2
		dR2R3: 40, // distance between r2 and r3
		dR3R4: 40, // distance between r3 and r4
		caretWidth: 15, // radius of caret for editing interval
		background : '#bdd9e7',
		allowAddIntervalByClickOnSegmentsOfArea: true,
		replaceByEventToOn: false,
		title : {
			background : '#fff',
			caption : 'Sheduler',
			height : '30px',
			color: '#3876a5'
		},
		buttons: {
			color: '#3876a5',
			color2: '#208fb8', // selected text color
			inactive: '#d5e7f3', // selected text color
			background2: '#cbe6f4', // selected background color
			padding: 5, // padding for text
			// font: "bold 20px Arial",
			font: "bold 20px Akkurat,Helvetica,sans-serif",
		},
		day: "?",
		week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
		week_localization : {
			"?" : { "short" : "?", "caption": "?" },
			"monday" : { "short" : "Mon", "caption": "Monday1" },
			"tuesday" : { "short" : "Tuesday", "caption": "Tuesday" },
			"wednesday" : { "short" : "Wednesday", "caption": "Wednesday" },
			"thursday" : { "short" : "Thursday", "caption": "Thursday" },
			"friday" : { "short" : "Friday", "caption": "Friday" },
			"saturday" : { "short" : "Saturday", "caption": "Saturday" },
			"sunday" : { "short" : "Sunday", "caption": "Sunday" }
		},
		confirm_clean_all : "Are you sure to clean all segments?",
		confirm_forgot_changes : "Segments changed. Are you sure that you want forgot changes?",
		localization_week : "Week",
		localization_start : "Start",
		localization_stop : "Stop",
		base_api_url: "",
		cameraId: "",
		mode: "week",
		test: false
	};
	// will be result
	this.intervals = [
		// { start: '12:34', stop: '15:00', 'record' : 'on' },
		// { start: '09:07', stop: '10:30', 'record' : 'off' },
	];
	this.intervalsCache = [];
	
	this.tmpInterval = {
		draw: false,
		start: '00:00',
		end: '02:00'
	};
	this.networkprocess = false;
	this.networkoperation = "?";

	this.tmp = {
		tmpInterval_start_x1: 0,
		tmpInterval_start_y1: 0,
		tmpInterval_end_x1: 0,
		tmpInterval_end_y1: 0,
		bMove: false,
		tmpInterval_: '',
	};

	this.copyIntervals = [];

	this.legends = [
		{
			textColor: "#0d6a89",
			font: "bold 14px Akkurat,Helvetica,sans-serif",
			// "bold 10px/1.2 Akkurat,Helvetica,sans-serif"
			text: "Camera on:",
			show: true,
		},
		{
			color: "#00a2d9",
			textColor: "#00a2d9",
			font: "14px Akkurat,Helvetica,sans-serif",
			record: "on",
			text: "Continues recording",
			select: false,
			show: true,
			// x1, x2, y1, y2 will be init later
		},
		{
			color: "#ff7f00",
			textColor: "#ff7f00",
			font: "14px Akkurat,Helvetica,sans-serif",
			record: "by_event",
			text: "Event recording",
			select: false,
			show: true,
		},
		{
			color: "#aaaaaa",
			textColor: "#aaaaaa",
			font: "14px Akkurat,Helvetica,sans-serif",
			record: "off",
			text: "No recording",
			select: false,
			show: true,
		},
		{
			color: "#d5e7f1",
			textColor: "#0d6a89",
			font: "bold 14px Akkurat,Helvetica,sans-serif",
			record: "_",
			text: "Camera off",
			select: true,
			show: true,
		}
	];

	this.buttons = [
		{
			id: 'add',
			caption: "Add",
			x1: 10, y1: 10, x2: 60, y2: 35,
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.flushTmpInterval();
				}
				Scheduler24.addNewTmpInterval();
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return true; },
			isActive : function() { return true; }
		},
		{
			id: 'week',
			caption: "Week",
			x1: 10, y1: 40, x2: 60, y2: 65,
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.flushTmpInterval();
				}
				Scheduler24.config.mode = "week";
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return true; },
			isActive : function() { return true; }
		},
		{
			id: 'save',
			caption: "Save",
			x1: 535, y1: 515, x2: 590, y2: 540,
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.flushTmpInterval();
					Scheduler24.renderCanvas();
				}
				Scheduler24.save();
			},
			isDraw : function() { return true; }, //Scheduler24.tmpInterval.draw == true; },
			isActive : function() { return true; }
		},
		{
			id: 'clear',
			x1: 10, y1: 480, x2: 80, y2: 510,
			caption: "Clear",
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.tmpInterval.draw = false;
				}
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return false; },
			isActive : function() { return true; }
		},
		{
			id: 'fill_all',
			caption: "Fill All",
			x1: 10, y1: 515, x2: 115, y2: 540,
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.tmpInterval.draw = false;
				}
				if (Scheduler24.intervals[Scheduler24.config.day] == undefined)
					Scheduler24.intervals[Scheduler24.config.day] = [];

				if (Scheduler24.intervals[Scheduler24.config.day].length > 0) {
					if (window.confirm(Scheduler24.config.confirm_clean_all) == false) {
						return;
					}
				}
				Scheduler24.addInterval('00:00', '24:00', Scheduler24.selectedLegend().record);
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return true; },
			isActive : function() { return true; }
		},
		{
			id: 'start_increment',
			caption: "+", // start
			x1: 10, y1: 515, x2: 100, y2: 540,
			backgroundColor: "#fff",
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					var m = Scheduler24.timeToMin(Scheduler24.tmpInterval.start);
					m = (m + 1) > 1440 ? 0 : m + 1;
					Scheduler24.tmpInterval.start = Scheduler24.minToTime(m);
					Scheduler24.renderCanvas();
				}
			},
			isDraw : function() { return Scheduler24.tmpInterval.draw == true; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArraw(context, x, y, true);
			},
		},
		{
			id: 'start_decrement',
			caption: "-", // start
			x1: 10, y1: 515, x2: 100, y2: 540,
			backgroundColor: "#fff",
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					var m = Scheduler24.timeToMin(Scheduler24.tmpInterval.start);
					m = (m - 1) < 0 ? 1440 : m - 1;
					Scheduler24.tmpInterval.start = Scheduler24.minToTime(m);
					Scheduler24.renderCanvas();
				}
			},
			isDraw : function() { return Scheduler24.tmpInterval.draw == true; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArraw(context, x, y, false);
			},
		},
		{
			id: 'stop_increment',
			caption: "+", // stop
			x1: 10, y1: 515, x2: 100, y2: 540,
			backgroundColor: "#fff",
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					var m = Scheduler24.timeToMin(Scheduler24.tmpInterval.stop);
					m = (m + 1) > 1440 ? 0 : m + 1;
					Scheduler24.tmpInterval.stop = Scheduler24.minToTime(m);
					Scheduler24.renderCanvas();
				}
			},
			isDraw : function() { return Scheduler24.tmpInterval.draw == true; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArraw(context, x, y, true);
			},
		},
		{
			id: 'stop_decrement',
			caption: "-",
			x1: 10, y1: 515, x2: 100, y2: 540,
			backgroundColor: "#fff",
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					var m = Scheduler24.timeToMin(Scheduler24.tmpInterval.stop);
					m = (m - 1) < 0 ? 1440 : m - 1;
					Scheduler24.tmpInterval.stop = Scheduler24.minToTime(m);
					Scheduler24.renderCanvas();
				}
			},
			isDraw : function() { return Scheduler24.tmpInterval.draw == true; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArraw(context, x, y, false);
			},
		},
		{
			id: 'copy',
			caption: "Copy",
			x1: 10, y1: 515, x2: 100, y2: 540,
			click: function() {
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.copyIntervals = [];
					Scheduler24.copyIntervals.push({
						'start' : Scheduler24.tmpInterval.start,
						'stop' : Scheduler24.tmpInterval.stop,
						'record' : Scheduler24.selectedLegend().record
					});
				} else {
					Scheduler24.copyIntervals = [];
					var day = Scheduler24.config.day;
					for (var i = 0; i < Scheduler24.intervals[day].length; i++) {
						Scheduler24.copyIntervals.push({
							'start' : Scheduler24.intervals[day][i].start,
							'stop' : Scheduler24.intervals[day][i].stop,
							'record' : Scheduler24.intervals[day][i].record
						});
					}
				}
			},
			isDraw : function() { return true; },
			isActive : function() { return true; }
		},
		{
			id: 'paste',
			caption: "Paste",
			x1: 10, y1: 515, x2: 100, y2: 540,
			click: function() {
				if (Scheduler24.copyIntervals.length == 1) {
					Scheduler24.flushTmpInterval();
					Scheduler24.tmpInterval.draw = true;
					Scheduler24.tmpInterval.start = Scheduler24.copyIntervals[0].start;
					Scheduler24.tmpInterval.stop = Scheduler24.copyIntervals[0].stop;
					Scheduler24.selectLegend(Scheduler24.copyIntervals[0].record);
					Scheduler24.renderCanvas();
				} else if (Scheduler24.copyIntervals.length > 1) {
					Scheduler24.flushTmpInterval();
					var day = Scheduler24.config.day;
					Scheduler24.intervals[day] = [];
					for (var i = 0; i < Scheduler24.copyIntervals.length; i++) {
						Scheduler24.intervals[day].push({
							'start' : Scheduler24.copyIntervals[i].start,
							'stop' : Scheduler24.copyIntervals[i].stop,
							'record' : Scheduler24.copyIntervals[i].record
						});
					}
					Scheduler24.renderCanvas();
				}
			},
			isDraw : function() { return Scheduler24.copyIntervals.length > 0; },
			isActive : function() { return true; }
		},
		{
			id: 'day_left',
			caption: "Mon",
			x1: 10, y1: 35, x2: 60, y2: 55,
			day: "tuesday",
			chooseDay: "monday",
			click: function() {
				Scheduler24.config.day = this.chooseDay;
				Scheduler24.updateCaptionButtons();
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return Scheduler24.config.day == this.day; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArrawDay(context, x, y, this.caption, false);
			},
		},
		{
			id: 'day_right',
			caption: "Tue",
			x1: 10, y1: 35, x2: 60, y2: 55,
			day: "monday",
			chooseDay: "tuesday",
			click: function() {
				Scheduler24.config.day = this.chooseDay;
				Scheduler24.updateCaptionButtons();
				Scheduler24.renderCanvas();
			},
			isDraw : function() { return Scheduler24.config.day == this.day; },
			isActive : function() { return true; },
			draw : function(context) {
				var x = this.x1 + (this.x2 - this.x1)/2;
				var y = this.y1 + (this.y2 - this.y1)/2;
				Scheduler24.drawArrawDay(context, this.x1, y, this.caption, true);
			},
		},
	];

	this.findButtonById = function(id) {
		for (var i = 0; i < this.buttons.length; i++) {
			if (this.buttons[i].id == id) {
				return this.buttons[i];
			}
		}
	}

	this.drawArraw = function(context, x, y, left) {
		var d1,d2;
		if (left == true) {
			d1 = 3;
			d2 = -3;
		} else {
			d1 = -3;
			d2 = 3;
		}

		context.strokeStyle = "#0d6a89";
		context.fillStyle = "#0d6a89";
		context.beginPath();
		context.moveTo(x + d1, y);
		context.lineTo(x + d2, y - 5);
		context.lineTo(x + d2, y + 5);
		context.closePath();
		context.stroke();
		context.fill();
	}
	
	this.drawArrawDay = function(context, x, y, caption, leftArraw) {
		var d1,d2,d3;
		
		context.strokeStyle = "#ddf1fc";
		// context.fillStyle = "#fff";
		context.lineWidth = 2;
		
		if (leftArraw == true) {
			d1 = 15;
			d2 = 3;
			d3 = d1 + 7;
		} else {
			// TODO
			d1 = 14;
			d2 = d1 + 12;
			d3 = d1 - 7;
		}

		context.beginPath();
		context.moveTo(x + d2, y - 12);
		context.lineTo(x + d1, y);
		context.lineTo(x + d2, y + 12);
		// context.closePath();
		context.stroke();
		// context.fill();

		context.font = this.config.buttons.font;
		context.textAlign = leftArraw == true ? "left" : "right";
		context.textBaseline = "middle";
		context.fillText(caption, x + d3, y + 1);
	}

	this.isIntervalsChanged = function() {
		if (JSON.stringify(this.intervalsCache) != JSON.stringify(this.intervals))
			return true;
		
		/*for (var i = 0; i < this.intervals.length; i++) {
			if (this.intervalsCache[i].start != this.intervals[i].start
				|| this.intervalsCache[i].stop != this.intervals[i].stop
				|| this.intervalsCache[i].record != this.intervals[i].record)
				return true;
		}*/
		return false;
	}

	this.updateCaptionButtons = function() {
		// console.log("updateCaptionButtons");
		var day_left = this.findButtonById("day_left");
		var day_right = this.findButtonById("day_right");
		for (var i = 0; i < this.config.week.length; i++) {
			if (this.config.day == this.config.week[i]) {
				var i_prev = i - 1 < 0 ? this.config.week.length - 1 : i - 1;
				var i_next = (i + 1) % this.config.week.length;

				day_left.day = this.config.day;
				day_left.chooseDay = this.config.week[i_prev];
				day_left.caption = this.config.week_localization[this.config.week[i_prev]].short;
				day_right.day = this.config.day;
				day_right.chooseDay = this.config.week[i_next];
				day_right.caption = this.config.week_localization[this.config.week[i_next]].short;
			}
		}
	};
	
	this.calculateBtnWidth = function(context, btn) {
		context.font = this.config.buttons.font;
		return context.measureText(btn.caption).width;
		
	}
	
	this.calculateVars = function() {
		var canvas = document.getElementById(this.canvasId);
		if(canvas && canvas.getContext) {
			var context = canvas.getContext('2d');
			this.config.width = context.canvas.width;
			this.config.height = context.canvas.height;
			var d = this.config.width < this.config.height ? this.config.width : this.config.height;
			this.config.xc = this.config.width/2;
			this.config.yc = this.config.height/2;
			this.config.r1 = (d - this.config.padding)/2;
			this.config.r2 = this.config.r1 - this.config.dR1R2;
			this.config.r3 = this.config.r2 - this.config.dR2R3;
			this.config.r3tmp = this.config.r3 - this.config.dR3R4/2;
			this.config.r4 = this.config.r3 - this.config.dR3R4;

			var day_left = this.findButtonById("day_left");
			day_left.x1 = this.config.xc - this.config.r1 - 10 - 58;
			day_left.x2 = day_left.x1 + 65;
			day_left.y1 = this.config.yc - 25/2;
			day_left.y2 = this.config.yc + 25/2;
			
			var day_right = this.findButtonById("day_right");
			day_right.x1 = this.config.xc + this.config.r1 + 10;
			day_right.x2 = day_right.x1 + 65;
			day_right.y1 = this.config.yc - 25/2;
			day_right.y2 = this.config.yc + 25/2;

			this.updateCaptionButtons();

			var btnAdd = this.findButtonById("add");
			btnAdd.x2 = btnAdd.x1 + this.calculateBtnWidth(context, btnAdd) + 10;
			
			var btnWeek = this.findButtonById("week");
			btnWeek.x2 = btnWeek.x1 + this.calculateBtnWidth(context, btnWeek) + 10;

			var btnSave = this.findButtonById("save");
			btnSave.x1 = this.config.width - 20 - this.calculateBtnWidth(context, btnSave) - 10;
			btnSave.x2 = this.config.width - 20;
			
			btnSave.y1 = this.config.height - 35;
			btnSave.y2 = this.config.height - 10;

			var btnClear = this.findButtonById("clear");
			btnClear.y1 = this.config.height - 70;
			btnClear.y2 = this.config.height - 45;
			btnClear.x2 = btnClear.x1 + this.calculateBtnWidth(context, btnClear) + 10;

			var btnFillAll = this.findButtonById("fill_all");
			btnFillAll.y1 = this.config.height - 35;
			btnFillAll.y2 = this.config.height - 10;
			btnFillAll.x2 = btnFillAll.x1 + this.calculateBtnWidth(context, btnFillAll) + 10;
			
			var btnStartInc = this.findButtonById("start_increment");
			btnStartInc.y1 = this.config.yc - this.config.r4 + 4*this.config.r4/6 - 15;
			btnStartInc.y2 = btnStartInc.y1 + 27;
			btnStartInc.x1 = this.config.xc + (60 - 23);
			btnStartInc.x2 = btnStartInc.x1 + 23;

			var btnStartDec = this.findButtonById("start_decrement");
			btnStartDec.y1 = this.config.yc - this.config.r4 + 4*this.config.r4/6 - 15;
			btnStartDec.y2 = btnStartDec.y1 + 27;
			btnStartDec.x1 = this.config.xc - 60;
			btnStartDec.x2 = btnStartDec.x1 + 23;
			
			var btnStopInc = this.findButtonById("stop_increment");
			btnStopInc.y1 = this.config.yc + this.config.r4 - 4*this.config.r4/6 - 15;
			btnStopInc.y2 = btnStopInc.y1 + 27;
			btnStopInc.x1 = this.config.xc + (60 - 23);
			btnStopInc.x2 = btnStopInc.x1 + 23;
			
			var btnStopDec = this.findButtonById("stop_decrement");
			btnStopDec.y1 = this.config.yc + this.config.r4 - 4*this.config.r4/6 - 15;
			btnStopDec.y2 = btnStopDec.y1 + 27;
			btnStopDec.x1 = this.config.xc - 60;
			btnStopDec.x2 = btnStopDec.x1 + 23;

			var btnCopy = this.findButtonById("copy");
			btnCopy.x1 = this.config.width - this.calculateBtnWidth(context, btnCopy) - 25;
			btnCopy.y1 = this.config.height - 115;
			btnCopy.x2 = btnCopy.x1 + this.calculateBtnWidth(context, btnCopy) + 10;
			btnCopy.y2 = btnCopy.y1 + 25;

			var btnPaste = this.findButtonById("paste");
			btnPaste.x1 = this.config.width - this.calculateBtnWidth(context, btnPaste) - 25;
			btnPaste.y1 = this.config.height - 80;
			btnPaste.x2 = btnPaste.x1 + this.calculateBtnWidth(context, btnPaste) + 10;
			btnPaste.y2 = btnPaste.y1 + 25;
		
			var d_y1 = 10;
			for (var i = 0; i < this.legends.length; i++) {
				var legend = this.legends[i];
				if(!legend.show)
					continue;
				this.legends[i].x1 = this.config.width - 30;
				this.legends[i].y1 = d_y1;
				d_y1 += 25;
				if (this.legends[i].record != undefined) {
					this.legends[i].w = 20;
					this.legends[i].x2 = this.legends[i].x1 + this.legends[i].w;
					this.legends[i].h = 20;
					this.legends[i].y2 = this.legends[i].y1 + this.legends[i].h;
				}
			}
		}
	}

	this.load = function(day) {
		Scheduler24.config.mode = "week";
		console.log("[SCHEDULER24] Loading... ");
		
		if (Scheduler24.config.test) {
			Scheduler24.intervals = {
				"monday" : [
					{"start":"02:00","stop":"14:29","record":"on"},
					{"start":"14:30","stop":"21:52","record":"by_event"}
				],
				"tuesday" : [
					{"start" : "01:00", "stop" : "03:00","record" : "on"}
				],
				"thursday":[
					{"start":"00:00","stop":"15:59","record":"on"},
					{"start":"16:00","stop":"19:00","record":"by_event"},
					{"start":"19:01","stop":"20:59","record":"on"}
				],
				"friday":[
					{"start":"01:01","stop":"02:59","record":"on"},
					{"start":"03:00","stop":"05:42","record":"off"},
					{"start":"05:43","stop":"09:59","record":"on"},
					{"start":"10:00","stop":"13:00","record":"by_event"},
					{"start":"13:01","stop":"15:59","record":"on"},
					{"start":"16:00","stop":"19:00","record":"by_event"},
					{"start":"19:01","stop":"20:59","record":"on"}
				]
			};
			Scheduler24.intervalsCache = [];
			Scheduler24.tmpInterval.draw = false;
			Scheduler24.updateCaptionButtons();
			Scheduler24.renderCanvas();
			return;
		}
		
		Scheduler24.networkprocess = true;
		Scheduler24.networkoperation = "Loading...";
		Scheduler24.renderCanvas();

		var obj = {};
		Scheduler24.config.day = day.toLowerCase();
		Scheduler24.updateCaptionButtons();
		Scheduler24.intervals = { "monday" : [], "tuesday" : [] };
		Scheduler24.intervalsCache = { "monday" : [], "tuesday" : [] };
		Scheduler24.tmpInterval.draw = false;

		$.ajax({
			url: Scheduler24.config.base_api_url + "api/v2/cameras/" + Scheduler24.config.cameraId + "/schedule/",
			type: 'GET',
			success: function(data){
				for (var i = 0; i < Scheduler24.config.week.length; i++) {
					var day = Scheduler24.config.week[i];
					Scheduler24.intervals[day] = [];
					Scheduler24.intervalsCache[day] = [];
					if (data[day]) {
						inter = data[day];
						// console.log(JSON.stringify(inter));
						for(var i1 = 0; i1 < inter.length; i1++) {
							Scheduler24.intervals[day].push({
								'start' : inter[i1].start,
								'stop' : inter[i1].stop,
								'record' : inter[i1].record
							});
							Scheduler24.intervalsCache[day].push({
								'start' : inter[i1].start,
								'stop' : inter[i1].stop,
								'record' : inter[i1].record
							});
						}
					}
				}
				var nReplaces = 0;
				if(Scheduler24.config.replaceByEventToOn){
					console.log('[SCHEDULER] Ad-Hoc for replacement by_event -> on');
					for(var day in Scheduler24.intervals){
						for(var i1 = 0; i1 < Scheduler24.intervals[day].length; i1++) {
							if(Scheduler24.intervals[day][i1].record == 'by_event'){
								Scheduler24.intervals[day][i1].record = 'on';
								nReplaces++;
							}
						}
						Scheduler24.intervals[day] = Scheduler24.joinNeighborIntervals(Scheduler24.intervals[day]);
					}
				}
				// alert(JSON.stringify(data));
				Scheduler24.networkprocess = false;
				Scheduler24.renderCanvas();
				if(Scheduler24.config.replaceByEventToOn && nReplaces > 0){
					console.log('[SCHEDULER] Ad-Hoc for replacement. save');
					Scheduler24.save();
				}				
			},
			error: function(xhr, status, error) {
				alert("xhr.responseText" + xhr.responseText);
				Scheduler24.networkprocess = false;
				Scheduler24.renderCanvas();
			},
			data:  JSON.stringify(obj),
			contentType: 'json'
		});
	}
	
	this.save = function() {
		if (Scheduler24.config.test) {
			this.renderCanvas();
			return;
		}

		console.log("[SCHEDULER24] Saving... ");

		Scheduler24.networkprocess = true;
		Scheduler24.networkoperation = "Saving...";
		Scheduler24.renderCanvas();

		var obj = {};
		
		for (var i = 0; i < Scheduler24.config.week.length; i++) {
			var day = Scheduler24.config.week[i];
			obj[day] = [];
			Scheduler24.intervalsCache[day] = [];
			for (var i1 = 0; i1 < Scheduler24.intervals[day].length; i1++) {
				obj[day].push({
					'start' : Scheduler24.intervals[day][i1].start,
					'stop' : Scheduler24.intervals[day][i1].stop,
					'record' : Scheduler24.intervals[day][i1].record,
				});
				Scheduler24.intervalsCache[day].push({
					'start' : Scheduler24.intervals[day][i1].start,
					'stop' : Scheduler24.intervals[day][i1].stop,
					'record' : Scheduler24.intervals[day][i1].record,
				});
			}
		}

		var json_data = JSON.stringify(obj);

		var saving_url = Scheduler24.config.base_api_url + "api/v2/cameras/" + Scheduler24.config.cameraId + "/schedule/";
		console.log("Saving... URL: " + saving_url);
		console.log("Saving... Data: " + json_data);

		$.ajax({
			url: saving_url,
			type: 'PUT',
			success: function(data){
				console.log("Saving... Success: " + data);
				if (data == "")
					console.log("Scheduler24hours: saved");
				Scheduler24.networkprocess = false;
				Scheduler24.renderCanvas();
			},
			error: function(xhr, status, error) {
				// alert("status" + status);
				// alert("error" + error);
				console.log("Saving... error: [" + xhr.responseText + "]");
				alert("Saving... Error.xhr.responseText" + xhr.responseText);
				Scheduler24.networkprocess = false;
				Scheduler24.renderCanvas();
			},
			data: json_data,
			cache : false,
			contentType: 'json'
		});
	}
	
	this.localizeByPolyglot = function() {
		
		if(app.polyglot == undefined) {
			console.log("Scheduler24_Error: Not found polyglot object");
			return;
		}

		console.log("Scheduler24: begin localization!");
		this.config.confirm_clean_all = app.polyglot.t("scheduler24_confirm_clean_all");
		this.config.confirm_forgot_changes = app.polyglot.t("scheduler24_confirm_forgot_changes");
		this.config.localization_start = app.polyglot.t("scheduler24_start");
		this.config.localization_stop = app.polyglot.t("scheduler24_stop");

		this.findButtonById("save").caption = app.polyglot.t("scheduler24_save");
		this.findButtonById("add").caption = app.polyglot.t("scheduler24_add");
		this.findButtonById("copy").caption = app.polyglot.t("scheduler24_copy");
		this.findButtonById("paste").caption = app.polyglot.t("scheduler24_paste");
		this.findButtonById("week").caption = app.polyglot.t("scheduler24_week");
		this.findButtonById("fill_all").caption = app.polyglot.t("scheduler24_fill_all");
		this.config.localization_week = app.polyglot.t("scheduler24_week");

		this.legends[0].text = app.polyglot.t("scheduler24_legend_camera_on");
		this.legends[1].text = app.polyglot.t("scheduler24_legend_continues_recording");
		this.legends[2].text = app.polyglot.t("scheduler24_legend_event_recording");
		this.legends[3].text = app.polyglot.t("scheduler24_legend_no_recording");
		this.legends[4].text = app.polyglot.t("scheduler24_legend_camera_off");
		
		this.legends[2].show = SkyVR.isP2PStreaming();


		for(var i = 0; i < this.config.week.length; i++) {
			var day = this.config.week[i];
			this.config.week_localization[day].caption = app.polyglot.t("scheduler24_" + day);
			this.config.week_localization[day].short = app.polyglot.t("scheduler24_" + day + "_short");
		}
		// console.log(JSON.stringify(this.config.week_localization));
	}
	
	this.show = function(idcanvas) {
		this.canvasId = idcanvas;
		var e = document.getElementById(idcanvas);
		if (e == undefined) {
			console.log('Scheduler24hours: Element with id=' + id + ' did not found.');
			return;
		}

		this.localizeByPolyglot();
		this.calculateVars();
		this.renderCanvas();
		
		var canvas = document.getElementById(this.canvasId);
		canvas.moving = function(x,y) {
			if (Scheduler24.networkprocess == true)
				return;
		
			if (Scheduler24.config.mode == "week") {
				// pointer intervals
				var r = Scheduler24.lineDistance(Scheduler24.config.xc, Scheduler24.config.yc, x, y);
				var rad = Scheduler24.calculateRad(x, y);
				rad = rad - Math.PI/2; // magic
				rad = rad < 0 ? rad + Math.PI*2 : rad;
				if (Scheduler24.config.r4 < r && r < Scheduler24.config.r1) {
					var i = 0;
					for (var s = 0; s < Math.PI*2; s += (2*Math.PI/7)) {
						start_rad = s;
						stop_rad = s + (2*Math.PI/7);
						if (start_rad < rad && rad < stop_rad) {
							// console.log(Scheduler24.config.week[i]);
							// console.log(start_rad + " < " + rad + " < " + stop_rad);
							this.style.cursor = "pointer";
							return;
						}
						i++;
					}
				};

				if (this.style.cursor == "pointer") {
					this.style.cursor = "default";
				}
			}

			if (Scheduler24.config.mode == "day") {
				for(var i = 0; i < Scheduler24.legends.length; i++) {
					var legend = Scheduler24.legends[i];

					if (legend.select == true) {
						continue;
					}

					if (legend.x1 < x && x < legend.x2
						&& legend.y1 < y && y < legend.y2) {
						this.style.cursor = "pointer";
						return;
					}
				}

				var bSelectedBtn = false;
				for(var i = 0; i < Scheduler24.buttons.length; i++) {
					var btn = Scheduler24.buttons[i];

					if (!btn.isDraw()) {
						Scheduler24.renderButton(btn, false);
						continue;
					}

					if (!btn.isActive()) {
						Scheduler24.renderButton(btn, false);
						continue;
					}

					if (btn.x1 < x && x < btn.x2
						&& btn.y1 < y && y < btn.y2) {
						Scheduler24.renderButton(btn, true);
						bSelectedBtn = true;
					} else {
						Scheduler24.renderButton(btn, false);
					}
				}
				if (bSelectedBtn == true) {
					this.style.cursor = "pointer";
					return;
				}

				// carets
				var cw = Scheduler24.config.caretWidth;
				if (
					(Scheduler24.tmp.tmpInterval_start_x1 - cw < x && x < Scheduler24.tmp.tmpInterval_start_x1 + cw
					&& Scheduler24.tmp.tmpInterval_start_y1 - cw < y && y < Scheduler24.tmp.tmpInterval_start_y1 + cw
					&& Scheduler24.tmpInterval.draw == true)
					|| (Scheduler24.tmp.tmpInterval_end_x1 - cw < x && x < Scheduler24.tmp.tmpInterval_end_x1 + cw
					&& Scheduler24.tmp.tmpInterval_end_y1 - cw < y && y < Scheduler24.tmp.tmpInterval_end_y1 + cw
					&& Scheduler24.tmpInterval.draw == true)
				) {
					this.style.cursor = "pointer";
				} else {
					this.style.cursor = "default";
				}

				// pointer intervals
				if (Scheduler24.tmpInterval.draw == false) {
					var r = Scheduler24.lineDistance(Scheduler24.config.xc, Scheduler24.config.yc, x, y);
					var rad = Scheduler24.calculateRad(x, y);
					rad = rad + Math.PI; // magic
					rad = rad > Math.PI*1.5 ? rad - Math.PI*2 : rad;
					var day = Scheduler24.config.day;
					if (Scheduler24.config.r4 < r && r < Scheduler24.config.r3) {
						if (Scheduler24.intervals[day] != undefined) {
							for(var i = 0; i < Scheduler24.intervals[day].length; i++) {
								var interval = Scheduler24.intervals[day][i];
								// console.log("i: " + i + ";  start: " + interval.start_rad + "; stop: " + interval.stop_rad + "; this: " + rad);
								if (interval.start_rad < rad && rad < interval.stop_rad) {
									this.style.cursor = "pointer";
									return;
								}
							};
						}
					};
				}

				// moving tmpInterval
				if (Scheduler24.tmp.bMove == true) {
					// calculate rad
					var rad = Scheduler24.calculateRad(x, y);
					rad = rad - Math.PI/2; // magic
					if (Scheduler24.tmp.tmpInterval_ == 'start') {
						Scheduler24.tmpInterval.start = Scheduler24.radToTime(rad);
					} else if (Scheduler24.tmp.tmpInterval_ == 'stop') {
						Scheduler24.tmpInterval.stop = Scheduler24.radToTime(rad);
					}
					Scheduler24.renderCanvas();
				}
			}
		}
		canvas.begin = function(x,y) {
			if (Scheduler24.networkprocess == true)
				return;
			
			// document.getElementById("shedulerHeader").innerHTML = "onmousedown x, y : " + x + ", " + y;

			if (Scheduler24.config.mode == "day") {
				if (Scheduler24.tmpInterval.draw == true) {
					// tmpInterval start
					var cw = Scheduler24.config.caretWidth;

					if (Scheduler24.tmp.tmpInterval_start_x1 - cw < x && x < Scheduler24.tmp.tmpInterval_start_x1 + cw
						&& Scheduler24.tmp.tmpInterval_start_y1 - cw < y && y < Scheduler24.tmp.tmpInterval_start_y1 + cw) {
						Scheduler24.tmp.bMove = true;
						Scheduler24.tmp.tmpInterval_ = 'start';
					}

					// tmpInterval stop
					if (Scheduler24.tmp.tmpInterval_end_x1 - cw < x && x < Scheduler24.tmp.tmpInterval_end_x1 + cw
						&& Scheduler24.tmp.tmpInterval_end_y1 - cw < y && y < Scheduler24.tmp.tmpInterval_end_y1 + cw) {
						Scheduler24.tmp.bMove = true;
						Scheduler24.tmp.tmpInterval_ = 'stop';
					}
					
				}
			}
		}
		canvas.end = function(x,y) {
			if (Scheduler24.networkprocess == true)
				return;
			
			if (Scheduler24.config.mode == "week") {
				// pointer intervals
				var r = Scheduler24.lineDistance(Scheduler24.config.xc, Scheduler24.config.yc, x, y);
				var rad = Scheduler24.calculateRad(x, y);
				rad = rad - Math.PI/2; // magic
				rad = rad < 0 ? rad + Math.PI*2 : rad;
				if (Scheduler24.config.r4 < r && r < Scheduler24.config.r1) {
					var i = 0;
					for (var s = 0; s < Math.PI*2; s += (2*Math.PI/7)) {
						start_rad = s;
						stop_rad = s + (2*Math.PI/7);
						if (start_rad < rad && rad < stop_rad) {
							this.style.cursor = "default";
							Scheduler24.config.day = Scheduler24.config.week[i];
							Scheduler24.config.mode = "day";
							Scheduler24.updateCaptionButtons();
							Scheduler24.renderCanvas();
							return;
						}
						i++;
					}
				};
				if (this.style.cursor == "pointer") {
					this.style.cursor = "default";
				}
			}
			
			if (Scheduler24.config.mode == "day") {

				if (Scheduler24.tmp.bMove == true) {
					Scheduler24.tmp.bMove = false;
					Scheduler24.tmp.tmpInterval_ = '';
					return;
				}

				// legends click
				for(var i = 0; i < Scheduler24.legends.length; i++) {
					var legend = Scheduler24.legends[i];
					if (legend.select == true) continue;
					if (legend.x1 < x && x < legend.x2 && legend.y1 < y && y < legend.y2) {
						Scheduler24.selectLegend(legend.record);
						Scheduler24.renderCanvas();
						return;
					}
				}
				
				// document.getElementById("shedulerHeader").innerHTML = "onmouseup x, y : " + x + ", " + y;
				for(var i = 0; i < Scheduler24.buttons.length; i++) {
					var btn = Scheduler24.buttons[i];
					if (btn.x1 < x && x < btn.x2
						&& btn.y1 < y && y < btn.y2) {
						if (btn.isDraw() && btn.isActive()) {
							btn.click();
							return;
						}
					}
				}

				// edit interval
				if (Scheduler24.tmpInterval.draw == false) {
					var r = Scheduler24.lineDistance(Scheduler24.config.xc, Scheduler24.config.yc, x, y);
					var rad = Scheduler24.calculateRad(x, y);
					rad = rad + Math.PI; // magic
					rad = rad > Math.PI*1.5 ? rad - Math.PI*2 : rad;
					if (Scheduler24.config.r4 < r && r < Scheduler24.config.r3) {
						var day = Scheduler24.config.day;
						if (Scheduler24.intervals[day] != undefined) {
							for(var i = 0; i < Scheduler24.intervals[day].length; i++) {
								var interval = Scheduler24.intervals[day][i];
								if (interval.start_rad < rad && rad < interval.stop_rad) {
									var intervalRecord = interval.record;
									var intervalStart = interval.start;
									var intervalStop = interval.stop;
									// hack for removing interval
									interval.start = "00:00";
									interval.stop = "00:00";
									interval.record = "_";
									Scheduler24.tmpInterval.draw = true;
									Scheduler24.tmpInterval.start = intervalStart;
									Scheduler24.tmpInterval.stop = intervalStop;
									Scheduler24.selectLegend(intervalRecord);
									// todo redesign this js замыкание
									Scheduler24.renderCanvas();
									return;
								}
							}
						}
						
						// click to segments area
						if (Scheduler24.config.allowAddIntervalByClickOnSegmentsOfArea) {
							rad = Scheduler24.calculateRad(x, y);
							rad = rad - Math.PI/2;
							var t = Scheduler24.radToTime(rad);
							var m = Scheduler24.timeToMin(t);
							Scheduler24.flushTmpInterval();
							Scheduler24.tmpInterval.draw = true;
							
							Scheduler24.tmpInterval.start = Scheduler24.minToTime((1440 + m - 60) % 1440);
							Scheduler24.tmpInterval.stop = Scheduler24.minToTime((1440 + m + 60) % 1440);
							Scheduler24.renderCanvas();
							return;
						}
					}
				}

				// click to milk (just flush tmp interval)
				if (Scheduler24.tmpInterval.draw == true) {
					Scheduler24.flushTmpInterval();
					Scheduler24.renderCanvas();
				}
			}
		}
		canvas.onmousemove = function(evt) {
			if(window.evt)
				evt = window.evt;
			
			var rect = this.getBoundingClientRect();
			var mouseX = evt.pageX - rect.left;
			var mouseY = evt.pageY - rect.top;

			/*var mouseX = evt.pageX - this.offsetLeft;
			var mouseY = evt.pageY - this.offsetTop;*/
			this.moving(mouseX, mouseY);
		}
		canvas.onmousedown = function(evt) {
			if(window.evt)
				evt = window.evt;

			var rect = this.getBoundingClientRect();
			var mouseX = evt.pageX - rect.left;
			var mouseY = evt.pageY - rect.top;

			/*var mouseX = evt.pageX - this.offsetLeft;
			var mouseY = evt.pageY - this.offsetTop;
			console.log("offsetLeft: " + this.offsetLeft)
			// console.log("offsetLeft: " + offsetLeft)
			console.log("evt.pageX: " + evt.pageX)
			console.log("this.id: " + this.id)
			console.log("evt.clientX: " + evt.clientX)
			var rect = this.getBoundingClientRect();
			console.log("rect.top: " + rect.top)
			console.log("rect.left: " + rect.left)*/

			this.begin(mouseX, mouseY);
		}
		canvas.onmouseup = function(evt) {
			if(window.evt)
				evt = window.evt;
				
			var rect = this.getBoundingClientRect();
			var mouseX = evt.pageX - rect.left;
			var mouseY = evt.pageY - rect.top;

			/*var mouseX = evt.pageX - this.offsetLeft;
			var mouseY = evt.pageY - this.offsetTop;*/
			this.end(mouseX, mouseY)
		}
		
		canvas.addEventListener('touchstart', function(evt) {
			// evt.preventDefault();
			var touchX = evt.touches[0].pageX - this.offsetLeft;
			var touchY = evt.touches[0].pageY - this.offsetTop;
			this.begin(touchX, touchY);
		},false);

		canvas.addEventListener('touchmove', function(evt) {
			evt.preventDefault();
			var touchX = evt.touches[0].pageX - this.offsetLeft;
			var touchY = evt.touches[0].pageY - this.offsetTop;			
			this.moving(touchX, touchY);
		},false);

		canvas.addEventListener('touchend', function(evt) {
			// evt.preventDefault();
			var touchX = evt.touches[0].pageX - this.offsetLeft;
			var touchY = evt.touches[0].pageY - this.offsetTop;			
			this.end(touchX, touchY);
		},false);
	}

	this.lineDistance = function(x0, y0, x1, y1){
		var dx = x1 - x0;
		var dy = y1 - y0;
		return Math.sqrt(dx*dx + dy*dy);
	};

	this.timeToRad = function(time) {
		var arr = time.split(":");
		// todo check format
		var i = parseInt(arr[0],10)*60;
		i += parseInt(arr[1],10);
		i = i / (24*60);
		return  i*Math.PI*2;
	};

	this.timeToMin = function(time) {
		if (time == undefined) {
			console.log("Scheduler24hours: time is undefined");
			return 0;
		}
		var arr = time.split(":");
		// todo check format
		var i = parseInt(arr[0],10)*60;
		i += parseInt(arr[1],10);
		return  i;
	};
	
	this.minToTime = function(tmin) {
		var min = tmin % 60;
		tmin = tmin - min;
		tmin = Math.round(tmin / 60);
		return this.padTimeLeft(tmin) + ":" + this.padTimeLeft(min);
	};

	this.padTimeLeft = function(n) {
		var str = "" + n;
		var pad = "00";
		return pad.substring(0, pad.length - str.length) + str;
	};

	this.radToTime = function(rad) {
		if (rad < 0) {
			rad = rad + Math.PI*2;
		}
		var i = Math.round((24*60 * rad) / (Math.PI*2));
		var min = i % 60;
		i = Math.round((i - min)/60);
		var hours = i % 60;
		return this.padTimeLeft(hours) + ":" + this.padTimeLeft(min);
	};

	// helpers
	this.splitIntervalsByX = function (arr, timex) {
		if (arr == undefined)
			arr = [];
		var x = Scheduler24.timeToMin(timex);
		var tmpArr = [];
		for (var i = 0; i < arr.length; i++) {
			var x1 = Scheduler24.timeToMin(arr[i].start);
			var x2 = Scheduler24.timeToMin(arr[i].stop);
			if (x1 < x && x < x2) {
				tmpArr.push({
					'start' : arr[i].start,
					'stop' : timex,
					'record' : arr[i].record,
				});
				tmpArr.push({
					'start' : timex,
					'stop' : arr[i].stop,
					'record' : arr[i].record,
				});
			} else {
				tmpArr.push({
					'start' : arr[i].start,
					'stop' : arr[i].stop,
					'record' : arr[i].record,
				});
			}
		}
		return tmpArr;
	}
	
	// helpers
	this.removeIntervalsBy = function (arr, timey1, timey2) {
		var y1 = Scheduler24.timeToMin(timey1);
		var y2 = Scheduler24.timeToMin(timey2);
		var tmpArr = [];
		for (var i = 0; i < arr.length; i++) {
			var x1 = Scheduler24.timeToMin(arr[i].start);
			var x2 = Scheduler24.timeToMin(arr[i].stop);
			if (!(y1 <= x1 && x1 <= y2 && y1 <= x2 && x2 <= y2)) {
				tmpArr.push({
					'start' : arr[i].start,
					'stop' : arr[i].stop,
					'record' : arr[i].record,
				});
			}
		}
		return tmpArr;
	}
	
	// helpers
	this.removeEmptyIntervals = function (arr) {
		var tmpArr = [];
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].start != arr[i].stop) {
				tmpArr.push({
					'start' : arr[i].start,
					'stop' : arr[i].stop,
					'record' : arr[i].record,
				});
			} else if (arr[i].start == arr[i].stop && arr[i].stop != "00:00") {
				tmpArr.push({
					'start' : arr[i].start,
					'stop' : arr[i].stop,
					'record' : arr[i].record,
				});
			}
		}
		return tmpArr;
	}

	// helpers
	this.sortIntervalsByStart = function(arr) {
		var nPermutation = 1;
		while(nPermutation > 0) {
			nPermutation = 0;
			for (var i = 0; i < arr.length-1; i++) {
				var x1 = Scheduler24.timeToMin(arr[i].start);
				var x2 = Scheduler24.timeToMin(arr[i+1].start);
				if (x1 > x2) {
					var start = arr[i].start;
					var stop = arr[i].stop;
					var record = arr[i].record;
					arr[i].start = '' + arr[i+1].start;
					arr[i].stop = '' + arr[i+1].stop;
					arr[i].record = '' + arr[i+1].record;
					arr[i+1].start = '' + start;
					arr[i+1].stop = '' + stop;
					arr[i+1].record = '' + record;
					nPermutation++;
				}
			}
		}
		return arr;
	}

	// helpers
	this.joinNeighborIntervals = function(arr) {
		var tmpArr = this.removeEmptyIntervals(arr);
		tmpArr = this.sortIntervalsByStart(tmpArr);
		var nPermutation = 1;
		while (nPermutation > 0) {
			nPermutation = 0;
			for (var i = 0; i < tmpArr.length-1; i++) {
				var stop = Scheduler24.timeToMin(tmpArr[i].stop);
				var start = Scheduler24.timeToMin(tmpArr[i+1].start);

				if (tmpArr[i].record == tmpArr[i+1].record && stop == start) {
					tmpArr[i].stop = tmpArr[i+1].stop;
					tmpArr[i+1].start = '00:00';
					tmpArr[i+1].stop = '00:00';
					nPermutation++;
				}
			}
			tmpArr = this.removeEmptyIntervals(tmpArr);
			tmpArr = this.sortIntervalsByStart(tmpArr);
		}
		return tmpArr;
	}

	this.addInterval = function(start, stop, record) {
		var day = this.config.day;
		this.intervals[day] = this.splitIntervalsByX(this.intervals[day], start);
		this.intervals[day] = this.splitIntervalsByX(this.intervals[day], stop);
		this.intervals[day] = this.removeIntervalsBy(this.intervals[day], start, stop);
		this.intervals[day] = this.removeEmptyIntervals(this.intervals[day]);
		if (record != '_')
			this.intervals[day].push({'start' : start, 'stop' : stop, 'record' : record});
		this.intervals[day] = this.sortIntervalsByStart(this.intervals[day]);

		// normalize
		for (var i = 0; i < this.intervals[day].length-1; i++) {
			if (this.intervals[day][i].stop == this.intervals[day][i+1].start) {
				// var m = Scheduler24.timeToMin(this.intervals[day][i].stop) - 1;
				// this.intervals[day][i].stop = m > 1 ? Scheduler24.minToTime(m) : this.intervals[day][i].start;
				// this.intervals[day][i].stop = this.intervals[day][i].start;
			}
		}
		this.intervals[day] = this.removeEmptyIntervals(this.intervals[day]);
		
		// join neighbor segments
		this.intervals[day] = this.joinNeighborIntervals(this.intervals[day]);
	}
	
	this.flushTmpInterval = function() {
		if (this.tmpInterval.draw == true) {
			// console.log("flushTmpInterval");
			var record = this.selectedLegend().record;
			/*var newInterval = {
				'start' : this.tmpInterval.start,
				'stop' : this.tmpInterval.stop,
				'record' : record,
			};*/
			// console.log(record);

			var x1 = this.timeToMin(this.tmpInterval.start);
			var x2 = this.timeToMin(this.tmpInterval.stop);
			if (x1 > x2) {
				this.addInterval(this.tmpInterval.start, '24:00', record);
				this.addInterval('00:00', this.tmpInterval.stop, record);
			} else {
				this.addInterval(this.tmpInterval.start, this.tmpInterval.stop, record);
			}
			// console.log("after) this.intervals.length: " + this.intervals.length);
			// this.normalizeIntervals();
			this.tmpInterval.draw = false;
		};
	};

	this.selectLegend = function(record) {
		for(var i = 0; i < this.legends.length; i++) {
			if (this.legends[i].record && this.legends[i].record == record) 
				this.legends[i].select = true;
			else
				this.legends[i].select = false;
		}
	};
	
	this.selectedLegend = function() {
		for(var i = 0; i < this.legends.length; i++) {
			if (this.legends[i].record && this.legends[i].select == true)
				return this.legends[i];
		}
	};
	
	this.findLegendByRecord = function(record) {
		for(var i = 0; i < this.legends.length; i++)
			if (this.legends[i].record && this.legends[i].record == record)
				return this.legends[i];
	};

	this.addNewTmpInterval = function() {
		if (this.tmpInterval.draw == false) {
			this.tmpInterval.draw = true;
			this.tmpInterval.start = '00:00';
			this.tmpInterval.stop = '02:00';
		}
	};

	this.calculateRad = function(mouseX, mouseY) {
		var x = this.config.xc - mouseX;
		var y = this.config.yc - mouseY;
		return Math.atan2(y,x);
	};

	this.renderButton = function(btn, highlight) {
		if (highlight == undefined) 
			highlight = false;

		var drawingCanvas = document.getElementById(this.canvasId);
		if(drawingCanvas && drawingCanvas.getContext) {
			var context = drawingCanvas.getContext('2d');
			var p = this.config.buttons.padding;
			context.lineWidth = 1;
			context.clearRect(btn.x1, btn.y1, btn.x2 - btn.x1, btn.y2 - btn.y1);

			if (!btn.isDraw()) {
				if (btn.backgroundColor) {
					context.fillStyle = btn.backgroundColor;
					// some bug this draw
					context.fillRect(btn.x1, btn.y1 - 1, btn.x2 - btn.x1, btn.y2 - btn.y1 + 2)
				}
				return;
			}
			
			if (!btn.isActive()) {
				context.fillStyle = this.config.buttons.inactive;
				context.font = this.config.buttons.font;
				context.textAlign="left";
				context.textBaseline="top";
				context.fillText(btn.caption, btn.x1 + p, btn.y1 + p);
				// todo draw for inactive
				return;
			}

			if (highlight == true) {
				context.fillStyle = this.config.buttons.background2;
				context.fillRect(btn.x1, btn.y1, btn.x2 - btn.x1, btn.y2 - btn.y1)
			} else if (btn.backgroundColor) {
				context.fillStyle = btn.backgroundColor;
				context.fillRect(btn.x1, btn.y1 - 1, btn.x2 - btn.x1, btn.y2 - btn.y1 + 2)
			}

			context.fillStyle = this.config.buttons.color;
			if (highlight == true) {
				context.fillStyle = this.config.buttons.color2;
			}
			
			if (btn.draw) {
				btn.draw(context);
			} else {
				context.font = this.config.buttons.font;
				context.textAlign="left";
				context.textBaseline="top";
				context.fillText(btn.caption, btn.x1 + p, btn.y1 + p);
			}		
		}
	};

	this.renderInterval = function(interval) {
		// TODO
	}
	
	// helper function
	this.renderLegends = function(showSelect) {
		var drawingCanvas = document.getElementById(this.canvasId);
		if(drawingCanvas && drawingCanvas.getContext) {
			var context = drawingCanvas.getContext('2d');

			for(var i = 0; i < this.legends.length; i++) {
				var legend = this.legends[i];
				if(!legend.show)
					continue;

				if (this.legends[i].record) {
					context.fillStyle = legend.color;
					context.strokeStyle = "#fff";

					if (legend.select == true && showSelect == true) {
						context.lineWidth = 3;
						context.strokeRect(legend.x1, legend.y1, legend.w, legend.h);
					}
					context.fillRect(legend.x1, legend.y1, legend.w, legend.h);
					if (legend.select == true && showSelect == true) {
						context.strokeStyle = "#FFF";
						context.fillStyle = "#FFF";
						context.lineWidth = 2;
						context.beginPath();
						context.moveTo(legend.x1 + 3, legend.y1 + 9);
						context.lineTo(legend.x1 + 8, legend.y1 + 14);
						context.lineTo(legend.x1 + 17, legend.y1 + 5);
						// context.closePath();
						context.stroke();
					}
				}

				context.fillStyle = legend.textColor;
				context.font = legend.font;
				context.textAlign="right";
				context.textBaseline="middle";
				context.fillText(legend.text, legend.x1 - 5, legend.y1 + 10);
				// context.font = "italic 12px Arial";
				// context.fillStyle = ;
				// context.textBaseline="top";
				// context.fillText(legend.comment, legend.x1 - 10, legend.y1 + 10);
			}
		}
	}
	
	this.renderWeek = function() {
		var drawingCanvas = document.getElementById(this.canvasId);
		if(drawingCanvas && drawingCanvas.getContext) {
			var context = drawingCanvas.getContext('2d');
			context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

			context.lineWidth = 1;
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r1, "#d5e7f3");
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r2, "#d5e7f3");
			this.printCircleFill(context, this.config.xc, this.config.yc, this.config.r3, "#d5e7f3"); // todo config	

			// hours
			context.font = "14px Arial";
			context.textAlign="center";
			context.textBaseline="middle";
			var dR1R2 = this.config.r1 - (this.config.r1 - this.config.r2)/2;
		
			// renders days
			var i = 0;
			for (var s = 0; s < Math.PI*2; s += (2*Math.PI/7)) {
				var day = this.config.week[i];
				if (this.intervals[day] != undefined) {
					for(var i1 = 0; i1 < this.intervals[day].length; i1++) {
						// fix 2:00 - 2:00 and another vizualization

						var start = this.timeToRad(this.intervals[day][i1].start);
						var stop = this.timeToRad(this.intervals[day][i1].stop);
						var record = this.intervals[day][i1].record;
						// start = start < 0 ? start + Math.PI*2 : start;
						start = s + start / 7  - Math.PI/2;					
						stop = s + stop / 7 - Math.PI/2; // magic

						// alert(this.radToTime(start));
						context.strokeStyle = "#e23805"; // todo move to config
						context.fillStyle = this.findLegendByRecord(record).color;
						context.beginPath();
						context.arc(this.config.xc, this.config.yc, this.config.r3, start, stop, false);
						context.arc(this.config.xc, this.config.yc, this.config.r4, stop, start, true);
						context.closePath();
						// context.stroke();
						context.fill();
					}
				}
				i++;
			}
			
			// grad
			context.strokeStyle = "#FFF";
			context.fillStyle = "#FFF";
			var i = 0;
			for (var s = 0; s < Math.PI*2; s += (2*Math.PI/7)) {
				context.strokeStyle = "#FFF";
				context.fillStyle = "#FFF";
				context.beginPath();
				context.moveTo(Math.sin(s) * this.config.r3 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r3);
				context.lineTo(Math.sin(s) * this.config.r4 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r4);
				context.closePath();
				context.stroke();
				
				context.strokeStyle = "#d5e7f3";
				context.fillStyle = "#d5e7f3";
				context.beginPath();
				context.moveTo(Math.sin(s) * this.config.r1 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r1);
				context.lineTo(Math.sin(s) * this.config.r2 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r2);
				context.closePath();
				context.stroke();

				context.strokeStyle = this.config.title.color;
				context.fillStyle = this.config.title.color;
				context.fillText(this.config.week_localization[this.config.week[i]].short,
					this.config.xc + Math.sin(s + (2*Math.PI/7)/2) * dR1R2,
					this.config.yc - Math.cos(s + (2*Math.PI/7)/2) * dR1R2
				);
				i++;
			}
			
			// TODO: render color days
			context.strokeStyle = "#FFF";
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r3);
			this.printCircleFill(context, this.config.xc, this.config.yc, this.config.r4, "#fff"); // todo config
			
			// week
			context.fillStyle = "#3876a5";
			context.font = "bold 20px Arial";
			context.textAlign="center";
			context.textBaseline="middle";
			if (Scheduler24.networkprocess == false)
				context.fillText(this.config.localization_week, this.config.xc, this.config.yc);
			else
				context.fillText(this.networkoperation, this.config.xc, this.config.yc);
				
			this.renderLegends(false);
		}
	}
	
	this.printCircle = function(context, x,y,r, colorStroke) {
		// button print
		context.strokeStyle = colorStroke;
		context.beginPath();
		context.arc(x,y,r,0, Math.PI*2,true);
		context.closePath();
		context.stroke();
	}
			
	this.printCircleFill = function(context, x,y,r, color) {
		// button print
		context.strokeStyle = "#FFF";
		context.fillStyle = color;
		context.beginPath();
		context.arc(x,y,r,0, Math.PI*2,true);
		context.closePath();
		context.stroke();
		context.fill();
	}
	
	this.renderDay = function() {
		var drawingCanvas = document.getElementById(this.canvasId);
		if(drawingCanvas && drawingCanvas.getContext) {
			var context = drawingCanvas.getContext('2d');
			context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
			
			this.renderLegends(true);

			context.lineWidth = 1;
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r1, "#d5e7f3");
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r2, "#d5e7f3");
			this.printCircleFill(context, this.config.xc, this.config.yc, this.config.r3, "#d5e7f3"); // todo config	
			
			// intervals
			var day = this.config.day;
			if (this.intervals[day] != undefined) {
				for(var i = 0; i < this.intervals[day].length; i++) {
					// fix 2:00 - 2:00 and another vizualization
					var minutes_start = this.timeToMin(this.intervals[day][i].start);
					var minutes_stop = this.timeToMin(this.intervals[day][i].stop);
					var time_start = this.minToTime(minutes_start);
					var time_stop = this.minToTime(minutes_stop);
					if (minutes_stop > minutes_start) {
						time_stop = this.minToTime(minutes_stop);
					}
					var start = this.timeToRad(time_start) - Math.PI/2;
					var stop = this.timeToRad(time_stop)  - Math.PI/2;
					var record = this.intervals[day][i].record;
					this.intervals[day][i].start_rad = start;
					this.intervals[day][i].stop_rad = stop;

					// alert(this.radToTime(start));
					context.strokeStyle = "#e23805"; // todo move to config
					context.fillStyle = this.findLegendByRecord(record).color;
					context.beginPath();
					context.arc(this.config.xc, this.config.yc, this.config.r3, start, stop, false);
					context.arc(this.config.xc, this.config.yc, this.config.r4, stop, start, true);
					context.closePath();
					// context.stroke();
					context.fill();
				}
			}
			
			context.strokeStyle = "#FFF";
			this.printCircle(context, this.config.xc, this.config.yc, this.config.r3);
			this.printCircleFill(context, this.config.xc, this.config.yc, this.config.r4, "#fff"); // todo config

			// day
			context.fillStyle = "#3876a5";
			context.font = "bold 20px Arial";
			context.textAlign="center";
			context.textBaseline="middle";
			if (Scheduler24.networkprocess == false) {
				if (this.config.week_localization[this.config.day] == undefined) {
					caption = this.config.day;
					"Could not load caption for " + this.config.day;
				} else
					caption = this.config.week_localization[this.config.day].caption
				context.fillText(caption, this.config.xc, this.config.yc);
			} else
				context.fillText(this.networkoperation, this.config.xc, this.config.yc);

			// hours
			context.font = "14px Arial";
			context.textAlign="center";
			context.textBaseline="middle";
			var dR1R2 = this.config.r1 - (this.config.r1 - this.config.r2)/2;

			// grad
			context.strokeStyle = "#FFF";
			context.fillStyle = "#FFF";
			for (var s = 0; s < Math.PI*2; s += Math.PI/6) {
				context.strokeStyle = "#FFF";
				context.fillStyle = "#FFF";
				context.beginPath();
				context.moveTo(Math.sin(s) * this.config.r3 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r3);
				context.lineTo(Math.sin(s) * this.config.r4 + this.config.xc, this.config.yc - Math.cos(s) * this.config.r4);
				context.closePath();
				context.stroke();

				context.strokeStyle = this.config.title.color;
				context.fillStyle = this.config.title.color;
				context.fillText(Math.round((12*s / Math.PI)), this.config.xc + Math.sin(s) * dR1R2, this.config.yc - Math.cos(s) * dR1R2);
			}

			// buttons
			for(var i = 0; i < this.buttons.length; i++) {
				this.renderButton(this.buttons[i], false);
			}
			
			// draw tmp interval
			if (this.tmpInterval.draw == true && Scheduler24.networkprocess == false) {
				var tmpStart_orig = this.timeToRad(this.tmpInterval.start);
				var tmpEnd_orig = this.timeToRad(this.tmpInterval.stop);
				var tmpStart = this.timeToRad(this.tmpInterval.start) - Math.PI/2;
				var tmpEnd = this.timeToRad(this.tmpInterval.stop) - Math.PI/2;
				
				context.lineWidth = 3;
				
				context.strokeStyle = "#FFF";
				context.fillStyle = this.selectedLegend().color;
				context.beginPath();
				context.arc(this.config.xc, this.config.yc, this.config.r3, tmpStart, tmpEnd, false);
				context.arc(this.config.xc, this.config.yc, this.config.r3tmp, tmpEnd, tmpStart, true);
				context.closePath();
				context.stroke();
				context.fill();
				
				context.strokeStyle = this.config.title.color;
				context.fillStyle = this.config.title.color;
				
				this.tmp.tmpInterval_start_x1 = Math.sin(tmpStart_orig) * this.config.r2 + this.config.xc;
				this.tmp.tmpInterval_start_y1 = this.config.yc - Math.cos(tmpStart_orig) * this.config.r2;
				
				context.strokeStyle = "#FFF";
				// context.fillStyle = "#FFF";
				context.beginPath();
				context.moveTo(this.tmp.tmpInterval_start_x1, this.tmp.tmpInterval_start_y1);
				context.lineTo(Math.sin(tmpStart_orig) * this.config.r3tmp + this.config.xc, this.config.yc - Math.cos(tmpStart_orig) * this.config.r3tmp);
				context.closePath();
				context.stroke();
				
				context.beginPath();
				context.arc(this.tmp.tmpInterval_start_x1, this.tmp.tmpInterval_start_y1, this.config.caretWidth, 0, Math.PI*2, false);
				context.closePath();
				context.fill();
				context.stroke();

				this.tmp.tmpInterval_end_x1 = Math.sin(tmpEnd_orig) * this.config.r1 + this.config.xc;
				this.tmp.tmpInterval_end_y1 = this.config.yc - Math.cos(tmpEnd_orig) * this.config.r1;
							
				context.strokeStyle = "#FFF";
				// context.fillStyle = "#FFF";
				context.beginPath();
				context.moveTo(this.tmp.tmpInterval_end_x1, this.tmp.tmpInterval_end_y1);
				context.lineTo(Math.sin(tmpEnd_orig) * this.config.r3tmp + this.config.xc, this.config.yc - Math.cos(tmpEnd_orig) * this.config.r3tmp);
				context.closePath();
				context.stroke();
				
				context.beginPath();
				context.arc(this.tmp.tmpInterval_end_x1, this.tmp.tmpInterval_end_y1, this.config.caretWidth, 0, Math.PI*2, false);
				context.closePath();
				context.fill();
				context.stroke();
				
				context.lineWidth = 1;

				context.fillStyle = "#3876a5";
				context.font = "bold 18px Arial";
				context.textAlign="center";
				context.textBaseline="middle";
				context.fillText(this.config.localization_start, this.config.xc, this.config.yc - this.config.r4 + this.config.r4/4);
				context.fillText(this.config.localization_stop, this.config.xc, this.config.yc + this.config.r4 - this.config.r4/4);

				context.font = "25px Arial";
				context.fillText(this.tmpInterval.start, this.config.xc, this.config.yc - this.config.r4 + 4*this.config.r4/6);
				context.fillText(this.tmpInterval.stop, this.config.xc, this.config.yc + this.config.r4 - 4*this.config.r4/6);

				/*context.fillStyle = "#FFF";
				context.font = "14px Arial";
				context.textAlign="center";
				context.textBaseline="middle";
				context.fillText(">", this.tmp.tmpInterval_start_x1, this.tmp.tmpInterval_start_y1);
				context.fillText("<", this.tmp.tmpInterval_end_x1, this.tmp.tmpInterval_end_y1);*/

				/*context.save();
				context.translate(x1, y1);
				context.rotate(-Math.PI/2);
				context.textAlign = "center";
				context.restore();*/
			}
		}
	}
	
	
	this.renderCanvas = function() {
		if (this.config.mode == "week") {
			this.renderWeek();
		} else if (this.config.mode == "day") {
			this.renderDay();
		}
	}
}();
