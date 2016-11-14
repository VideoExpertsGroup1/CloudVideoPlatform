define(['config', 'backbone','underscore', 'application', 'raphael', 'is', '../views/md_zones_view', 'event'], function(conf, bb,_,app, Raphael, is, mdzv, event){
	var application = {
		//PositionToMDPosition: function(x, y, columns, rows, width, height){
		PositionToMDPosition: function(x, y, columns, rows, width, height){
			xGrid = columns;
			yGrid = rows;
			xStep = width/xGrid;
			yStep = height/yGrid;
			xGridPosition = x/xStep;
			yGridPosition = y/yStep;
			return {x: Math.round(xGridPosition),y: Math.round(yGridPosition),xPosition:Math.round(xGridPosition)*xStep,yPosition:Math.round(yGridPosition)*yStep}
		}
	};
	
	_.extend(application, bb.Events);
//	application.on('showEditMDZones', function (e){
	application.addSquareMDZone = function(md_zones){
		this.columns = md_zones.motion_detection.caps.columns;
		this.rows = md_zones.motion_detection.caps.rows;
		columns = this.columns;
		rows = this.rows;
		
		var self = this;
			
		event.trigger(event.GET_CAMERA,function(cam){
			self.camera = cam;
		});
		
		matrix =  [];
		for(var a=0;a<md_zones.motion_detection.regions.length;a++){
			submatrix = []
			for(var i=0;i<this.rows;i++){
				var subarray = []
				for(var j=0;j<this.columns;j++){
					subarray[j] = 0;
				}
				submatrix[i] = subarray;
			}
			matrix[a] = submatrix;
		}
		//zeroMatrix = matrix;
		addRectToMatrix = function(MDx,MDy,MDWidth,MDHeight){
			//matrix = zeroMatrix;
			for(var i=0;i<this.rows;i++){
				var subarray = []
				for(var j=0;j<this.columns;j++){
					subarray[j] = 0;
				}
				matrix[i] = subarray;
			}
			for(var i=MDx;i<=MDx+MDWidth-1;i++){
				for(var j=MDy;j<=MDy+MDHeight-1;j++){
					matrix[j][i] = 1;
				}
			}
		};
		var rectDragger = function(dx, dy, x, y){
			this.dMousePos = this.PositionToMDPosition(this.MouseStartPos.x - x,this.MouseStartPos.y - y,this.columns);
			var nowPosition = this.PositionToMDPosition(this.shapeStartPos.x - this.dMousePos.xPosition, this.shapeStartPos.y - this.dMousePos.yPosition);
			var newPosition = {};
			if (nowPosition.x >= 0){
				if (nowPosition.x <= this.columns - this.getWidthMD()){
					newPosition.x = this.PositionToMDPositionX(this.shapeStartPos.x - this.dMousePos.xPosition);
				}else{
					newPosition.x = this.columns - this.getWidthMD();
				}
			}else{
				newPosition.x = 0;
			}
			
			if (nowPosition.y >= 0){
				if (nowPosition.y <= this.rows - this.getHeightMD()){
					newPosition.y = this.PositionToMDPositionY(this.shapeStartPos.y - this.dMousePos.yPosition);
				}else{
					newPosition.y = this.rows - this.getHeightMD();
				}
			}else{
				newPosition.y = 0;
			}
			//console.log(newPosition);
			this.setMDx(newPosition.x);
			this.setMDy(newPosition.y);
			this.MDx = newPosition.x;
			this.MDy = newPosition.y;
			this.circles[0].attr({cx: this.attrs.x, cy: this.attrs.y});
			this.circles[0].MDx = this.PositionToMDPositionX(this.attrs.x);
			this.circles[0].MDy = this.PositionToMDPositionY(this.attrs.y);
			this.circles[1].attr({cx: this.attrs.x + this.attrs.width, cy: this.attrs.y});
			this.circles[1].MDx = this.PositionToMDPositionX(this.attrs.x + this.attrs.width);
			this.circles[1].MDy = this.PositionToMDPositionY(this.attrs.y);
			this.circles[2].attr({cx: this.attrs.x + this.attrs.width, cy: this.attrs.y + this.attrs.height});
			this.circles[2].MDx = this.PositionToMDPositionX(this.attrs.x + this.attrs.width);
			this.circles[2].MDy = this.PositionToMDPositionY(this.attrs.y + this.attrs.height);
			this.circles[3].attr({cx: this.attrs.x, cy: this.attrs.y + this.attrs.height});
			this.circles[3].MDx = this.PositionToMDPositionX(this.attrs.x);
			this.circles[3].MDy = this.PositionToMDPositionY(this.attrs.y + this.attrs.height);
			//addRectToMatrix(this.PositionToMDPositionX(this.attrs.x),this.PositionToMDPositionY(this.attrs.y),this.PositionToMDPositionX(this.attrs.width),this.PositionToMDPositionY(this.attrs.height));
		}
		var circlesDragger = function(dx, dy, x, y){
			this.dMousePos = this.PositionToMDPosition(this.MouseStartPos.x - x,this.MouseStartPos.y - y);
			
			var nowPosition = this.PositionToMDPosition(this.shapeStartPos.x - this.dMousePos.xPosition, this.shapeStartPos.y - this.dMousePos.yPosition);
			var newPosition = {};
			if (nowPosition.x >= 0){
				if (nowPosition.x <= this.columns){
					newPosition.x = this.PositionToMDPositionX(this.shapeStartPos.x - this.dMousePos.xPosition);
				}else{
					newPosition.x = this.columns;
				}
			}else{
				newPosition.x = 0;
			}
			
			if (nowPosition.y >= 0){
				if (nowPosition.y <= this.rows){
					newPosition.y = this.PositionToMDPositionY(this.shapeStartPos.y - this.dMousePos.yPosition);
				}else{
					newPosition.y = this.rows;
				}
			}else{
				newPosition.y = 0;
			}
			
			if((newPosition.x - this.y_circle.getMDx()) * this.scale_multiplier.x > 1){
				dDMx = this.mainRect.PositionToMDPositionX(this.shapeStartPos.x)-newPosition.x;
				this.setMDx(newPosition.x);
				this.MDx = newPosition.x;
				this.x_circle.setMDx(newPosition.x);
				this.x_circle.MDx = newPosition.x;
				//this.setMDx(newPosition.x);
				//this.x_circle.setMDx(newPosition.x);
				var dScale = this.mainRect.MDPositionToPosition(dDMx, 0);
				var correctorRectPositionX = this.scale_multiplier.x == -1 ? -dScale.x : 0 ;
				this.mainRect.attr({width: this.mainRect.startScale.width - dScale.x*this.scale_multiplier.x});
				this.mainRect.MDWidth = this.mainRect.PositionToMDPositionX(this.mainRect.startScale.width - dScale.x*this.scale_multiplier.x);
				this.mainRect.attr({x: this.mainRect.startPosition.x + correctorRectPositionX});
				this.mainRect.MDx = this.mainRect.PositionToMDPositionX(this.mainRect.startPosition.x + correctorRectPositionX);
			}
			
			if((newPosition.y - this.x_circle.getMDy())* this.scale_multiplier.y > 1){
				dDMy = this.mainRect.PositionToMDPositionY(this.shapeStartPos.y)-newPosition.y;
				this.setMDy(newPosition.y);
				this.MDy = newPosition.y;
				this.y_circle.setMDy(newPosition.y);
				this.y_circle.MDy = newPosition.y;
				//this.setMDy(newPosition.y);
				//this.y_circle.setMDy(newPosition.y);
				var dScale = this.mainRect.MDPositionToPosition(0, dDMy);
				var correctorRectPositionY = this.scale_multiplier.y == -1 ? -dScale.y : 0;
				this.mainRect.attr({height: this.mainRect.startScale.height - dScale.y*this.scale_multiplier.y});
				this.mainRect.MDHeight = this.mainRect.PositionToMDPositionY(this.mainRect.startScale.height - dScale.y*this.scale_multiplier.y);
				this.mainRect.attr({y: this.mainRect.startPosition.y + correctorRectPositionY});
				this.mainRect.MDy = this.mainRect.PositionToMDPositionY(this.mainRect.startPosition.y + correctorRectPositionY);
			}
			
			//addRectToMatrix(this.mainRect.PositionToMDPositionX(this.mainRect.attrs.x),this.mainRect.PositionToMDPositionY(this.mainRect.attrs.y),this.mainRect.PositionToMDPositionX(this.mainRect.attrs.width),this.mainRect.PositionToMDPositionY(this.mainRect.attrs.height));
		};
		var startDrag = function(x, y){
			//console.log("start drag");
			//console.log(x, y);
			zone.edited = true;
			this.MouseStartPos = {x: x, y: y};
			if(this.type == "rect")
				this.shapeStartPos = {x: this.attrs.x, y: this.attrs.y};
			else
				this.shapeStartPos = {x: this.attrs.cx, y: this.attrs.cy};
				if(this.type == "circle"){
					this.mainRect.startScale = {width: this.mainRect.attrs.width, height: this.mainRect.attrs.height};
					this.mainRect.startPosition = {x: this.mainRect.attrs.x, y: this.mainRect.attrs.y};
				}
		};
		
		//console.log("on showEditMDZones");
		zone = mdzv.addSquareZone(md_zones);
		zone.edited = false;
		_.extend(zone,matrix);
		//zone.matrix = matrix;
		var addDrag = function(md_zones, layoutCount){
			//for(var i=0; i<md_zones.motion_detection.caps.max_regions;i++){
				this.rectsGroups[layoutCount][0].columns = md_zones.motion_detection.caps.columns;
				this.rectsGroups[layoutCount][0].rows = md_zones.motion_detection.caps.rows;
				this.rectsGroups[layoutCount][0].drag(rectDragger,
					startDrag,
					function(){
					}
				);
				if(conf.md_zones.global_conf.enable_zones_by_checkbox){
					if(!md_zones.motion_detection.regions[layoutCount].enabled){
					//md_zones.motion_detection.regions[paper.activeLayer].enabled = true;
						for (var j = 1; j < 5; j++) {
						   this.rectsGroups[layoutCount][j].undrag();
						   this.rectsGroups[layoutCount][j].hide();
						}
					}else{
						for (var j = 1; j < 5; j++) {
						   this.rectsGroups[layoutCount][j].drag(circlesDragger, startDrag);
						   this.rectsGroups[layoutCount][j].show();
						}
					}
				}else{
					for (var j = 1; j < 5; j++) {
					   this.rectsGroups[layoutCount][j].drag(circlesDragger, startDrag);
					   this.rectsGroups[layoutCount][j].show();
					}
				}
				$('.layer-button').removeClass('active');
				$('.layer-button').removeAttr('style');
				$('.layer-button-'+ layoutCount.toString()).addClass('active');
				$('.layer-button-'+ layoutCount.toString()).css('background-color', $('.layer-button-'+ layoutCount.toString()).attr('active_color'));
				this.rectsGroups[layoutCount].toFront();
				this.activeLayer = layoutCount;
				//addRectToMatrix(this.rectsGroups[layoutCount][0].PositionToMDPositionX(this.rectsGroups[layoutCount][0].attrs.x),this.rectsGroups[layoutCount][0].PositionToMDPositionY(this.rectsGroups[layoutCount][0].attrs.y),this.rectsGroups[layoutCount][0].PositionToMDPositionX(this.rectsGroups[layoutCount][0].attrs.width),this.rectsGroups[layoutCount][0].PositionToMDPositionY(this.rectsGroups[layoutCount][0].attrs.height));
			//}
		}
		var clearDrag = function(md_zones){
			for(var i=0; i<md_zones.motion_detection.regions.length;i++){
				this.rectsGroups[i][0].undrag();
				for (var j = 1; j < 5; j++) {
				   this.rectsGroups[i][j].undrag();
				   this.rectsGroups[i][j].hide();
				}
			}
		}
		_.extend(zone, {addDrag: addDrag, clearDrag: clearDrag});
		//mdzv.showGrid(columns, rows);
		resizeWindow = function(){
			if($('.player-container').width() != $(".player-control-container svg").width()){
				zone.redrawRect();
			}
			mdzv.centringLayoutButtons();
			var leftLimit = $('.DM-panel.DM-panel-rect #remove-md').position().left + $('.DM-panel.DM-panel-rect #remove-md').width();
			var rightLimit = $('.DM-panel.DM-panel-rect #cancel-md').position().left + $('.DM-panel.DM-panel-rect #cancel-md').width();

			var maxWidth = $(window).width() - rightLimit - leftLimit  - 90;
			var layersPanel = $('.DM-panel.DM-panel-rect .layers');
			if(layersPanel.width() >= parseInt(layersPanel.css('max-width')) - 180){
				if(!$('.DM-panel.DM-panel-rect').hasClass('vertical') && layersPanel.height() > 80){
					$('.DM-panel.DM-panel-rect').addClass('vertical');
				}
				layersPanel.css('max-width', maxWidth.toString() + 'px');
			}else{
				layersPanel.css('max-width', maxWidth.toString() + 'px');
				if($('.DM-panel.DM-panel-rect').hasClass('vertical') && layersPanel.height() < 80){
					$('.DM-panel.DM-panel-rect').removeClass('vertical');
				}
			}
			//layersPanel.css('max-width', maxWidth.toString() + 'px');
			
		};
		$(window).resize(resizeWindow);
		$('.DM-panel-rect #cancel-md').unbind().on('click', function(){
			
			function disposeMdViewer(){
				$(".player-control-container svg").unbind();
				$('.DM-panel-rect #cancel-md').unbind();
				$('.DM-panel-rect #save-md').unbind();
				$('.DM-panel-rect #add-md').unbind();
				$('.DM-panel-rect #remove-md').unbind();
				$(window).unbind();
				mdzv.hideMDPanelSquare();
				//mdzv.hideGrid();
				mdzv.deletePaper();
				mdzv.hide();
				event.stopListening(event, event.MDZONES_CHECK_VIDEOSIZE);
			}
			
			if(zone.edited){
				
				app.createDialogModal({
					'title' : app.polyglot.t('dialog_title_md_zones'),
					'content' : app.polyglot.t('dialog_content_md_zones_changed_confirm_exit'),
					'buttons' : [
						{text: app.polyglot.t('dialog_md_zones_changed_exit_yes'), id: 'md_zones_changed_exit', close: false},
						{text: app.polyglot.t('dialog_md_zones_changed_exit_no'), close: true}
					],
					'beforeClose' : function() {
					}
				});
				app.showDialogModal();
				
				$('#md_zones_changed_exit').unbind().bind('click', function(){
					disposeMdViewer();
					app.destroyDialogModal();
				});
			}else{
				disposeMdViewer();
			}
			
		});
		$('.DM-panel-rect .zone-enabled-checkbox').unbind().click(function(){
			zones_visible = JSON.parse(localStorage.getItem("md_zones_visible_" + self.camera['id']));
			if($(this).prop('checked')){
				paper.rectsGroups[parseInt($(this).attr('layer-number'))].show();
				paper.rectsGroups[parseInt($(this).attr('layer-number'))].attr('opacity', '1');
				zones_visible[parseInt($(this).attr('layer-number'))] = true;
				if(conf.md_zones.global_conf.enable_zones_by_checkbox){
					md_zones.motion_detection.regions[paper.activeLayer].enabled = true;
					zone.edited = true;
					paper.rectsGroups[parseInt($(this).attr('layer-number'))][0].click(paper.rectClickFunction);
				}
			}else{
				paper.rectsGroups[parseInt($(this).attr('layer-number'))].hide();
				zones_visible[parseInt($(this).attr('layer-number'))] = false;
				if(conf.md_zones.global_conf.enable_zones_by_checkbox){
					md_zones.motion_detection.regions[paper.activeLayer].enabled = false;
					paper.clearDrag(md_zones);
					paper.rectsGroups[parseInt($(this).attr('layer-number'))][0].unclick();
					zone.edited = true;
				}
			}
			localStorage.setItem("md_zones_visible_" + self.camera['id'], JSON.stringify(zones_visible));
		});
		/*$('#save-md-rect').click(function(){
			encodedByteString = '';
			bitarray = [];
			bytearray = [];
			//bitarray = bitarray.concat(matrix);
			for(var i=0;i<matrix.length;i++){
				bitarray = bitarray.concat(matrix[i]);
			}
			if(bitarray.length % 8 > 0){
				taleZeros = 8 - bitarray.length % 8;
				for(var i=0;i<taleZeros;i++){
					bitarray.push(0);
				}
			}
			for(var i=0;i<bitarray.length;i+=8){
				var currentDoubleBytestr = '';
				for(var j=0;j<8;j++)
					currentDoubleBytestr += bitarray[i+j].toString();
				bytearray.push(parseInt(currentDoubleBytestr, 2));
				
			}
			encodedByteArray =  application.packbitsEncode(bytearray);
			encodedByteString = encodedByteArray.join('');
			console.log('encodedByteString - ' + encodedByteString);
			console.log('BASE64 - ' + window.btoa(encodedByteString));
			
		});*/
		this.matrix = matrix; 
		$('.DM-panel-rect #save-md').unbind().click(function(){
			if(SkyUI.isDemo()){SkyUI.showDialogDemo();return;}
			//paper.rectsGroups
			//for(var i=0; i< matrix.length;i++){
			for(var i=0; i< paper.rectsGroups.length;i++){
				var el  = paper.rectsGroups[i][0]
				if(el.MDHeight>0 && el.MDWidth > 0){
					if(matrix.length< i+1){
						submatrix = []
						for(var a=0;a<rows;a++){
							var subarray = []
							for(var j=0;j<columns;j++){
								subarray[j] = 0;
							}
							submatrix[a] = subarray;
						}
						matrix.push(submatrix);
					}
					for(var a=0;a<rows;a++){
						
						for(var b=0;b<columns; b++){
							matrix[i][a][b] = 0;
							if(paper.rectsGroups[i].length > 0){
								
								if(( a >= el.MDy && a < el.MDy + el.MDHeight && b >= el.MDx && b < el.MDx + el.MDWidth) && (el.MDHeight>0 && el.MDWidth > 0)){
									matrix[i][a][b] = 1;
								} 
							}
						}
					}
					//matrix[i] = 
				}else{
					matrix[i] = 0;
				}
			}
			$.proxy(saveMD,{matrix:matrix})();
		});
		$('.layer-button').click(function(){
			//console.log(paper.rectsGroups[paper.activeLayer]);
			paper.clearDrag(md_zones);
			paper.addDrag(md_zones, parseInt($(this).attr('layer-number')));
		});
		$('#remove-all-md').click(function(){
			for(var i=0;i<md_zones.motion_detection.regions.length;i++){
				md_zones.motion_detection.regions[i].enabled = false;
				paper.rectsGroups[i].hide();
				$('button.layer-button').addClass('hide');
				
			}
			mdzv.centringLayoutButtons();
		});
		$('#remove-md').click(function(){
			if (confirm(app.polyglot.t('Remove Zone') + ' ' + (paper.activeLayer+1) + '?')){
				zone.edited = false;
				md_zones.motion_detection.regions[paper.activeLayer].enabled = false;
				md_zones.motion_detection.regions[paper.activeLayer].map = '';
				paper.rectsGroups[paper.activeLayer][0].MDHeight = 0;
				paper.rectsGroups[paper.activeLayer][0].MDWidth = 0;
				$('.layer-button-'+ paper.activeLayer.toString()).parent().addClass('hide');
				paper.rectsGroups[paper.activeLayer].hide();
				mdzv.centringLayoutButtons();
				for(var i=0;i<md_zones.motion_detection.regions.length;i++){
					if(md_zones.motion_detection.regions[i].map != ""){
						paper.clearDrag(md_zones);
						paper.addDrag(md_zones, i);
						paper.activeLayer = i;
						break;
					}
				}
			}
		});
		$('#add-md').unbind().click(function(){
			added = false;
			width = Math.floor(md_zones.motion_detection.caps.columns * 0.4);
			height = Math.floor(md_zones.motion_detection.caps.rows * 0.4);
			xPos = Math.round(md_zones.motion_detection.caps.columns/2) - Math.round(width/2);
			yPos = Math.round(md_zones.motion_detection.caps.rows/2) - Math.round(height/2);
			for(var i=0;i<md_zones.motion_detection.regions.length;i++){
				if(md_zones.motion_detection.regions[i].map == ''){
					md_zones.motion_detection.regions[i].enabled = true;
					zone.edited = true;
					paper.rectsGroups[i][0].setMDy(yPos);
					paper.rectsGroups[i][0].setMDx(xPos);
					paper.rectsGroups[i][1].setMDy(yPos);
					paper.rectsGroups[i][1].setMDx(xPos);
					var rectSize = paper.MDPositionToPosition(width, height);
					paper.rectsGroups[i][0].attr({width:rectSize.x, height: rectSize.y});
					paper.rectsGroups[i][0].MDWidth = width;
					paper.rectsGroups[i][0].MDHeight = height;
					
					paper.rectsGroups[i][2].setMDy(yPos);
					paper.rectsGroups[i][2].setMDx(xPos + width);
					
					paper.rectsGroups[i][3].setMDy(yPos + height);
					paper.rectsGroups[i][3].setMDx(xPos + width);
					
					paper.rectsGroups[i][4].setMDy(yPos + height);
					paper.rectsGroups[i][4].setMDx(xPos);
					
					paper.rectsGroups[i][0].show();
					$('.layer-button-'+ i.toString()).parent().removeClass('hide');
					added = true;
					
					var newMatrix = [];
					for(var a=0;a< md_zones.motion_detection.caps.rows;a++){
						newMatrix.push([]);
						for(var j=0;j< md_zones.motion_detection.caps.columns;j++){
							if(a> yPos && a< yPos + width && j> xPos && j< xPos +height){
								newMatrix[a][j] = 1;
							}else{
								newMatrix[a][j] = 0;
							}
						}
					}
					md_zones.motion_detection.regions[i].map = saveMDLayout(newMatrix);
					if(!$("#md-checkbox-" + i).prop('checked')){
						$("#md-checkbox-" + i).prop('checked', true);
					};
					paper.clearDrag(md_zones);
					paper.addDrag(md_zones, i);
					paper.activeLayer = i;
					paper.rectsGroups[i].attr('opacity', '1');
					break;
				}
			}
			if(!added){
				if(md_zones.motion_detection.regions.length < md_zones.motion_detection.caps.max_regions){
					var newMatrix = [];
					zone.edited = true;
					for(var i=0;i< md_zones.motion_detection.caps.rows;i++){
						newMatrix.push([]);
						for(var j=0;j< md_zones.motion_detection.caps.columns;j++){
							if(a> yPos && a< yPos + width && j> xPos && j< xPos +height){
								newMatrix[i][j] = 1;
							}else{
								newMatrix[i][j] = 0;
							}
						}
					}
					//map = "MDBjMGZlMDA=";
					map = saveMDLayout(newMatrix);
					i = md_zones.motion_detection.regions.length;
					
					md_zones.motion_detection.regions.push({
						enabled: true,
						map: map,
						sensitivity: 100
					});
					application.drawOldMDZonesRect(map, i, md_zones, paper);
					var layer_buttons = _.template($('#templates #layers-buttons').html());
					layouts = [{layoutNumber: i, 
							layoutColor: conf.md_zones.global_conf.zone_colors[i],
							enabled: true}]
					$('.DM-panel-rect .layers').append(layer_buttons({layouts: layouts}));
					//if(paper.rectsGroups[i].length > 0){
						paper.rectsGroups[i][0].layoutNumber = i;
						paper.rectsGroups[i][0].click(function(){
							
							//this.unclick();
							/*$('button.layer-button').removeClass('active');
							$('button.layer-button').removeAttr('style');
							$('button.layer-button-'+ this.layoutNumber.toString()).addClass('active');
							$('button.layer-button-'+ this.layoutNumber.toString()).css('background-color', $('button.layer-button-'+ this.layoutNumber.toString()).attr('active_color'));*/
							paper.clearDrag(md_zones);
							paper.addDrag(md_zones, this.layoutNumber);
							//paper.rectsGroups[this.layoutNumber].toFront();
							paper.activeLayer = this.layoutNumber;
						});
						$('.layer-button-' + i.toString()).click(function(){
							//console.log(paper.rectsGroups[paper.activeLayer]);
							paper.clearDrag(md_zones);
							paper.addDrag(md_zones, parseInt($(this).attr('layer-number')));
							/*$('button.layer-button').removeClass('active');
							$('button.layer-button').removeAttr('style');
							$('button.layer-button-'+ $(this).attr('layer-number')).addClass('active');
							$('button.layer-button-'+ $(this).attr('layer-number')).css('background-color', $('button.layer-button-'+ $(this).attr('layer-number')).attr('active_color'));*/
							paper.activeLayer = parseInt($(this).attr('layer-number'));
							
						});
					//}
					paper.clearDrag(md_zones);
					paper.addDrag(md_zones, i);
					paper.activeLayer = i;
					submatrix = []
					for(var i=0;i<rows;i++){
						var subarray = []
						for(var j=0;j<columns;j++){
							subarray[j] = 0;
						}
						submatrix[i] = subarray;
					}
					matrix.push(submatrix);
					zones_visible = JSON.parse(localStorage.getItem("md_zones_visible_" + self.camera['id']));
					zones_visible.push(true);
					localStorage.setItem("md_zones_visible_" + self.camera['id'], JSON.stringify(zones_visible));
				}else{
					app.createDialogModal({
						'title' : app.polyglot.t('dialog_title_md_zones'),
						'content' : app.polyglot.t('md_zones_max_number_is') + md_zones.motion_detection.caps.max_regions,
						'buttons' : [
							{text: app.polyglot.t('Ok'), close: true}
						],
					});
					app.showDialogModal();
				}
			}
			mdzv.centringLayoutButtons();
		});
		
		return zone;
    };
	
	application.addMDZone = function(md_zones){
		this.columns = md_zones.motion_detection.caps.columns;
		this.rows = md_zones.motion_detection.caps.rows;
		columns = this.columns;
		rows = this.rows;
		layers_matrix = [];
		matrix =  [];
		for(var a=0;a<md_zones.motion_detection.caps.max_regions;a++){
			submatrix = []
			for(var i=0;i<this.rows;i++){
				var subarray = []
				for(var j=0;j<this.columns;j++){
					subarray[j] = 0;
				}
				submatrix[i] = subarray;
			}
			matrix[a] = submatrix;
		}
		
		$('.DM-panel-grid #plus-button').addClass("active");
		$('.DM-panel-grid #minus-button').removeClass("active");
		
		$('.DM-panel-grid button').click(function(){
			if($(this).attr('id') == "plus-button"){
				$(this).addClass("active");
				$('.DM-panel-grid #minus-button').removeClass("active");
			}else if($(this).attr('id') == "minus-button"){
				$(this).addClass("active");
				$('.DM-panel-grid #plus-button').removeClass("active");
			};
		});
		mdzv.showGrid(this.columns, this.rows);
		
		zone = mdzv.addZone(this.columns, this.rows, md_zones.motion_detection.caps.max_regions);
		_.extend(zone,{matrix: matrix});
		xStep = zone.width/this.columns;
		yStep = zone.height/this.rows;
		//zone.createGrid();
		selectCell = function(e){
			e.preventDefault();
			//console.log('add cell function');
			var parentOffset = $(this).parent().offset(); 
			var clickPosition = e.pageX ? e  : e.originalEvent.touches[0];
			var relX = clickPosition.pageX - parentOffset.left;
			var relY = clickPosition.pageY - parentOffset.top;
			//console.log(e);
			relCell = {x: Math.ceil(relX/xStep), y: Math.ceil(relY/yStep)}
			
			if(matrix[zone.activeLayer][relCell.y-1][relCell.x-1] == 0 && $('.DM-panel-grid .zone-enabled-checkbox-'+zone.activeLayer).prop('checked')){
				matrix[zone.activeLayer][relCell.y-1][relCell.x-1] = 1;
				zone.addCell(relCell.x, relCell.y, zone.activeLayer);
			}/*else if(matrix[zone.activeLayer][relCell.y-1][relCell.x-1] == 1 && $('.DM-panel-grid .zone-enabled-checkbox-'+zone.activeLayer).prop('checked')){
				zone.removeCell(relCell.x, relCell.y, zone.activeLayer);
				matrix[zone.activeLayer][relCell.y-1][relCell.x-1] = 0;
			}*/
			/*if ($('.DM-panel-grid .zone-edit .active').attr('id') == 'plus-button'){
				if(matrix[zone.activeLayer][relCell.y-1][relCell.x-1] == 0 && $('.DM-panel-grid .zone-enabled-checkbox-'+zone.activeLayer).prop('checked')){
					matrix[zone.activeLayer][relCell.y-1][relCell.x-1] = 1;
					zone.addCell(relCell.x, relCell.y, zone.activeLayer);
				}
			}else if ($('.DM-panel-grid .zone-edit .active').attr('id') == 'minus-button'){
				if(matrix[zone.activeLayer][relCell.y-1][relCell.x-1] == 1 && $('.DM-panel-grid .zone-enabled-checkbox-'+zone.activeLayer).prop('checked')){
					zone.removeCell(relCell.x, relCell.y, zone.activeLayer);
					matrix[zone.activeLayer][relCell.y-1][relCell.x-1] = 0;
				}
			}*/	
		}
		
		
		if(is.touchDevice()){
			$(".player-control-container svg").bind("touchstart", selectCell);
			$(".player-control-container svg").bind("touchstart",function(e){
				//selectCell(e);
				//console.log('mouse down 2');
				$(".player-control-container svg").bind("touchmove",selectCell);
			});
			$(".player-control-container svg").bind("touchend",function(e){
				//console.log('mouse up');
				$(".player-control-container svg").unbind('touchmove');
			});
		}else{
			$(".player-control-container svg").mousedown(selectCell);
			$(".player-control-container svg").mousedown(function(e){
				//selectCell(e);
				//console.log('mouse down 2');
				$(".player-control-container svg").mousemove(selectCell);
			});
			$(".player-control-container svg").bind("mouseleave",function(){
				
				$(".player-control-container svg").unbind('mousemove');
			});
			$(".player-control-container svg").mouseup(function(e){
				//console.log('mouse up');
				$(".player-control-container svg").unbind('mousemove');
			});
		}
		resizeWindow = function(){
			if($('.player-container').width() != $(".player-control-container svg").width()){
				mdzv.showGrid(columns, rows);
				//zone.redrawRect();
				zone.redrawRect();
			}
		};
		$(window).resize(resizeWindow);
		$('.DM-panel-grid #cancel-md').click(function(){
			$(".player-control-container svg").unbind();
			$('.DM-panel-grid #cancel-md').unbind();
			$('.DM-panel-grid #save-md').unbind();
			$(window).unbind();
			mdzv.hideMDPanelGrid();
			mdzv.hideGrid();
			mdzv.deletePaper();
			mdzv.hide();
		});
		$('.DM-panel-grid .zone-enabled-checkbox').click(function(){
			if($(this).prop('checked')){
				paper.rectsGroups[parseInt($(this).attr('layer-number'))].attr('opacity', '1');
			}else{
				paper.rectsGroups[parseInt($(this).attr('layer-number'))].attr('opacity', '0');
			}
		});
		/*$('#save-md').click(function(){
			encodedByteString = '';
			bitarray = [];
			bytearray = [];
			//bitarray = bitarray.concat(matrix);
			for(var i=0;i<matrix.length;i++){
				bitarray = bitarray.concat(matrix[i]);
			}
			console.log(matrix);
			if(bitarray.length % 8 > 0){
				taleZeros = 8 - bitarray.length % 8;
				for(var i=0;i<taleZeros;i++){
					bitarray.push(0);
				}
			}
			for(var i=0;i<bitarray.length;i+=8){
				var currentDoubleBytestr = '';
				for(var j=0;j<8;j++)
					currentDoubleBytestr += bitarray[i+j].toString();
				bytearray.push(parseInt(currentDoubleBytestr, 2));
				
			}
			encodedByteArray =  application.packbitsEncode(bytearray);
			encodedByteString = encodedByteArray.join('');
			console.log('encodedByteString - ' + encodedByteString);
			console.log('BASE64 - ' + window.btoa(encodedByteString));
			
		});*/
		this.matrix = matrix;
		$('.DM-panel-grid #save-md').click($.proxy(saveMD,{matrix:matrix, md_zones:md_zones}));
		//$(".player-control-container svg").mousedown(selectCell);
		return zone;
	};
	saveMD = function(){
		console.log('output matrix');
		console.log(matrix);
		regions = [];
		for(var i=0;i<md_zones.motion_detection.regions.length; i++)
		{
			//enabled = $('.zone-enabled-checkbox-'+i).prop('checked');
			//enabled = true;
			//regions.push({enabled: md_zones.motion_detection.regions[i].enabled, map: saveMDLayout(matrix[i]), sensitivity: 100});
			if(md_zones.motion_detection.regions[i]){
				if(matrix[i] == 0)
					md_zones.motion_detection.regions[i].map = '';
				else
					md_zones.motion_detection.regions[i].map = saveMDLayout(matrix[i]);
				md_zones.motion_detection.regions[i].name = 'motion' + (i+1);
			}
			if(!conf.md_zones.global_conf.enable_zones_by_checkbox){
				md_zones.motion_detection.regions[i].enabled = true;
			}
		}
		//console.log(regions);
		var self = this;
			
		event.trigger(event.GET_CAMERA,function(cam){
			self.camera = cam;
		});
		console.log({ objects: md_zones.motion_detection.regions});
		
		$.ajax({
				url : conf.base_api_url + "api/v2/cameras/" + self.camera['id'] + "/motion_detection/regions/",
				type : 'PUT',
				async: false,
				contentType: "application/json",
				data:  JSON.stringify({ objects: md_zones.motion_detection.regions}),
				success : function(data){
					
				}});
		
		$(".player-control-container svg").unbind();
		$('.DM-panel-grid #cancel-md').unbind();
		$('.DM-panel-grid #save-md').unbind();
		$('.DM-panel-rect #add-md').unbind();
		$('.DM-panel-rect #remove-md').unbind();
		$(window).unbind();
		mdzv.hideMDPanelGrid();
		mdzv.hideMDPanelSquare();
		mdzv.hideGrid();
		mdzv.deletePaper();
		mdzv.hide();
	};
	saveMDLayout = function(matrix){
			
			//matrix = this.matrix;
			encodedByteString = '';
			bitarray = [];
			bytearray = [];
			//bitarray = bitarray.concat(matrix);
			for(var i=0;i<matrix.length;i++){
				bitarray = bitarray.concat(matrix[i]);
			}
			if(bitarray.length % 8 > 0){
				taleZeros = 8 - bitarray.length % 8;
				for(var i=0;i<taleZeros;i++){
					bitarray.push(0);
				}
			}
			for(var i=0;i<bitarray.length;i+=8){
				var currentDoubleBytestr = '';
				for(var j=0;j<8;j++){
					currentDoubleBytestr += bitarray[i+j].toString();
				}
				bytearray.push(parseInt(currentDoubleBytestr, 2));
				
			}
			//console.log(bytearray.join(','));
			encodedByteArray =  application.packbitsEncode(bytearray);
			for(var i=0;i<encodedByteArray.length;i++){
				if(encodedByteArray[i].length == 1){
					encodedByteArray[i] = '0' + encodedByteArray[i];
				}
			}
			encodedByteString = encodedByteArray.join('');
			//console.log('encodedByteArray - ' + encodedByteArray);
			//console.log('BASE64 - ' + window.btoa(encodedByteString));
			return window.btoa(encodedByteString);
		};
	application.packbitsEncode = function(byteArray){
		result = [];
		buf = [];
		pos = 0;
		repeat_count = 0;
		MAX_LENGTH = 127;
		state = 'RAW';
		
		finish_raw = function(){
			if(buf.length == 0)
				return;
			result.push(buf.length-1);
			result = result.concat(buf);
			buf = [];
		};
		finish_rle = function(){
			result.push(256-(repeat_count-1));
			result.push(byteArray[pos]);
		};
		
		while(pos < byteArray.length -1){
			current_byte = byteArray[pos];
			
			if(byteArray[pos] == byteArray[pos+1]){
				if(state == 'RAW'){
					finish_raw();
					state = 'RLE';
					repeat_count = 1;
				}else if(state == 'RLE'){
					if(repeat_count == MAX_LENGTH){
						finish_rle();
						repeat_count = 0;
					}
					repeat_count += 1;
				}
			}else{
				if(state == 'RLE'){
					repeat_count += 1;
					finish_rle();
					state = 'RAW';
					repeat_count = 0;
				}else if(state == 'RAW'){
					if(buf.length == MAX_LENGTH)
						finish_raw();
					buf.push(current_byte);
				}
			}
			pos += 1;
		}
		if(state == 'RAW'){
			buf.push(byteArray[pos]);
			finish_raw();
		}else{
			repeat_count += 1;
			finish_rle();
		}
		for(var i=0; i<result.length;i++){
			result[i] = parseInt(result[i], 10).toString(16);
		}
		return result
	};
	application.packbitsDecode = function(byteArray){
		data = byteArray;
		result = [];
		pos = 0;
		while(pos<data.length){
			header_byte = data[pos];
			if(header_byte>127){
				header_byte -=256;
			}
			pos +=1;
			if(0<=header_byte && header_byte <=127){
				result = result.concat(data.slice(pos, pos+header_byte+1));
				pos += header_byte+1;
			}else if(header_byte == -128){
			
			}else{
				for(i=0;i<1-header_byte;i++){
					result.push(data[pos]);
				}
				pos +=1;
			}
		}
		return result;
	};
	application.drawOldMDZonesGrid = function(map, map_counter, md_zones, paper){
		input_map_str = window.atob(map);
		input_map_array = []
		for(var i=0;i<input_map_str.length;i+=2){
			input_map_array.push(parseInt(input_map_str[i]+input_map_str[i+1],16));
		}
		var decodedMap = application.packbitsDecode(input_map_array);
		bitmap = '';
		for(var i=0;i<decodedMap.length;i++){
			//bitmap.push(parseInt(decodedMap[i], 16).toString(2));
			//parseInt(decodedMap[i],10).toString(16)+parseInt(decodedMap[i+1]).toString(16)
			//sub_str = parseInt(parseInt(decodedMap[i],10).toString(16)+parseInt(decodedMap[i+1]).toString(16), 16).toString(2);
			sub_str = parseInt(decodedMap[i],10).toString(2)
			if(sub_str.length == 1)
				sub_str = '0' + sub_str;
			for(var j=0;j<8-sub_str.length;j++){
				bitmap += '0';
			}
			bitmap += sub_str;
		}
		result_map = [];
		for(var i=0;i<md_zones.motion_detection.caps.rows;i++){
			var subarray = [];
			for(var j=0;j<md_zones.motion_detection.caps.columns;j++){
				if(bitmap[j+(md_zones.motion_detection.caps.columns*(i))] == '1'){
					paper.addCell(j+1,i+1,map_counter);
					paper.matrix[map_counter][i][j] = 1;
				}
				
				subarray.push(bitmap[j+(md_zones.motion_detection.caps.columns*(i))]);
			}
			result_map.push(subarray);
		}
		if(!md_zones.motion_detection.regions[map_counter].enabled)
			paper.rectsGroups[map_counter].attr('opacity', '0');
		//console.log(bitmap.toString());
	}; 
	application.drawOldMDZonesRect = function(map, map_counter, md_zones, paper){
		input_map_str = window.atob(map);
		input_map_array = []
		for(var i=0;i<input_map_str.length;i+=2){
			input_map_array.push(parseInt(input_map_str[i]+input_map_str[i+1],16));
		}
		var decodedMap = application.packbitsDecode(input_map_array);
		bitmap = '';
		for(var i=0;i<decodedMap.length;i++){
			//bitmap.push(parseInt(decodedMap[i], 16).toString(2));
			//parseInt(decodedMap[i],10).toString(16)+parseInt(decodedMap[i+1]).toString(16)
			//sub_str = parseInt(parseInt(decodedMap[i],10).toString(16)+parseInt(decodedMap[i+1]).toString(16), 16).toString(2);
			sub_str = parseInt(decodedMap[i],10).toString(2)
			if(sub_str.length == 1)
				sub_str = '0' + sub_str;
			for(var j=0;j<8-sub_str.length;j++){
				bitmap += '0';
			}
			bitmap += sub_str;
		}
		result_map = [];
		var last_coord = {x: 0, y: 0};
		var first_coord = null;
		for(var i=0;i<md_zones.motion_detection.caps.rows;i++){
			var subarray = [];
			for(var j=0;j<md_zones.motion_detection.caps.columns;j++){
				if(bitmap[j+(md_zones.motion_detection.caps.columns*(i))] == '1'){
					last_coord = {x:j, y:i};
					if(first_coord == null){
						first_coord = {x:j, y:i};
					}
					//paper.addCell(j+1,i+1,map_counter);
					//paper.matrix[map_counter][i][j] = 1;
				}
				
				subarray.push(bitmap[j+(md_zones.motion_detection.caps.columns*(i))]);
			}
			result_map.push(subarray);
		}
		// console.log(map_counter + ' input matrix');
		// console.log(result_map);
		if(!first_coord){
			first_coord = {x: 1, y: 1};
		}
		if(!last_coord){
			last_coord = {x: 0, y: 0};
		}
		paper.drawRectZone(first_coord.x, first_coord.y, last_coord.x-first_coord.x+1,last_coord.y-first_coord.y+1, map_counter);
		if(conf.md_zones.global_conf.enable_zones_by_checkbox){
			if(!md_zones.motion_detection.regions[map_counter].enabled)
				paper.rectsGroups[map_counter].attr('opacity', '0');
				//paper.rectsGroups[map_counter].hide();
		}
		//console.log(bitmap.toString());
	}; 
	application.showMDZonesGrid = function(md_zones){
		var layer_buttons = _.template($('#templates #layers-buttons').html());
		var layouts = [];
		var range_list = [];
		for(var i=0;i<md_zones.motion_detection.regions.length;i++){
			range_list.push(i);
			layouts.push({layoutNumber: i, 
							layoutColor: conf.md_zones.global_conf.zone_colors[i],
							enabled: md_zones.motion_detection.regions[i].enabled});
		}
		$('.DM-panel-grid .layers').html(layer_buttons({layouts: layouts}));
		var paper = application.addMDZone(md_zones);
		for(var i=0;i<md_zones.motion_detection.regions.length;i++){
			application.drawOldMDZonesGrid(md_zones.motion_detection.regions[i].map, i, md_zones, paper);
		}
		
		//application.drawOldMDZonesGrid(md_zones.motion_detection.regions[0].map, i, md_zones, paper);
		
	};
	application.showMDZonesRect = function(md_zones){
		var self = this;
			
		event.trigger(event.GET_CAMERA,function(cam){
			self.camera = cam;
		});
		if(!conf.md_zones.global_conf.enable_zones_by_checkbox){
			if(localStorage.getItem("md_zones_visible_" + self.camera['id'])){
				zones_visible = JSON.parse(localStorage.getItem("md_zones_visible_" + self.camera['id']));
			}else{
				zones_visible = [];
				for(var i=0;i<md_zones.motion_detection.regions.length;i++){
					zones_visible.push(true);
				}
			}
		}else{
			zones_visible = []
			for(var i=0;i<md_zones.motion_detection.regions.length;i++){
				zones_visible.push(md_zones.motion_detection.regions[i].enabled);
			}
		}
		var layer_buttons = _.template($('#templates #layers-buttons').html());
		var layouts = [];
		var range_list = [];
		for(var i=0;i<md_zones.motion_detection.regions.length;i++){
			range_list.push(i);
			new_layout = {layoutNumber: i, 
							layoutColor: conf.md_zones.global_conf.zone_colors[i],
							enabled: md_zones.motion_detection.regions[i].enabled,
							checked: zones_visible[i]}
			new_layout.enabled = md_zones.motion_detection.regions[i].map == '' ? false : true;
			layouts.push(new_layout);
		}
		$('.DM-panel-rect .layers').html(layer_buttons({layouts: layouts}));
		//var paper = mdzv.addSquareZone(md_zones);
		var paper = application.addSquareMDZone(md_zones);
		var actLevel = -1;
		for(var i=0;i<md_zones.motion_detection.regions.length;i++){
			application.drawOldMDZonesRect(md_zones.motion_detection.regions[i].map, i, md_zones, paper);
			if(zones_visible[i]){
				paper.rectsGroups[i].attr('opacity', '1');
				actLevel = actLevel == -1 ? i : actLevel;
			}else{
				paper.rectsGroups[i].attr('opacity', '0');
			}
		}
		paper.rectClickFunction = function(){
			//this.unclick();
			$('button.layer-button').removeClass('active');
			$('button.layer-button').removeAttr('style');
			$('button.layer-button-'+ this.layoutNumber.toString()).addClass('active');
			$('button.layer-button-'+ this.layoutNumber.toString()).css('background-color', $('button.layer-button-'+ this.layoutNumber.toString()).attr('active_color'));
			paper.clearDrag(md_zones);
			paper.addDrag(md_zones, this.layoutNumber);
			paper.rectsGroups[this.layoutNumber].toFront();
		}
		for(var i=0;i<paper.rectsGroups.length;i++){
			if(paper.rectsGroups[i].length > 0){
				paper.rectsGroups[i][0].layoutNumber = i;
				paper.rectsGroups[i][0].click(paper.rectClickFunction);
			}
		}
		if(actLevel != -1){
			paper.clearDrag(md_zones);
			paper.addDrag(md_zones, actLevel);
		}
	};
	application.on('showEditMDZones', function (e){
		md_zones = conf.md_zones
		var self = this;

		// todo get from cache
		event.trigger(event.GET_CAMERA,function(cam){
			self.camera = cam;
		});
		/*$.get( conf.base_api_url + "api/v2/cameras/" + self.camera['id'] + "/motion_detection", function(data){
			console.log(data);
		});*/
		
		event.listenTo(event, event.MDZONES_CHECK_VIDEOSIZE, function (size_player) {
			try{
				if($(".player-control-container svg").length > 0){
					var size = CloudUI.calculateMotionZoneSize(size_player);
					
					var width = $(".player-control-container svg").width();
					var height = $(".player-control-container svg").height();
					if(width != size.width || height != size.height){
						console.log("[MD_ZONES] MDZONES_CHECK_VIDEOSIZE");
						zone.redrawRect(size_player);
					}
				}
			}catch(e){
				console.error("[MD_ZONES] Error on MDZONES_CHECK_VIDEOSIZE ", e);
			}
		});
		
		
		// TODO sync to async
		SkyVR.cameraMotionDetection().done(function(data){
			console.log(data);
			md_zones.motion_detection.caps = data['caps'];
			SkyVR.cameraMotionDetectionRegions().done(function(data_regions){
				md_zones.motion_detection.meta = data_regions['meta'];
				if(!data_regions['objects']){
					md_zones.motion_detection.regions = [];
				}else{
					md_zones.motion_detection.regions = data_regions['objects'];
				}

				// init
				if(conf.md_zones.global_conf.enable_zones_by_checkbox){
					if(!localStorage.getItem("md_zones_visible_" + self.camera['id'])){
						zones_visible = [];
						for(var i=0;i<md_zones.motion_detection.regions.length;i++){
							zones_visible.push(true);
						}
						localStorage.setItem("md_zones_visible_" + self.camera['id'], JSON.stringify(zones_visible));
					}else{
						zones_visible = JSON.parse(localStorage.getItem("md_zones_visible_" + self.camera['id']));
						for(var i=0;i<md_zones.motion_detection.regions.length;i++){
							if(!md_zones.motion_detection.regions[i].enabled){
								zones_visible[i] = true;
							}
						}
						localStorage.setItem("md_zones_visible_" + self.camera['id'], JSON.stringify(zones_visible));
					}
				}
				// ?
				for(var i=0;i<md_zones.motion_detection.regions.length;i++){
					md_zones.motion_detection.regions[i] = {
						enabled: md_zones.motion_detection.regions[i]['enabled'],
						map: md_zones.motion_detection.regions[i]['map'],
						name: md_zones.motion_detection.regions[i]['name'],
						sensitivity: md_zones.motion_detection.regions[i]['sensitivity']
					};
				}
				switch ( md_zones.motion_detection.caps.region_shape) {
				  case "rect":
					application.showMDZonesRect(md_zones);
					break
				  case "any":
					application.showMDZonesGrid(md_zones);
					break
				  default:
					alert('region_shape not found');
				}
				// TODO fix it
				//application.addSquareMDZone();
				//application.addMDZone();
			});
		});
	});
	return application;
});
























