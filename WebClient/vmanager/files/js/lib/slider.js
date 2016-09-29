/**
 * Created by Exception on 25.08.2015.
 */
 
define('slider',['underscore','backbone','config','event','application'],function(_,Backbone,config,event,app){
    var obj = _.extend({},{
        initialize:function(element){
            this.container = $(element);
            // this.container.attr('id','transition_disabled');
            if(!this.slides){

            }
            this.slides = new Array();
            this.pager = new Array();
            this.structure = null;
            this.currentPosition = 0;
            this.displayType = 0;
            this.hideArrows = 0;
            var self = this;
            $(window).on('resize',function(){
                self.resizeHandler && self.resizeHandler(self);
            });
            return this;
        },
		dispose:function(){
			this.slides = new Array();
            this.pager = new Array();
            this.structure = null;
            this.currentPosition = 0;
            this.displayType = 0;
            this.hideArrows = 0;
		},
        Slide: function(params, app){
            var self = this;
            var obj = new Object();
            obj.params = params;
            _.extend(obj.params, config.slider.slide);
            obj.render = function(){
                var item = $('<div class="slide"></div>');
                item.css({float:this.hideArrows ? 'initial' : 'left'})
                item.data('cid',this.params.id);
				var camstat = {
					'active' : app.polyglot.t('On'),
					'inactive' : app.polyglot.t('Off'),
					'inactive_by_scheduler' : app.polyglot.t('Off'),
					'offline' : app.polyglot.t('Disconnected'),
					'unauthorized' : app.polyglot.t('Wrong configuration')
				};
                var camstat_text = '';
				if(this.params.status && camstat[this.params.status]){
					camstat_text = camstat[this.params.status];
				};
                item.append($("<img class='slide-img " + this.params.status + "' id='capture_screen_" + this.params.id + "' border='0'>").on('error', 
					function(){
						if($(this).attr('src') != ''){
							console.error("could not load image: " + $(this).attr('src') + " For " + $(this).attr('id') + " change to default");
							$(this).attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AUNCR061qtorgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXY/z//z8DAwMDAxMDFAAAMAYDAZWbBRUAAAAASUVORK5CYII%3D');
						}
					})
					.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AUNCR061qtorgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAVSURBVAjXY/z//z8DAwMDAxMDFAAAMAYDAZWbBRUAAAAASUVORK5CYII%3D')
				);
				var name = this.params.name != "" ?  this.params.name : app.polyglot.t('Noname');
                item.append($("<div class='slide_description'></div>")
					.append("<span class='main'>"+name+"</span>")
					// .append('<span class="italic">'+camstat_text+'</span>')
                );
                return item;
            };
            return obj;
        },
		updatePreview:function(app){
			// console.log("[SLIDER] update preview begin");
			var self = this;
			P2PProvider.cleanup();

			// beheivor for update preview for not p2p camera
			var preview = function(pos, cameraID){
				if(!SkyVR.hasAccessCameraPreview(cameraID)) return false;
				SkyVR.cameraPreview(cameraID).done(function(response){
					// console.log("[SLIDER] preview 2");
					// console.log(response);
					// preview not work
					var status = self.structure[pos].status;
					if(status == 'active'){
						$("#capture_screen_" + cameraID).attr("src",response.url);
					}
					var lastTime1 = new Date(response.time).getTime();
					var lastTime2 = new Date().getTime();
					// console.log("lastTime1: " + lastTime1);
					// console.log("lastTime2: " + lastTime2);
					// check date and call upgrade preview if need
					if(lastTime2 - lastTime1 > 60000){ // more than 1 minute
						if(SkyVR.hasAccessCameraUpdatePreview(cameraID)){
							SkyVR.cameraUpdatePreview(cameraID);
						}else{
							console.warn("Do not have permission to access updating preview");
						}
					}
				}).fail(function(xhr, ajaxOptions, thrownError){
					console.error("[SLIDER] preview fail " + xhr.status);
					if(xhr.status=404){
						if(SkyVR.hasAccessCameraUpdatePreview(cameraID)){
							SkyVR.cameraUpdatePreview(cameraID);
						}
					}
				});
			};

			// beheivor for update preview for p2p camera
			var p2p_preview = function(pos, cameraID){
				SkyVR.cameraP2PSettings(cameraID).done(function(response){
					if(response.p2p_streaming && response.p2p_streaming == true){
						// self.structure[pos].image_file = "files/images/camimg_default.jpg"; // will be init later
						self.structure[pos].p2p = response;
						P2PProvider.findP2PHost(self.structure[pos].id).done(function(web_url,rtmp_url){
							console.log("[DEBUG] web_url " + web_url);
							var status = self.structure[pos].status;
							if(status == 'active'){
								var new_img = web_url + "capture/ch0.jpg?time=" + Date.now();
								$("#capture_screen_" + cameraID).attr("src",new_img);
							}
						});
					}else{
						try{preview(pos, cameraID)}catch(e){ console.error(e)};
					}
				});
			};
			
			function tryPreview(i0, camid){
				SkyVR.cameraInfo(camid).done(function(cam){
					if(cam['p2p_streaming'] && cam['p2p_streaming'] == true){
						try{p2p_preview(i0, camid)}catch(e){ console.error(e)};
					}else{
						try{preview(i0, camid)}catch(e){ console.error(e)};
					}
				});
			};
				
			for(var i = 0; i < self.structure.length; i++){
				var status = self.structure[i].status;
				if(status == "active"){
					tryPreview(i, self.structure[i].id);
				}else{
					var cameraID = self.structure[i].id;
					$("#capture_screen_" + cameraID)
						.removeClass('active')
						.removeClass('inactive')
						.removeClass('inactive_by_scheduler')
						.removeClass('offline')
						.removeClass('unauthorized')
						.addClass(status);
					// $("#capture_screen_" + cameraID).attr("src",camimgs[status]);
				}
			}
			// console.log("[SLIDER] update preview end");
		},
        buildStructure:function(data,app){
            var d = $.Deferred();
            if(!_.isArray(this.structuure)){
				// console.log("List of cameras:", data.objects);
                var count = data.objects.length;
                this.structure = data.objects;
                var self = this;
				d.resolve();
			}
            return d.promise();
        },
		render:function(app){
			console.log('[SLIDER] render');
			// SkyVR.printStack();
			
			var self = this;
			this.drawTrobber();
			this.createWrapper();
			this.initNewCamera(app);
			SkyVR.camerasList().done(function(data){
				
				if(cc.sort_cameralist){
					console.log('sort_cameralist');
					data.objects.sort(cc.sort_cameralist)
				}
				
				self.buildStructure(data,app).done(function(){
					self.loaded = 1;
					self.calcSizes(app);
					self.resizeHandler(self);
					self.drawSlides(app);
					self.bindEvents();
					self.updatePreview(app);
					self.initNewCamera(app);
                });
			});
        },
        drawTrobber: function(){
            var throbber = $('<div class="throbber-wrapper"><span class="spinner gray" style="margin: 0px auto; transition: transform 0ms;"></div></div>');
            this.container.html(throbber);
        },
        createWrapper : function () {
            var wrapper  = $('<div class="slider_wrapper" id="transition_disabled">' +
                            '<div class=slider">' +
                                '<div class="margin-l" style="width: 52px; float: left; height: 100px;"><span class="arrow left" style="display:none; width:30px; height:40px; float:right;margin-top: 100px; background-image: url('+'files/images/left_arrow.png'+');margin-right: 40px;cursor: pointer; background-repeat: no-repeat; background-position: center center;"></span></div>' +
                                '<div class="slides" style="overflow:hidden; float:left"><div class="slide-wrapper" style="position:relative;width:826%;transition: all 800ms;"></div></div>' +
                                '<div class="margin-r" style="width: 52px; float: left; height: 100px;"><span class="arrow right" style="display:none; width:30px; height:40px; float:left;margin-top: 100px;background-image: url('+'files/images/right_arrow.png'+');margin-left: 40px;cursor: pointer; background-repeat: no-repeat; background-position: center center;"></span></div>' +
                                '</div>' +
                '<div style="clear: both;"></div> <div class="pager"></div>' +
                            '</div>'
            );
            this.container.append(wrapper);
        },
        initNewCamera: function(app){
			if(cc.allow_add_cameras && cc.allow_add_cameras == true){
				$('.sidebar-container-controls').show();
			}else{
				$('.sidebar-container-controls').hide();
				return;
			}
			$('.sidebar-container-controls .new-camera').unbind('click').bind('click', function(e){
				window['currentPage'] = 'newCamera';
				app.createDialogModal({
					title: app.polyglot.t('dialog_title_create_camera'),
					content: '<div class="dialog_new_camera">'
					+ '<p>' + app.polyglot.t('new_camera_name') + '</p>'
					+ '<div class="description">' + app.polyglot.t('new_camera_name_description') + '</div>'
					+ '<input id="new-camera-name" type="text" value=""/>'
					+ '<p>' + app.polyglot.t('new_camera_live_stream_link') + '</p>'
					+ '<div class="description">' + app.polyglot.t('new_camera_live_stream_link_description') + '</div>'
					+ '<input id="new-camera-live-stream-link" type="text" placeholder="' + app.polyglot.t('new_camera_live_stream_url') + '" value=""/>'
					+ '<input id="new-camera-live-stream-link-login" placeholder="' + app.polyglot.t('new_camera_live_stream_login') + '" type="text" value=""/>'
					+ '<input id="new-camera-live-stream-link-password" placeholder="' + app.polyglot.t('new_camera_live_stream_password') + '" type="text" value=""/>'
					+ '<p>' + app.polyglot.t('new_camera_timezone') + '</p>'
					+ '<div class="description">' + app.polyglot.t('new_camera_timezone_description') + '</div>'
					+ '<select id="new-camera-timezone"/>'
					,
					buttons: [
						{id:'create_new_camera', text: app.polyglot.t('dialog_button_create_camera'), close: false},
						{text: app.polyglot.t('dialog_button_close'), close: true}
					],
					'beforeClose' : function() {
						window['currentPage'] = 'camlist';
					}
				});
				var timezones_options = "";
				var timezones = moment.tz.names();
				for(var t in timezones){
					timezones_options += '<option value=' + timezones[t] + '>(UTC' + moment.tz(timezones[t]).format("Z") + ') ' + timezones[t] + '</option>';
				}
				$('#new-camera-timezone').html(timezones_options);
				$('#create_new_camera').unbind().bind('click', function(e){
					var data = {};
					data.name = $('#new-camera-name').val();
					data.url = $('#new-camera-live-stream-link').val();
					data.login = $('#new-camera-live-stream-link-login').val();
					data.password = $('#new-camera-live-stream-link-password').val();
					data.timezone = $('#new-camera-timezone').val();
					
					if(data.url.length == 0){
						app.hideDialogModal();
						app.showError(
							app.polyglot.t('dialog_title_create_camera'),
							app.polyglot.t('new_camera_error_url_could_not_be_empty'),
							function(){ app.showDialogModal(); }
						)
						return;
					}

					if((data.timezone && data.timezone.length == 0) || !data.timezone){
						app.hideDialogModal();
						app.showError(
							app.polyglot.t('dialog_title_create_camera'),
							app.polyglot.t('new_camera_error_timezone_could_not_be_empty'),
							function(){ app.showDialogModal(); }
						)
						return;
					}

					app.hideDialogModal();
					app.showProcessing(app.polyglot.t('dialog_title_create_camera'), '');
					SkyVR.hostNewCamera(data).done(function(result){
						app.closeProcessing();
						app.destroyDialogModal();
						app.showInfo(app.polyglot.t('dialog_title_create_camera'), app.polyglot.t('dialog_content_create_camera_take_a_few_minutes'));
						// SkyUI.updateCamlist(slider);
					}).fail(function(){
						app.closeProcessing();
						app.showError(
							app.polyglot.t('dialog_title_create_camera'),
							app.polyglot.t('new_camera_error_url_could_not_create_camera'),
							function(){ app.showDialogModal(); }
						)
					});
				});
				app.showDialogModal();
				
			});
		},
        resizeHandler : function (app) {
			$('.slider_wrapper .slides .slide-wrapper').css({'max-height': $(document).height() - 47});
            if(!app.slides.length){
                return;
            }
            app.winWidth = $(document).width() / 1.5;
            if (app.winWidth < 344) {
                app.winWidth = 344;
            }
            if (app.winWidth > ((240 * 3) + 104)) {
                app.winWidth = ((240 * 3) + 104);
            }
            app.sliderWidth = 0;
            app.perPage = parseInt((app.winWidth - 104) / 240);
            switch (app.perPage) {
                case 1 :
                    app.sliderWidth = app.perPage * 240;
                    app.hideArrows =1;
                    break
                default :
                    app.hideArrows = 0;
                    app.sliderWidth = app.perPage * 240 + 104;
            }
            if(app.slides.length < 3 && app.perPage == 3) {
                app.hideArrows = 0;
                app.sliderWidth = (app.slides.length * 240 + 104);
            }
            app.container.find('.slides').width(app.hideArrows ? app.sliderWidth : app.sliderWidth - 104);
            app.container.width(app.sliderWidth);
            app.drawPager();
            app.fixView();
            return;


        },
        calcSizes : function(app){
            var self = this;
            _.each(this.structure, function(el){self.slides.push( self.Slide(el, app))});

        },
        bindEvents : function () {
            var self = this;
            self.drawArrows();
            this.container.remove('id');
            self.clickState = false;
            this.container.find('.slider_wrapper').remove('id');
            this.container.find('.left').click(function(){self.pageLeft()});
            this.container.find('.right').click(function(){self.pageRight()});
            this.container.find('.throbber-wrapper').css('display','none');
            this.container.find('.slide img').click(function(){
                if(!self.clickState) {
                    self.clickState = true;
                    var cid = $(this).closest('.slide').data('cid')
                    var cam = self.structure.filter(function (el) {
                        if (el.id == cid) {
                            return true
                        } else {
                            return false
                        }
                    });
                    SkyVR.setCameraID(cam[0].id);
                    console.log('selection camera ', SkyVR.cache.cameraInfo());
                    event.trigger(event.CAMERA_SELECTED, [SkyVR.cache.cameraInfo() || cam]);
                }
            });
        },
        drawSlides : function (app){
            var cnt = this.container.find('.slider_wrapper .slides .slide-wrapper');
            if(this.slides.length){
                _.each(this.slides, function(el){cnt.append(el.render())});
                this.setCameraPreviews();
                this.container.find('.slide-wrapper').css({
					'overflow-y': 'auto',
					'width': this.slides.length * 240,
					'max-height': $(document).height() - 47
				});
                this.fixView();
                this.drawPager();
            }else{
                this.container.css('width','220px').find('.slider_wrapper').html('').append($('<div class="empty-cameras">'
					+ '<div style="display: table-cell; vertical-align: middle;">'
					+ app.polyglot.t('no_cameras')
					+'</div>'
					+'</div>'));
            }
        },
        setCameraPreviews : function(){
            var self = this;
            this.container.find(".slide").each(function(){
                var slide = this;
                var camId = $(this).data('cid');
                var cam = self.structure.filter(function(el){if(el.id == camId){return true}else {return false}})[0];
            });
        },
        drawPager : function(){
            var self = this;
            var cntr = this.container.find('.pager');
            cntr.html('');
            if(parseInt(this.slides.length / this.perPage)){
				for(var i=0; i < (this.slides.length / this.perPage); i++){
					el = $('<i class="page-icon" ></i>');
					el.data('page', i);
					if (i == self.currentPosition) {
						el.addClass('active');
					}
					el.click(function(){ self.currentPosition = $(this).data('page');  self.page($(this).data('page'))});
					cntr.append(el);
				}
            }
        },
        fixView:function(){
            this.container.find('.slide-wrapper').width(this.sliderWidth);
            if(this.hideArrows || window.isFramed){
                this.container.find('.margin-l').hide();
                this.container.find('.margin-r').hide();
                this.container.find('.pager').css('display','none');
                this.container.find('.slide-wrapper').css('transform',this.calcTransform(this.currentPosition));
                this.container.find('.slide').css('float','none');
            }else{
                this.container.find('.slide-wrapper').width(this.slides.length * 240);
                this.container.find('.margin-l').show();
                this.container.find('.margin-r').show();
                this.container.find('.pager').css('display','');
                this.currentPosition = 0;
                this.container.find('.slide-wrapper').css('transform',this.calcTransform(this.currentPosition));
                this.container.find('.slide').css('float','left');
            }
        },
        changeActivePage: function(){
            var self = this;
            var arr = this.container.find('.pager i');
            arr.removeClass('active');
            arr.each(function(el,i)     {
                if(el == self.currentPosition){
                    $(i).addClass('active')
                }
            });
            this.drawArrows();
        },
        drawArrows:function(){
            this.container.find('.arrow').css('display', 'none');
          if(this.currentPosition != 0){
              this.container.find('.left').css('display', 'block');
          }if(this.container.find('.pager i').length && this.currentPosition != this.container.find('.pager i').last().data('page')){
              this.container.find('.right').css('display', 'block');
          }
        },
        pageLeft:function(){
            this.currentPosition  != 0 ? this.currentPosition -= 1 : this.currentPosition = parseInt(this.slides.length / this.perPage);
            this.page(this.currentPosition);
        },
        pageRight:function(){
            this.currentPosition != parseInt((this.slides.length -1) / this.perPage) ? this.currentPosition += 1: this.currentPosition = 0 ;
            this.page(this.currentPosition);

        },
        page:function(pos){
            this.container.find('.slide-wrapper').css('transform',this.calcTransform(pos));
            this.changeActivePage(this.currentPosition);
        },
        calcTransform : function(page){
            return "translateX(-" + ((this.perPage * 240 *  page) )+ "px)";
        }
    },Backbone.Events);
    return obj;
})
