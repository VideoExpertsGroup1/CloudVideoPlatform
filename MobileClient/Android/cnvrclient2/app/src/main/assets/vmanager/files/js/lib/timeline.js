/**
 * Created by Exception on 06.08.2015.
 */
(function () {
    /*
     * Date Format 1.2.3
     * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
     * MIT license
     *
     * Includes enhancements by Scott Trenda <scott.trenda.net>
     * and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */

    var dateFormat = function () {
        var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;
			var prev_date = date;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
			date = date ? new Date(date) : Date.now();
            if (isNaN(date)) {
				CloudAPI.printStack();
				throw SyntaxError("invalid date: [" + date + "] [" + prev_date + "]");
			}

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

			// console.log("[DEBUG]: getTimezoneOffset: " + date.getTimezoneOffset());
            var _ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d: d,
                    dd: pad(d),
                    ddd: dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m: m + 1,
                    mm: pad(m + 1),
                    mmm: dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    yy: String(y).slice(2),
                    yyyy: y,
                    h: H % 12 || 12,
                    hh: pad(H % 12 || 12),
                    H: H,
                    HH: pad(H),
                    M: M,
                    MM: pad(M),
                    s: s,
                    ss: pad(s),
                    l: pad(L, 3),
                    L: pad(L > 99 ? Math.round(L / 10) : L),
                    t: H < 12 ? "a" : "p",
                    tt: H < 12 ? "am" : "pm",
                    T: H < 12 ? "A" : "P",
                    TT: H < 12 ? "AM" : "PM",
                    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    }();

// Some common format strings
    dateFormat.masks = {
        "default": "ddd mmm dd yyyy HH:MM:ss",
        shortDate: "m/d/yy",
        mediumDate: "mmm d, yyyy",
        longDate: "mmmm d, yyyy",
        fullDate: "dddd, mmmm d, yyyy",
        shortTime: "h:MM TT",
        mediumTime: "h:MM:ss TT",
        longTime: "h:MM:ss TT Z",
        isoDate: "yyyy-mm-dd",
        isoTime: "HH:MM:ss",
        isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

// Internationalization strings
    dateFormat.i18n = {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    };

// For convenience...
    Date.prototype.format = function (mask, utc) {
        return dateFormat(this, mask, utc);
    };
})(this);

define("views/home/view", ["underscore", "marionette"], function (e, t) {
    return t.ItemView.extend({
        initialize: function () {
            this.eventDetachJobs = [];
            this.model && (this.model._events = this.model._events || {})
        },
        glyph: {
            dot: "•"
        },
        analyticsKey: null,
        onRender: function () {
            this.enableBindings();
        },
        enableBindings: function () {
            if (!this.bindings) {
                var t = {};
                t[this.templateViewName] = this.getViewBindings();
                this.bindingScopes && e.each(this.bindingScopes, function (e, n) {
                    t[n] = e
                });
                this.bindings = n.bind(this.$el, t)
            }
        },
        disableBindings: function () {
            if (this.bindings) {
                this.bindings.unbind();
                this.bindings = null
            }
        },
        onBeforeClose: function () {
            this.undelegateEvents();
            this.disableBindings();
            return !0
        },
        getViewBindings: function () {
            return this.model
        },
        clearEventDetachJobs: function () {
            e.each(this.eventDetachJobs, function (e) {
                e()
            });
            this.eventDetachJobs = []
        },
        addBindingScope: function (e, t) {
            this.bindingScopes || (this.bindingScopes = {});
            this.bindingScopes[e] = t
        }
    })
});

define('timeline', ['backbone', 'config', 'underscore', 'views/home/view', 'd3', 'event'], function (backbone, config, underscore, view, d3, event) {
    var obj = underscore.extend({}, backbone.Events);
    underscore.extend(obj, {
        className: 'timeline',
        templateViewName: "TimelineView",
        events: {},
        initialize: function (param) {
			console.log("[TIMELINE] initialize")
            Timeline.model.time = Date.now();
            Timeline.unlock();

            this.activeSession = undefined;
            this.timelineLoader = new TimelineLoader(event);
            this.dimensions = {
                svgWidth: config.timeline.width,
                svgHeight: config.timeline.height,
                margin: config.timeline.margin,
                timelineWidth: config.timeline.width - config.timeline.margin.left - config.timeline.margin.right,
                timelineHeight: config.timeline.height - config.timeline.margin.top - config.timeline.margin.bottom + 12
            };
            var active_level = $('.zoom-levels span.active');
			if(active_level.length == 0){
				// set to default zoom "HR"
				active_level = $($('.zoom-levels span')[1]);
				active_level.addClass('active');
			}

			// init defaultDuration
			if(!Timeline.defaultDuration){
				active_level = $($('.zoom-levels span')[1]);
				Timeline.defaultDuration = parseInt(active_level.attr('duration'),10);
				Timeline.defaultDurationScale = parseInt(active_level.attr('scale'),10);
			}

			Timeline.duration = parseInt(active_level.attr('duration'),10);
			Timeline.durationScale = parseInt(active_level.attr('scale'),10);
            // reset thumbnails
            $('.skyvr-timeline-thumbnail').css({
				'background-image': 'unset'
			});
			$('.skyvr-timeline-thumbnail').attr({'time' : 0});
            this.cam = backbone.currentCamera;
            Timeline.model.time = Date.now();
            var self = this;

            this.loadDelta = 86400000 * 2;
            this.dateEnd = CloudAPI.getCurrentTimeUTC();
            this.dateStart = this.dateEnd - this.loadDelta;

            // console.log("this.dateEnd: " + new Date(this.dateEnd));
            // console.log("this.dateStart: " + new Date(this.dateStart));

            this.eventFilter = JSON.parse(localStorage.getItem("md_filter_" + this.cam.id) || '{"motion":true,"sound":true}');
            var promise = $.Deferred();
            promise.done(function () {
                self.p2pInfoLoaded = true;
            })
            event.trigger(event.GET_CAMERA, function (camera) {
                self.cam = camera;
                if (self.cam.p2p_streaming && self.cam.p2p_streaming == true && !self.cam.p2p) {
					CloudAPI.cameraP2PSettings(camera.id, function(response){
						if(response.p2p_streaming && response.p2p_streaming == true)
							backbone.currentCamera.p2p = response;
                        promise.resolve();
					},function(){
						promise.resolve();
					});
                }else{
                    promise.resolve();
                }
            });
            Calendar.initialize(event);
            Calendar.renderCalendar();
            this.Record = function (obj, time) {
				if(obj){
					if (underscore.isObject(time)) {
						obj.position = time.getTime();
					} else {
						obj.position = obj.startTime;
					}
				}
                return obj;
            }
            this.yScale = 0;
            this.player = backbone.player;
            $('#clipmaker-start-select-cursor').unbind().click(function(){
				var d = Timeline.model.time;
				d = self.correctTime2(d);
				var f = ""
					+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "/"
					+ ("00" + d.getUTCDate()).slice(-2) + "/"
					+ d.getUTCFullYear() + " "
					+ ("00" + d.getUTCHours()).slice(-2) + ":"
					+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
					+ ("00" + d.getUTCSeconds()).slice(-2);
				$('#clipmaker-start').val(f);
				self.drawClip();
			});

			$('#clipmaker-stop-select-cursor').unbind().click(function(){
				var d = Timeline.model.time;
				d = self.correctTime2(d);
				var f = ""
					+ ("00" + (d.getUTCMonth()+1)).slice(-2) + "/"
					+ ("00" + d.getUTCDate()).slice(-2) + "/"
					+ d.getFullYear() + " "
					+ ("00" + d.getUTCHours()).slice(-2) + ":"
					+ ("00" + d.getUTCMinutes()).slice(-2) + ":"
					+ ("00" + d.getUTCSeconds()).slice(-2);
				 $('#clipmaker-stop').val(f);
				 self.drawClip();
			});

			$('.button-clip-save').unbind().click(function(){
				var title = $('#clipmaker-title').val();
				var group = $('#clipmaker-group').val();
				var start = $('#clipmaker-start').val();
				var startTime = 0;
				re = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/i
				found = start.match(re);
				console.log("found: ", found);
				if(found){
					var d = new Date();
					d.setUTCFullYear(parseInt(found[3], 10));
					d.setUTCMonth(parseInt(found[1], 10)-1);
					d.setUTCDate(parseInt(found[2], 10));
					d.setUTCHours(parseInt(found[4], 10));
					d.setUTCMinutes(parseInt(found[5], 10));
					d.setUTCSeconds(parseInt(found[6], 10));
					startTime = d.getTime() - CloudAPI.getOffsetTimezone();
					start = CloudAPI.convertUTCTimeToUTCStr(startTime);
				}else{
					alert('Invalid format of start date. Please enter like MM/dd/yyyy hh:mm:ss'); // TODO translate
					return;
				}

				var stop = $('#clipmaker-stop').val();
				var stopTime = 0;
				found = stop.match(re);
				console.log("found: ", found);
				if(found){
					var d = new Date();
					d.setUTCFullYear(parseInt(found[3], 10));
					d.setUTCMonth(parseInt(found[1], 10)-1);
					d.setUTCDate(parseInt(found[2], 10));
					d.setUTCHours(parseInt(found[4], 10));
					d.setUTCMinutes(parseInt(found[5], 10));
					d.setUTCSeconds(parseInt(found[6], 10));
					stopTime = d.getTime() - CloudAPI.getOffsetTimezone();
					stop = CloudAPI.convertUTCTimeToUTCStr(stopTime);
				}else{
					alert('Invalid format of end date. Please enter like MM/dd/yyyy hh:mm:ss'); // TODO translate
					return;
				}
				
				var clip_length = (stopTime - startTime)/1000;
				if(clip_length < 0){
					alert("Negative length of clip"); // TODO translate
					return;
				}
				
				if(clip_length < cc.clip_min_length){
					app.showError(
						app.polyglot.t('clip_save_error_title'),
						app.polyglot.t('clip_error_min_length').replace('%N%', cc.clip_min_length)
					);
					return;
				}
				
				if(cc.clip_max_length != null){
					if(clip_length > cc.clip_max_length){
						if(cc.clip_max_length_error){
							app.showError(
								app.polyglot.t('clip_save_error_title'),
								app.polyglot.t(cc.clip_max_length_error)
							);
						}else{
							app.showError(
								app.polyglot.t('clip_save_error_title'),
								app.polyglot.t('clip_error_max_length').replace('%N%', cc.clip_max_length)
							);
						}
						return;
					}
				}

				var delete_at = null;
				
				CloudAPI.serverTime().done(function(res){
					if(cc.clip_creation_delete_after != null){
						delete_at = Date.parse(res.utc) + cc.clip_creation_delete_after*1000;
						console.log('delete_at: ' + delete_at);
						delete_at = CloudAPI.convertUTCTimeToUTCStr(delete_at);
						console.log('delete_at: ' + delete_at);
					}
					CloudAPI.storageClipCreate(title, group, start, stop, delete_at).fail(function(jqXHR, textStatus, errorThrown){
						if(jqXHR.responseJSON && jqXHR.responseJSON.error){
							alert(jqXHR.responseJSON.error);
						}else if(jqXHR.responseJSON && jqXHR.responseJSON.error_message){
							alert(jqXHR.responseJSON.error_message);
						}else{
							alert("FAIL: " + JSON.stringify(jqXHR) + JSON.stringify(textStatus) + JSON.stringify(errorThrown));
						}
					}).done(function(){
						$('#clipmaker-group').val('');
						$('#clipmaker-title').val('');
						$('#clipmaker-start').val('');
						$('#clipmaker-stop').val('');
						$('.clip-menu-popover').removeClass('popover-open');
						app.createDialogModal({
							'title' : app.polyglot.t('dialog_title_clip_create_info'),
							'content' : app.polyglot.t('dialog_content_clip_create_info'),
							'buttons' : [
								{text: app.polyglot.t('Ok'), close: true},
							],
							'beforeClose' : function() {
							}
						});
						app.showDialogModal();
					});
				});
			});

			$('.button-clip-cancel').unbind().click(function(){
				$('.clip-menu-popover').removeClass('popover-open');
			});
			
			$('.button-clip-goto-clips').unbind().click(function(){
				$('.clip-menu-popover').removeClass('popover-open');
				event.trigger(event.SHOW_PAGE_CLIPS);
			});

            // bind event
            event.unbind(event.TIMELINE_SET_BACK30SEC);
            event.on(event.TIMELINE_SET_BACK30SEC, function (e) {
				console.log("[TIMELINE] Back 30 Sec");
				var a = Timeline.model.time;
				a = new Date(a-30000);
				console.log("back 30 sec " + a);
				self.sendPlayerRecords(a);
            });

			event.unbind(event.TIMELINE_SET_FORWARD30SEC);
            event.on(event.TIMELINE_SET_FORWARD30SEC, function (e) {
                var a = Timeline.model.time;
				a = new Date(a+30000);
				self.sendPlayerRecords(a);
            });
            
			event.unbind(event.TOGGLE_STREAMING);
			event.on(event.TOGGLE_STREAMING, function (e) {
				console.log("[TIMELINE] Toggle streaming");
				CloudAPI.cameraInfo().done(function(response){
					this.cam = response;
					backbone.currentCamera = response;
					event.trigger(event.CALENDAR_UPDATE);
					console.log("[TIMELINE] Send dispose");
					self.dispose();
					console.log("[TIMELINE] get camera info and initialize");
					self.initialize();
					self.renderTimeline();
					// self.updateEventFilter();
				});
            });

            event.unbind(event.TIMELINE_PORTION_DATA_LOADED);
			event.on(event.TIMELINE_PORTION_DATA_LOADED, function (e) {
				if(Timeline.realDomainUTC){
					if(arguments[0] < Timeline.realDomainUTC[1] && arguments[1] > Timeline.realDomainUTC[0]){
						self.drawRecordsLoading();
						self.drawEventsLoading();
						self.drawRecords();
						self.drawEventPoints();
						if(Timeline.model.time < self.timelineLoader.firstDataRecordTime){
							console.warn("Removed played records");
							event.trigger(event.TIMELINE_REINIT_START_RECORD);
						}
					}
				}
            });

            event.unbind(event.TIMELINE_PORTION_DATA_LOADING);
			event.on(event.TIMELINE_PORTION_DATA_LOADING, function (e) {
				if(Timeline.realDomainUTC){
					// console.log("TIMELINE_PORTION_DATA_LOADING ", arguments);
					if(arguments[0] < Timeline.realDomainUTC[1] && arguments[1] > Timeline.realDomainUTC[0]){
						// console.log("TIMELINE_PORTION_DATA_LOADING draw");
						self.drawRecordsLoading();
						self.drawEventsLoading();	
					}
				}
            });
            
            event.unbind(event.TIMELINE_LOADING);
			event.on(event.TIMELINE_LOADING, function (e) {
				$('.timeline-container').addClass('loading');
            });
            
            event.unbind(event.TIMELINE_LOADED);
			event.on(event.TIMELINE_LOADED, function (e) {
				$('.timeline-container').removeClass('loading');
            });

			event.unbind(event.TIMELINE_CLEANUP);
            event.on(event.TIMELINE_CLEANUP, function (e) {
				self.dispose();
				self.renderTimeline();
			});
			
			event.unbind(event.TIMELINE_UPDATE);
            event.on(event.TIMELINE_UPDATE, function (e) {
				event.trigger(event.CALENDAR_UPDATE);
				console.log("[TIMELINE] Send dispose");
				self.dispose();
				console.log("[TIMELINE] get camera info and initialize");
				self.initialize();
				self.renderTimeline();
				// self.updateEventFilter();
			});

			event.unbind(event.TIMELINE_SEARCH_CURSOR);
            event.on(event.TIMELINE_SEARCH_CURSOR, function (e) {
				console.log("[TIMELINE] Search Cursor");
				self.setDomain(self._calcDomain());
			});

			event.unbind(event.TIMELINE_REINIT_START_RECORD);
            event.on(event.TIMELINE_REINIT_START_RECORD, function (e) {
				console.log("[TIMELINE] Reinit start record");
				var a = Timeline.model.time;
				var t = new Date();
				t.setTime(a);
				self.sendPlayerRecords(t);
			});

            event.unbind(event.PLAYER_TIME_CHANGED);
            event.on(event.PLAYER_TIME_CHANGED, function (time) {
				// console.log("event.PLAYER_TIME_CHANGED: " + time);
                var oldVisible = self.playheadVisible;
                var old_position = Timeline.model.time;
                Timeline.model.time = time;
                self.playheadVisible = self._timeInDomain();
                var el = $('.datepicker-container .current-time');
                var day_cntr = $('.datepicker-container .current-day');
                if (el) {
					// visualization time
					if(!time) time = CloudAPI.getCurrentTimeByCameraTimezone();
					time = self.correctTime(time);
                    el.text(new Date(time).format('isoTime'));
                }
                if (day_cntr) {
                    var txt = new Date(time).format('isoDate') == new Date().format('isoDate') ? app.polyglot.t('calendar_today') : new Date(time).format('d mmm yyyy');
                    // var txt = new Date(time).format('d mmm yyyy');
                    day_cntr.text(txt);
                }
                var endTime = Timeline.realDomainUTC[1];
                // console.log("endTime=", endTime);
                var t = self.dimensions;
                var d = Timeline.getDuration();
                var i = (d * (t.visibleTimelineWidth / t.timelineWidth));
                if (self._timeInEndDomain() && oldVisible) {
					console.log("_timeInEndDomain switch domain");
					var Domain = Timeline.realDomainUTC;
					Domain[0] += i/2;
					Domain[1] += i/2;
                    if(!Timeline.locked){
                        self.setDomain(Domain);
                    }else{
						console.warn("Domain locked 1");
					}
                }
                self.drawPlayhead();
            });
            event.unbind(event.RECORD_ENDED);
            event.on(event.RECORD_ENDED, function (cb) {
				// console.log("[TIMELINE] RECORD_ENDED");
				self.timelineLoader.searchNextRecord(self.activeSession.endTime).done(function(obj2){
					self.activeSession = new self.Record(obj2);
					cb(obj2);
				}).fail(function(){
					self.sessionWatchdog().setListner();
				});
            });
            event.unbind(event.MD_FILTERS_CHANGE);
            event.on(event.MD_FILTERS_CHANGE, function () {
                self.updateEventFilter();
                setTimeout(function(){self.drawEventPoints();},100);
            });
            event.unbind(event.CALENDAR_DATE_CHANGED);
            event.on(event.CALENDAR_DATE_CHANGED, function (data) {
				// $('.timeline-loader').show();
				var t = new Date();
				t.setUTCFullYear(data.year);
				t.setUTCMonth(data.month);
				t.setUTCDate(data.day);
				t = t.getTime() - t.getTime() % 86400000; // set zero for m:h:s ms
                var t1 = t - 86400000; // previous day
				t = t - CloudAPI.getOffsetTimezone();
				var start = t - Timeline.duration/2;
				var end = t + Timeline.duration/2;
				if(!self.timelineLoader.isLoad(start, end)){
					$('.timeline-container').addClass("loading");
				}
				self.timelineLoader.load(start, end).done(function(){
					var el = self.timelineLoader.recordList.recordDuringOrAfter(t);
					if(el && el.startTime > start && el.startTime < end){
						// if elem exists on this period
						self.setDomain(self._calcDomain(el.startTime));
						$('.timeline-container').removeClass("loading");
					}else{
						// loading all this day
						start = t;
						end = t + 86400000;
						if(!self.timelineLoader.isLoad(start, end)){
							$('.timeline-container').addClass("loading");
						}
						console.log("CALENDAR_DATE_CHANGED " + start + ":" + end)
						self.timelineLoader.load(start, end).done(function(){
							var el = self.timelineLoader.recordList.recordDuringOrAfter(t);
							if(el && el.startTime >= start && el.startTime < end){
								self.setDomain(self._calcDomain(el.startTime));
							}else{
								console.error("Failed " + start + ":" + end, el);
							}
							$('.timeline-container').removeClass("loading");
						});
					}
				});
				
            });
			
			this.stopUpdateCalendar = function(){
				clearInterval(this.calendarObserver);
			}

			this.startUpdateCalendar = function(){
				this.stopUpdateCalendar();
				this.calendarObserver = setInterval(function () {
					console.log("[CALENDAR] Observer process");
					event.trigger(event.CALENDAR_UPDATE);
				},6e5); // one time in hour
			}

			event.unbind(event.CALENDAR_UPDATE);
			event.on(event.CALENDAR_UPDATE, function(){
				console.log("[CALENDAR] Update...");
				Calendar.cleanup();
				Calendar.initialize(event);
				Calendar.renderCalendar();
                self.stopUpdateCalendar();
                self.startUpdateCalendar();
			});

			event.unbind(event.CALENDAR_CLEANUP);
			event.on(event.CALENDAR_CLEANUP, function(){
				console.log("[CALENDAR] cleanup...");
				Calendar.cleanup();
                Calendar.initialize(event);
                // Calendar.renderCalendar();
				self.stopUpdateCalendar();
			});

            this.camera = backbone.camera;
            this.jumpAheadCutoff = 0.75;
			Timeline.realDomainUTC = this._calcDomain();
            this.timeScale = d3.time.scale().range([0, this.dimensions.timelineWidth]).domain([
				Timeline.realDomainUTC[0],
				Timeline.realDomainUTC[1]
            ]);

			// load first data
			if(!self.timelineLoader.isLoad(Timeline.realDomainUTC[0], Timeline.realDomainUTC[1])){
				$('.timeline-container').addClass("loading");
			}
			this.timelineLoader.load(Timeline.realDomainUTC[0], Timeline.realDomainUTC[1]).done(function(){
				$('.timeline-container').removeClass("loading");
			});
            
            d3.select(window).on("resize", underscore.bind(this.resizeEventHandler, this));
            view.prototype.initialize.apply(this, arguments);

            this.initializeAxes();
            $('.zoom-levels span').click(function (e) {
				if($('.timeline-container').hasClass('loading'))
					return;

                var duration = parseInt($(this).attr('duration'),10);
				var durationScale = parseInt($(this).attr('scale'),10);
				if(Timeline.duration != duration){
					$('.zoom-levels span').removeClass('active');
					$(this).addClass('active');
					
					var a = self.getRealDomain();
					var t = self._timeInDomain() ? Timeline.model.time || null : a[1] - ((a[1] - a[0]) /2);
					if(!t) t = a[1] - ((a[1] - a[0]) /2);
					Timeline.duration = duration;
					Timeline.durationScale = durationScale;
					self.lockAndRelaseAfterTime(1000); // ???
					var tmp = self._calcDomain(t);
					// timeline-container
					if(!self.timelineLoader.isLoad(tmp[0], tmp[1])){
						$('.timeline-container').addClass('loading');
					};

					self.timelineLoader.load(tmp[0], tmp[1]).done(function(){
						$('.timeline-container').removeClass('loading');
						self.setDomain(tmp);
					});
				}
            });
            this.setControlBuindings();
            this.timelineLoader.startDataPoling(config.timeline.poolingInterval || 30000);
            self.loaded = 1;
            this.startUpdateCalendar();
            event.trigger(event.PLAYER_TIME_CHANGED, CloudAPI.getCurrentTimeUTC());
            // this.setDomain(this._calcDomain())
        },
        dispose:function(){
			console.log("[TIMELINE] dispose");
			d3.select(window).on("resize", null);
			clearInterval(this.calendarObserver);
			Timeline.duration = Timeline.defaultDuration;
			Timeline.durationScale = Timeline.defaultDurationScale;
            this.activeSession = null;
            this.timelineLoader.stopDataPoling();
            this.timelineLoader.clearAllData();
            this.timezoneOffset = undefined;
            this.localOffset = undefined;
            Timeline.realDomainUTC = undefined;
            this.sessionWatchdog().removeListner();
            this.svg.remove();
            // this.removeListner();
            Calendar.cleanup();
            this.dismissThumbnail();

            $('.skyvr-timeline-thumbnail').css({
				'background-image': 'unset'
			});
			$('.skyvr-timeline-thumbnail').attr({'time' : 0});
        },
        getDataForTimeline: function (data,param1) {
            var localData = data;
            var timeRange = this.getRealDomain(Timeline.getDuration()); //15 minutes overhead in data
            var start = timeRange[0] - Timeline.duration;
            var end = timeRange[1] + Timeline.duration;
            if(Timeline.duration < 3600000){ // duration less than 1 hour
				var start = timeRange[0] - 5400000; // - 1.5 hour
				var end = timeRange[1] + 5400000; // + 1.5 hour
			}
            if(localData.length < 300){
                return data;
            }
            return localData.filter(function(el){
				return el[param1] > start && el[param1] < end;
			})
        },
        setControlBuindings: function () {
            var self = this;
            $('.timeline-container span.page').click(function (e) {
                // console.log($(this).data());
                self.skipPage($(this).data('target'));
            })
        },
        sendPlayerRecords: function(a){
			var self = this;
			self.sessionWatchdog().removeListner();
				self.timelineLoader.searchFirstRecord(a.getTime()).done(function(obj1){
					obj1 = new self.Record(obj1, a);
					self.activeSession = obj1;
					Timeline.model.time = obj1.startTime;
					console.log("[TIMELINE] searchNextRecord " + obj1.endTime);
					self.timelineLoader.searchNextRecord(obj1.endTime).done(function(obj2){
						obj2 = new self.Record(obj2);
						self.activeSession = obj2; // TODO last record
						Timeline.model.time = obj1.startTime;
						event.trigger(event.PLAYER_START_RECORD, [obj1, obj2]);
						// TODO if not visible
						self.setDomain(self._calcDomain(obj1.startTime));
						$('.datepicker-container .popover-overlay').click();
					}).fail(function(){
						self.sessionWatchdog().setListner();
						Timeline.model.time = obj1.startTime;
						event.trigger(event.PLAYER_START_RECORD, [obj1, null]);
						// TODO if not visible
						self.setDomain(self._calcDomain(obj1.startTime));
						$('.datepicker-container .popover-overlay').click();
					});
				}).fail(function(){
					event.trigger(event.PLAYER_START_LIVE);
				});
		},
        initializePlayhead: function () {
            this.playhead = this.svg.append("g").attr("class", "playhead").attr("width", config.timeline.hoverWidth).attr("height", config.timeline.hoverHeight);
            this.playhead.append("rect").attr("class", "playhead-hover").attr("x", 0).attr("y", 0).attr("width", config.timeline.hoverWidth).attr("height", config.timeline.hoverHeight);
            this.playhead.append("rect").attr("x", config.timeline.hoverWidth / 2 - config.timeline.playheadWidth / 2).attr("y", 10).attr("rx", 2).attr("ry", 2).attr("width", 8).attr("height", 40).attr('fill', '#0c6685');
            this.playhead.append("rect").attr("x", (config.timeline.hoverWidth / 2 - config.timeline.playheadWidth / 2) + 1).attr("y", 11).attr("rx", 2).attr("ry", 2).attr("width", 6).attr("height", 38);
        },
        lockAndRelaseAfterTime:function(time){
			Timeline.lock();
            console.log('[TIMELINE] changetime locked');
            var self = this;
            setTimeout(function(){
                console.log('[TIMELINE] changetime unlocked');
                Timeline.unlock();
            },time)
        },
        sessionWatchdog: function () {
            var self = this;
            if(!self.sessionWD){
                self.sessionWD = {
                    intervalTime: 2e3,
                    updateInterval:null,
                    setListner:function(){
                        var t = this;
                        var updateFunction = function(){
							if(self.activeSession == null){
								clearInterval(t.updateInterval);
								return;
							}
                            var rec = self.timelineLoader.searchNextRecord(self.activeSession.endTime).done(function(obj1){
								self.activeSession = new self.Record(obj1);
								event.trigger(event.RECORD_ADDED, obj1);
                                clearInterval(t.updateInterval);
							});
                        }
						this.updateInterval = setInterval(function () {
							updateFunction();
						},t.intervalTime)

                    },
                    removeListner: function () {
                        if(this.updateInterval){
                            clearInterval(this.updateInterval);
                            this.updateInterval = null;
                        }
                    }
                }
            }
            return self.sessionWD;
        },
        initializeAxes: function () {
            var self = this;
            addZeros = function (time, len) {
                return ("00" + time).slice(-2);
            }
            var monthesTrans = ["short_Jan", "short_Feb", "short_Mar",
				"short_Apr", "short_May", "short_June",
				"short_July", "short_Aug", "short_Sep",
				"short_Oct", "short_Nov", "short_Dec"
			];
            this.labelledAxis = d3.svg.axis().scale(this.timeScale).orient("bottom").ticks(10).tickSize(0).tickFormat(function (e) {
                var t = '';
                var correct_e = self.correctTime(e.getTime());
				var time = correct_e.getHours()*60 + correct_e.getMinutes();
				var day_month = correct_e.getDate() + app.polyglot.t(monthesTrans[correct_e.getMonth()]);
				if(CloudAPI.lang() == 'ko'){
					day_month = addZeros(correct_e.getMonth()+1, 2) + '/' + addZeros(correct_e.getDate(), 2);
				}
				var hm = addZeros(correct_e.getHours(), 2) + ":" + addZeros(correct_e.getMinutes(), 2);
				var scale = parseInt(Timeline.durationScale / 60000,10);
				if(this.showUTC == undefined)
					this.showUTC = CloudAPI.containsPageParam("timeline_in_utc");
				if(this.showUTC)
					hm = "UTC " + addZeros(e.getUTCHours(), 2) + ":" + addZeros(e.getUTCMinutes(), 2);
				t = time < scale ? day_month : hm + (time % scale*3 < scale ? ' (' + day_month + ')' : '');
                return t;
            });
            this.yScale = d3.scale.linear().range([this.dimensions.timelineHeight, 0]).domain([0, 2]);
            this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").tickSize(this.dimensions.timelineWidth).tickValues([0]).tickFormat("")

        },
        initializeGroups: function () {
			var self = this;
            var e = this.dimensions;
            this.svg.append('g').attr('id', 'sess-backgound').attr("transform", this._cssTranslate(0, 20)).append('rect').attr('width', e.timelineWidth).attr("height", 20).attr("class", "timeline-background").attr("x", 0).attr("y", 0);
            this.svg.append("clipPath").attr("id", "session-clip").append("rect").attr("width", e.timelineWidth).attr("height", e.timelineHeight).attr("x", 0).attr("y", 0);
            this.svg.append("g").attr("class", "y axis").attr("stroke-width", 1).attr("transform", this._cssTranslate(e.timelineWidth, 0));
            this.labelledG = this.svg.append("g").attr("class", "g axis labelled").attr("transform", this._cssTranslate(0, 20));
            this.labelledG.select('.tick line').attr('y1', -cc.timeline_recordsHeight);
			this.cuepointG = this.svg.append("g").attr("class", "cuepoints").attr("transform", this._cssTranslate(0, 0));
			this.sessionG = this.svg.append("g").attr("class", "sessions").attr("clip-path", "url(#session-clip)").attr("transform", this._cssTranslate(0, 18));
			this.recordsLoadingG = this.svg.append("g").attr("class", "recordsLoading").attr("transform", this._cssTranslate(0, 18));
			this.eventsLoadingG = this.svg.append("g").attr("class", "eventsLoading").attr("transform", this._cssTranslate(0, 18));
			this.initializePlayhead();

            // this.labelledG.select('.tick line').attr('y1', -cc.timeline_recordsHeight);
            //this.makeClipG = this.svg.append("g").attr("class", "make-clip");
            //this.initializeMakeClip()

			// TODO redesign this code
			// init background image
			CloudAPI.cameraPreview(CloudAPI.cameraID()).done(function(previews){
				$('.skyvr-timeline-thumbnail').css({ 'background-image': 'url(' + previews.url + ')' });
			});

			// TODO redesign this code
			self.lastThumbnailPageX = -1;
			var prevPageX = -1;
			var updatingThumbnail = false;
			var updatingThumbnailTimeout = undefined;

			function updateThumbnail(){
				if(updatingThumbnail == true){
					clearTimeout(updatingThumbnailTimeout);
					updatingThumbnailTimeout = setTimeout(updateThumbnail,100);
				}
				updatingThumbnail = true;
				try{
					if(self.lastThumbnailPageX > 0){
						// console.log("thumb lastPageX = ", lastPageX);
						var left_x  = $('.timeline-container').offset().left;
						var right_x = left_x + $('.timeline-container').width();

						if(self.lastThumbnailPageX < left_x || self.lastThumbnailPageX > right_x){
							self.dismissThumbnail();
							updatingThumbnail = false;
							return;
						}

						var left = $('#sess-backgound').offset().left;
						var x = self.lastThumbnailPageX - left;
						var t = self.timeScale.invert(x).getTime();

						if(!self.timelineLoader.isExistingRecord(t)){
							self.dismissThumbnail();
							updatingThumbnail = false;
							return;
						}

						var thumb = self.timelineLoader.searchThumbnail(t, Timeline.durationScale/1000);
						if(thumb){
							var thumb_t = new Date(Date.parse(thumb.time + "Z"));
							var newx = Math.floor(self.timeScale(thumb_t)) + left;
							if(newx < left_x || newx > right_x){
								self.dismissThumbnail();
								updatingThumbnail = false;
								return;
							}
							self.drawThumbnail(thumb, x + left, t);
						}else{
							self.dismissThumbnail();
						};
					}
				}catch(e){
					console.log(e);
				}finally{
					updatingThumbnail = false;
				}
			};

			// TODO redesign this code
            $('.timeline-container').unbind('mousemove').bind('mousemove', function(e){
				// console.log("thumb PageX", e.pageX);
				var t = $('.timeline-container').offset().top;
				var marg = 10;
				var miny = t + 20 - marg;
				var maxy = miny + 20 + 2*marg;
				var y = e.pageY;
				if( y > miny && y < maxy)
					self.lastThumbnailPageX = e.pageX;
				else
					self.lastThumbnailPageX = -1;

				updateThumbnail();
			});
        },
        initializeZoom: function () {
			var self = this;
            var t = this,
                n = this.dimensions;
                this.clickState = null;
			var timelineContainer = $('.timeline-container');
            this.zoom = d3.behavior.zoom().scaleExtent([1, 1]).x(this.timeScale).on("zoomstart", underscore.bind(function () {
				if(timelineContainer.hasClass("loading")){
					Timeline.unlock();
					return;
				};
                if(d3.event.sourceEvent && !this.isDragging) {
                    d3.event.sourceEvent.stopPropagation();
                }
                t.isDragging = 1;
                Timeline.lock();
            }, this)).on("zoomend", underscore.bind(function () {
				if(timelineContainer.hasClass("loading") || t.isDragging == 0){
					return;
				};
                this.playheadVisible = this._timeInDomain();
                t.isDragging = 0;
                this.zoom.x(this.timeScale);
				Timeline.realDomainUTC[0] = self.timeScale.domain()[0].getTime();
				Timeline.realDomainUTC[1] = self.timeScale.domain()[1].getTime();
				self.setDomain(Timeline.realDomainUTC);
            }, this)).on("zoom", underscore.bind(function () {
				if(timelineContainer.hasClass("loading") || t.isDragging == 0){
					Timeline.unlock();
					return;
				};
                var e = this.zoom.translate()[0];
                //if (e > 0 && this.isOutOfBoundsLeft() || 0 > e && this.isOutOfBoundsRight()) return 0;
                this.drawAxes();
                this.drawRecords();
                this.drawEventPoints();
                this.drawPlayhead();
                this.drawRecordsLoading();
				this.drawEventsLoading();
				Timeline.realDomainUTC[0] = self.timeScale.domain()[0].getTime();
				Timeline.realDomainUTC[1] = self.timeScale.domain()[1].getTime();
				if(!self.timelineLoader.isLoaded(Timeline.realDomainUTC[0],Timeline.realDomainUTC[1])){
					$('.timeline-container').addClass("loading");
					Timeline.lock();
					self.setDomain(Timeline.realDomainUTC);
					self.timelineLoader.load(Timeline.realDomainUTC[0],Timeline.realDomainUTC[1]).done(function(){
						$('.timeline-container').removeClass("loading");
						Timeline.unlock();
					});
				};
            }, this));
            check = function(event){
                var moveDelta = 5;
                if(Math.abs(t.clickState.clientX - event.clientX) < moveDelta){
                    return false;
                }
                return true;
            }
            this.svg = d3.select($(".timeline-container svg")[0]).attr(
				"height", n.svgHeight
			).attr("viewBox", "0 0 " + n.svgWidth + " " + n.svgHeight).attr(
				"preserveAspectRatio",
				"xMaxYMax slice"
			).call(this.zoom).on("mouseleave", function (evt) {
				self.dismissThumbnail();
				Timeline.unlock();
				return 0;
			}).on("mousedown", function () {
                t.clickState = d3.event;
                Timeline.lock();
                return 0;
			}).on("click", function () {
				// console.log("click: ", d3.event);
				console.log("[TIMELINE] Click")
				Timeline.unlock();
                if (check(d3.event)) {
                    return 0;
                }
                var e = d3.mouse(this),
                    s = e[0] - n.margin.left,
                    a = t.timeScale.invert(s);
                    console.log('[TIMELINE] click, a = ', a);
				t.lastPlayRecord = undefined;

				console.log('[TIMELINE] player ' + a);
				t.sendPlayerRecords(a);
            }).append("g").attr("class", "wrapper").attr("transform", this._cssTranslate(n.margin.left, 0));
        },
        calculateWidthOfTimelineContainer: function(){
			var wl = $(".adjacent-controls.left").width() + $(".adjacent-controls.left2").width();
			if(CloudAPI.containsPageParam('mobile')){
				var o = $(".player-footer").width()  - 82;
				this.dimensions.visibleTimelineWidth = o;
				return o;
			}
            var e = $(".adjacent-controls.left").css('display')=="none" ? 0 : wl,
                t = $(".adjacent-controls.right").css('display')=="none" ? 0 : $(".adjacent-controls.right").width(),
                n = $(".player-footer").width(),
                s = $(".player-container").width(),
                a = ((n - s) / 2) - 62,
                o = Math.min(s, n - e - t - 62);
            if($(".adjacent-controls.left").css('display')=="none"){
                o = n-120;
            }
            this.dimensions.visibleTimelineWidth = o;
            return o;
		},
        resizeEventHandler: underscore.debounce(function () {
		
			var d = Timeline.getDuration();
			d = d*this.dimensions.visibleTimelineWidth/this.dimensions.timelineWidth;
			var middlePoint = Timeline.realDomainUTC[1] - d/2;

			var o = this.calculateWidthOfTimelineContainer();
			$('.timeline-container').width(o);
			d3.select($(".timeline-container svg")[0]).attr("width", o);
			$('.timeline .page.right').css("margin-left", (o + 10) + "px");
			if(!CloudAPI.containsPageParam('mobile'))
				$('.timeline .zoom-levels').css("left", (o + 20) + "px");
			if(this.playheadVisible){
				this.setDomain(this._calcDomain());
			}else{
				t = middlePoint;
				d = Timeline.getDuration();
				d = d*this.dimensions.visibleTimelineWidth/this.dimensions.timelineWidth;
				var a = t + (0.5 * d);
				var s = a - Timeline.getDuration();
				this.setDomain([s, a]);
			}

			/*this.drawAxes();
			this.drawRecords();
			this.drawRecordsLoading();
			this.drawEventPoints();
			this.drawEventsLoading();
			this.drawPlayhead();*/

			// TODO redesign this code
			var h = 120;
			var t =  $('.timeline-container').offset().top - h;
			$('.skyvr-timeline-thumbnail-container').css({'top': t + 'px'});
        }, 50),
        getCvrEnd: function () {
			var endTime = this.timelineLoader.recordList.lastEndTime();
			var calendarMaxTime = Calendar.maxDate ? Calendar.maxDate.getTime() : undefined;
			return endTime || calendarMaxTime || CloudAPI.getCurrentTimeUTC();
        },
        isOutOfBoundsLeft: function () {
			var firstStartTime = this.timelineLoader.recordList.firstStartTime() || CloudAPI.getCurrentTimeUTC();
            var e = this.timeScale(firstStartTime),
                t = this.dimensions.timelineWidth - this.dimensions.visibleTimelineWidth,
                i = Math.floor(this.dimensions.visibleTimelineWidth / 2);
            return e > t + i
        },
        isOutOfBoundsRight: function () {
            var e = this.timeScale(this.getCvrEnd()),
                t = this.dimensions.timelineWidth,
                i = Math.floor(this.dimensions.visibleTimelineWidth / 2);
            return t - i > e
        },
        drawAxes: function () {
            this.svg.select("g.g.axis.labelled").call(this.labelledAxis);
            this.svg.selectAll("g.g.axis.labelled.g text").attr('transform', 'translate(0,30)');
            this.svg.selectAll("g.g.axis.labelled.g line").attr('y2', 20);
            this.svg.select("g.y.axis").call(this.yAxis)
        },
        updateEventFilter: function () {
            this.eventFilter = JSON.parse(localStorage.getItem("md_filter_" + this.cam.id));
        },
        updateEvents: function(data) {
            var self = this;
            if (!underscore.isArray(data)){
                return [];
            }
            this.displayedEvents = underscore.filter(data,function(el){
                return el.name == 'net' ? true :  self.eventFilter[el.name] ;
            });
            return this.displayedEvents;

        },
        drawEventPoints: function () {
            var self = this;
            var t, a = this.dimensions,
                o = this.timelineLoader.eventList.list,
                c = this.timeScale,
                g = 0; //this.getBucketWidth();
            if(!this.cuepointG){
                setTimeout(function () {
                    self.drawEventPoints()
                },50)
                return;
            }

            underscore.each(o, function (el) {
                el.id = Date.parse(el.time);
                el.eventName = el.eventName || el.name;
            });
            f = function (e) {
                var t = (e.time);
                return c(t);
            };
            S = function (t) {
                return f(t) || 0
            };
            color = function (e) {
				//var s = {'net': "white", 'motion': "blue", 'sound': 'red'};
                var s = {'net': "#FFFFFF", 'motion': "#0080FF", 'sound': '#FF0000'};
                if(e.zone && e.zone > 0){
                    return config.md_zones.global_conf.zone_colors[e.zone - 1] || s[e.name];
                }
                return s[e.name]
            }
            // TODO call minifier version
            var width_point = 6;
			var scale_sec = Math.round((width_point+2)/(this.timeScale(2000)-this.timeScale(1000)));
			var domain = self.getRealDomain();
			var diff = (domain[1]-domain[0])*3;
			var startTime = domain[0] - diff;
			var endTime = domain[1] + diff;
			// console.log("scale_sec: ", scale_sec);
            var currentData = self.updateEvents(self.timelineLoader.getEventsMinifier(scale_sec, startTime, endTime));
            var M = this.cuepointG.selectAll("g").data(currentData);
            M.enter().append("g").append("circle").attr("class", "cuepoint");
            M.exit().remove();
            M.attr("transform", underscore.bind(function (e) {
				// TODO redesign it - a lot of calls
                return this._cssTranslate(c(new Date(e.time)), 0)
            }, this));
            M.select(".cuepoint").attr({
                cy: 20,
                r: width_point/2,
                fill: color
            });
            dismiss = function(e){
            }
        },
        drawClip: function () {
			// TODO
        },
        drawPlayhead: function () {
            var e = Timeline.model.time;
            if(!e) return 0;
            if(!this.playhead) return 0;
            /*if(!this._timeInDomain()){
				this.playhead.attr('display', 'none');
				return 0;
			}else{
				this.playhead.attr('display', '');
			}*/
            var t = Math.floor(this.timeScale(e));
			if(t != this.playheadPosition){
				this.playheadPosition = t;
				this.playhead.attr("transform", this._cssTranslate(t - config.timeline.hoverWidth / 2, 0));
				// TODO sea-kg
				if(Calendar.init){
					var d = this.correctTime2(e);
					var month = d.getUTCMonth();
					var date = d.getUTCDate();
					Calendar.drawActivityDate(month, date);
				}
			}
            return 0;
        },
        getRealDomain: function (delta) {
            delta = delta || 0;
            var t = this.dimensions;
            var i = (Timeline.getDuration() * (t.visibleTimelineWidth / t.timelineWidth));
            Timeline.realDomainUTC = Timeline.realDomainUTC || this._calcDomain(CloudAPI.getCurrentTimeUTC());
            return [Timeline.realDomainUTC[1] - i - delta, Timeline.realDomainUTC[1] + delta];
        },
        getRecordsPeriod: function(){
			var timeRange = this.getRealDomain(Timeline.getDuration()); //15 minutes overhead in data
            var start = timeRange[0] - Timeline.duration;
            var end = timeRange[1] + Timeline.duration;
            if(Timeline.duration < 3600000){ // duration less than 1 hour
				start = timeRange[0] - 5400000; // - 1.5 hour
				end = timeRange[1] + 5400000; // + 1.5 hour
			}
			return [start, end];
        },
        drawRecords: function () {
            var self = this;
            if (!self.loaded || !this.sessionG) { //prevent call drawRecords called before timeline initialized;
                setTimeout(function () {
                    self.drawRecords();
                },150);
                return;
            }
            var period = self.getRecordsPeriod();
            var data = self.timelineLoader.recordList.minifier(period[0], period[1]);
            var t = this.sessionG.selectAll("rect").data(data);
            var i = this.timeScale;
            var n = function (e) {
                var len = i(e.endTime) - i(e.startTime);
                return Math.floor(len) + 2;
            }

            var s = function (e) {
                return Math.floor(i(e.startTime));
            };
            t.enter().append("rect");
            t.exit().remove();
            t.attr({
                "class": "session",
                width: n,
                height: cc.timeline_recordsHeight,
                x: s,
                y: cc.timeline_recordsY
            });
        },
        drawRecordsLoading: function () {
            var self = this;
            if (!self.loaded || !this.recordsLoadingG) {
                return;
            }
            // test for loading
            var t = this.recordsLoadingG.selectAll("rect").data(this.timelineLoader.getRecordsLoading());
            var i = this.timeScale;
            var n = function (e) {
                var len = i(e.end) - i(e.start);
                return Math.floor(len) + 2;
            }
            var s = function (e) {
                return Math.floor(i(e.start));
            };
            t.enter().append("rect");
            t.exit().remove();
            t.attr({
                "class": "loading",
                width: n,
                height: cc.timeline_recordsHeight,
                x: s,
                y: cc.timeline_recordsY
            });
        },
        drawEventsLoading: function () {
            var self = this;
            if (!self.loaded || !this.eventsLoadingG) { //prevent call drawRecords called before timeline initialized;
                return;
            }
            // test for loading
            var t = this.eventsLoadingG.selectAll("rect").data(this.timelineLoader.getEventsLoading());
            var i = this.timeScale;
            var n = function (e) {
                var len = i(e.end) - i(e.start);
                return Math.floor(len)+1;
            }
            var s = function (e) {
                return Math.floor(i(e.start));
            };
            t.enter().append("rect");
            t.exit().remove();
            t.attr({
                "class": "loading",
                width: n,
                height: 6,
                x: s,
                y: 0
            });
        },
        drawThumbnail: function(thumb, x, time){
			if(CloudAPI.containsPageParam('mobile'))
				return;
			// TODO redesign this code
			var self = this;
			var w = 160; // thumb.width;
			var h = 120; //thumb.height;
			var l = x - w/2;
			var t =  $('.timeline-container').offset().top - h - 5;

			$('.skyvr-timeline-thumbnail-container').css({'left': l + 'px', 'top': t + 'px'});
			// $('.skyvr-timeline-thumbnail-time').text(CloudAPI.convertUTCTimeToStr(Date.parse(thumb.time + "Z") + CloudAPI.getOffsetTimezone()));
			$('.skyvr-timeline-thumbnail-time').text(CloudAPI.convertUTCTimeToSimpleStr(time + CloudAPI.getOffsetTimezone()));
			$('.skyvr-timeline-thumbnail-container').show();
			clearTimeout(self.closeThumbnail);

			// console.log("drawThumbnail: ", thumb);
			/*if(!self.img)
				self.img = new Image();
			else
				self.img.onload = function(){};*/

			var img = new Image();
			img.time = Date.now();
			img.onload = function(){
				// if (img.time == self.imgLastTime)
				var time = $('.skyvr-timeline-thumbnail').attr('time');
				/*console.log(time);
				console.log(this.time);
				console.log(this.time >= time);*/
				if (this.time >= time){
					$('.skyvr-timeline-thumbnail').attr({'time' : this.time});
					$('.skyvr-timeline-thumbnail').css({
						'background-image': 'url(' + thumb.url + ')'
					});
					clearTimeout(self.closeThumbnail);
					self.closeThumbnail = setTimeout(function(){
						self.dismissThumbnail();
					},2000);
				}
			};
			img.onerror = function(){
				var time = $('.skyvr-timeline-thumbnail').attr('time');
				if (this.time >= time){
					clearTimeout(self.closeThumbnail);
					self.dismissThumbnail();
				}
			}
			img.src = thumb.url;
		},
		dismissThumbnail: function(){
			self.lastThumbnailPageX = -1;
			$('.skyvr-timeline-thumbnail-container').hide();
			clearTimeout(self.closeThumbnail);
		},
        renderTimeline: function () {
            var self = this;
            if (!this.loaded) {
                setTimeout(function () {
                    self.renderTimeline()
                }, 100);
                return;
            }
            this.initializeZoom();
            this.initializeGroups();
            this.resizeEventHandler();
            $('.timeline-container').css('display', '');
            this.drawRecords();
            this.drawRecordsLoading();
            this.drawEventsLoading();
        },
        _timeInDomain: function(t,i){
            i = i || this.getRealDomain();
            t = t || Timeline.model.time;
            var conf = this.dimensions;
            var d = Timeline.getDuration();
            var delta = (d * (conf.visibleTimelineWidth / conf.timelineWidth));
            var result = t > i[1] - delta && t < i[1];
            return result;
        },
        _timeInEndDomain: function(t,i){
            i = i || this.getRealDomain();
            t = t || Timeline.model.time;
            var conf = this.dimensions;
            var d = Timeline.getDuration();
            var delta = (d * (conf.visibleTimelineWidth / conf.timelineWidth));
            var result = t > i[1] - delta*0.05 && t < i[1];
            return result;
        },
        _cssTranslate: function(e,t){
			if(isNaN(e) || isNaN(t)){
				CloudAPI.printStack();
				console.error("some values is NaN ");
			}
			e = Math.floor(e);
			t = Math.floor(t);
            return "translate(" + e + "," + t + ")";
        },
        skipPage: function (e) {
			var self = this;
			if($('.timeline-container').hasClass("loading")){
				return;
			};
            var t = this.dimensions;
            var i = Timeline.getDuration() * (t.visibleTimelineWidth / t.timelineWidth);
            var n = "fwd" === e ? i : 0 - i;
            var tmp = [
				Timeline.realDomainUTC[0] + n,
				Timeline.realDomainUTC[1] + n
            ]
            /*Timeline.realDomainUTC[0] += n;
            Timeline.realDomainUTC[1] += n;*/

			if(!this.timelineLoader.isLoaded(tmp[0], tmp[1])){
				$('.timeline-container').addClass("loading");
			}
			
            this.timelineLoader.load(tmp[0], tmp[1]).done(function(){
				Timeline.realDomainUTC[0] = tmp[0];
				Timeline.realDomainUTC[1] = tmp[1];
				self.setDomain(Timeline.realDomainUTC);
				$('.timeline-container').removeClass("loading");
			});
        },
        _calcDomain: function(t){
            var d = Timeline.getDuration();
            if(!this.dimensions.visibleTimelineWidth){
				this.calculateWidthOfTimelineContainer();
			}
			d = d*this.dimensions.visibleTimelineWidth/this.dimensions.timelineWidth;
            t = t || Timeline.model.time;
            var n = this.jumpAheadCutoff;
            var a = t + (n * d);
            var s = a - Timeline.getDuration();
            if(this.timeScale){
                var o = this.timeScale.invert(0) < t ? "fwd" : "back";
                if ("fwd" === o && this.isOutOfBoundsRight() || "back" === o && this.isOutOfBoundsLeft()) {
                    if(!isNaN(s) && !isNaN(a)){
                        return [s, a];
                    }
                    return Timeline.realDomainUTC;
                }
            }
            return [s, a]
        },
        correctTime: function(t){ // must be timestamp
			// ad-hoc
			// for example: timezoneOffset: +9 (camera timezone), +6 (local timezone)
			// t - utc time
			// return t + 9 - 6 or t + 3
			if(!this.timezoneOffset)
				this.timezoneOffset = CloudAPI.getOffsetTimezone();
			if(!this.localOffset)
				this.localOffset = new Date().getTimezoneOffset()*-60000;
			d = new Date(t + this.timezoneOffset - this.localOffset);
			return d;
		},
		correctTime2: function(t){ // must be timestamp
			// ad-hoc
			// for example: timezoneOffset: +9 (camera timezone)
			// t - utc time
			// return t + 9
			if(!this.timezoneOffset)
				this.timezoneOffset = CloudAPI.getOffsetTimezone();
			d = new Date(t + this.timezoneOffset);
			return d;
		},
        setDomain: function (s) {
			// TODO move to Timeline
			// console.log("[DEBUG] setDomain", s);
			s = s || this._calcDomain();
			if(isNaN(s[0]) || isNaN(s[1])){
				CloudAPI.printStack();
				console.error("setDomain has error");
				return;
			}
			/*if (Timeline.realDomainUTC[0] == s[0] && Timeline.realDomainUTC[1] == s[1]){
				// already set this values
				return;
			}*/
            Timeline.realDomainUTC[0] = s[0];
			Timeline.realDomainUTC[1] = s[1];
			
			// correct domain right border
			var rigth_border = CloudAPI.getCurrentTimeUTC() + Timeline.duration*this.jumpAheadCutoff;
			if(Timeline.realDomainUTC[1] > rigth_border){
				var diff = Timeline.realDomainUTC[1] - rigth_border;
				Timeline.realDomainUTC[0] = Timeline.realDomainUTC[0] - diff - 60000;
				Timeline.realDomainUTC[1] = Timeline.realDomainUTC[1] - diff - 60000;
			};

			// correct domain left border
			if(this.timelineLoader && this.timelineLoader.firstDataRecordTime){
				this.calculateWidthOfTimelineContainer();
				var left_border = this.timelineLoader.firstDataRecordTime - Timeline.duration*this.jumpAheadCutoff;
				if(Timeline.realDomainUTC[0] < left_border){
					var diff = left_border - Timeline.realDomainUTC[0];
					Timeline.realDomainUTC[0] = Timeline.realDomainUTC[0] + diff + 60000;
					Timeline.realDomainUTC[1] = Timeline.realDomainUTC[1] + diff + 60000;
				}
			}

			var tmp = [
				Timeline.realDomainUTC[0],
				Timeline.realDomainUTC[1]
			];

			/* without animation:
			 * this.timeScale.domain(tmp);
			this.playheadVisible = this._timeInDomain();
			this.drawAxes();
			this.drawRecords();
			this.drawEventPoints();
			this.drawPlayhead();*/
			if(!this.svg){
				return;
			}
            this.isTransitioningAxis = 1;
            this.svg.transition().duration(1e3).tween("axis", underscore.bind(function () {
                var t1 = d3.interpolate(this.timeScale.domain(), tmp);
                return underscore.bind(function (e) {
                    this.timeScale.domain(t1(e));
                    // console.log("[DEBUG] this.timeScale.domain", this.timeScale.domain());
                    this.playheadVisible = this._timeInDomain();
                    this.drawAxes();
                    this.drawRecords();
                    this.drawRecordsLoading();
                    this.drawEventPoints();
                    this.drawEventsLoading();
                    this.drawPlayhead();
                    //this.drawMakeClipHandles()
                }, this);
            }, this)).each("end", underscore.bind(function () {
                this.isTransitioningAxis = 0;
                this.zoom.x(this.timeScale);
				this.timelineLoader.load(tmp[0], tmp[1]);
				var d = Timeline.duration;
				this.timelineLoader.load(tmp[0] - d, tmp[1] - d);
				this.timelineLoader.load(tmp[0] + d, tmp[1] + d);
				this.timelineLoader.load(tmp[0] - d*2, tmp[1] - d*2);
				this.timelineLoader.load(tmp[0] + d*2, tmp[1] + d*2);
            }, this));
        }
    });

    return obj;

})
