define(['config', 'backbone','underscore', 'raphael'], function(conf,bb,_,Raphael){
	var application = {};
	application.show = function(){
		$('.player-control-container').addClass('controls-locked controls-locked-off');
		$('.zone-menu-popover').removeClass('popover-open');
		$(".fullscreen").hide();
		$(".microphone").hide();
	};

	application.hide = function(){
		$('.player-control-container').removeClass('controls-locked controls-locked-off');
		//$('.zone-menu-popover').addClass('popover-open');
		$(".fullscreen").show();
		// $(".microphone").show();
	};
	application.showAddZone = function(){
		application.show();
		var paper = Raphael($('.player-control-container')[0], $('.flash-player-container')[0].clientWidth, $('.flash-player-container')[0].clientHeight);
		$('.player-control-container svg').css('position','absolute');
		$(".player-control-container svg").css("z-index", 10);
		
		//$('.player-control-container svg').attr("width","100%");
		//$('.player-control-container svg').attr("height","100%");
		paper.layers = [];
		paper.rectsGroups = [];
		paper.activeLayer = 0;
		$('.layer-button-0').addClass('active');
		$('.layer-button-0').css('background-color', $('.layer-button-0').attr('active_color'));
		$('.layer-button').click(function(){
			$('.layer-button').removeClass('active');
			$('.layer-button').removeAttr('style');
			$(this).addClass('active');
			$(this).css('background-color', $(this).attr('active_color'));
			paper.activeLayer = parseInt($(this).attr('layer-number'));
			paper.rectsGroups[paper.activeLayer].toFront();
		});
		application.centringLayoutButtons();
		return paper;
	};
	application.showMDPanelGrid = function(){
		$('.timeline').hide();
		//$('.camera-spinner').hide();
		$('.DM-panel-grid').show();
	};
	application.hideMDPanelGrid = function(){
		$('.timeline').show();
		//$('.camera-spinner').show();
		$('.DM-panel-grid').hide();
	};
	application.showMDPanelSquare = function(){
		$('.timeline').hide();
		//$('.camera-spinner').hide();
		$('.DM-panel-rect').show();
	};
	application.hideMDPanelSquare = function(){
		$('.timeline').show();
		//$('.camera-spinner').show();
		$('.DM-panel-rect').hide();
	};
	application.hideGrid = function(){
		var example = $('#grid-canvas');
		ctx = example[0].getContext('2d');
		ctx.clearRect(0, 0, example.width(), example.height());
		
	};
	application.showGrid = function(columns, rows){
		var lineWidth = 1;
		var width = $('.flash-player-container')[0].clientWidth;
		var height = $('.flash-player-container')[0].clientHeight;
		var xStep = width/columns;
		//console.log("xStep canvas", xStep);
		var yStep = height/rows;
		//console.log("yStep canvas", yStep);
		var example = $('#grid-canvas');
		//example.
		//example.width(width);
		example.attr("width",width.toString());
		//example.height(height);
		example.attr("height",height.toString());
		ctx = example[0].getContext('2d');
		ctx.beginPath();
		for(var i=0;i<=columns;i++){
			ctx.moveTo(xStep*i, 0);
			ctx.lineTo(xStep*i, height);
			
		}
		for(var i=0;i<=rows;i++){
			ctx.moveTo(0, yStep*i);
			ctx.lineTo(width, yStep*i);
			
		}	
		ctx.lineWidth = lineWidth;		
		ctx.stroke();
		ctx.closePath();
		
	};
	application.deletePaper = function(){
		$(".player-control-container svg").remove();
	}
	paperGridSupport = {
		columns: 0,
		rows: 0,
		paperWidth: 0,
		paperHeight: 0,
		PositionToMDPosition: function(x, y){
			xGrid = this.columns;
			yGrid = this.rows;
			xStep = this.paperWidth/xGrid;
			yStep = this.paperHeight/yGrid;
			//console.log("xStep vectors", xStep);
			//console.log("yStep vectors", yStep);
			xGridPosition = x/xStep;
			yGridPosition = y/yStep;
			return {x: Math.round(xGridPosition),y: Math.round(yGridPosition),xPosition:Math.round(xGridPosition)*xStep,yPosition:Math.round(yGridPosition)*yStep}
		},
		PositionToMDPositionX: function(x){
			xGrid = this.columns;
			xStep = this.paperWidth/xGrid;
			xGridPosition = x/xStep;
			return Math.round(xGridPosition)
		},
		PositionToMDPositionY: function(y){
			yGrid = this.rows;
			yStep = this.paperHeight/yGrid;
			yGridPosition = y/yStep;
			return Math.round(yGridPosition)
		},
		MDPositionToPosition: function(x, y){
			xGrid = this.columns;
			yGrid = this.rows;
			xStep = this.paperWidth/xGrid;
			yStep = this.paperHeight/yGrid;
			xPosition = x*xStep;
			yPosition = y*yStep;
			return {x: xPosition,y: yPosition}
		},
		getWidthMD: function(){
			/*xGrid = this.columns;
			xStep = this.paperWidth/xGrid;
			return this.attrs.width/xStep*/
			return this.MDWidth;
		},
		getHeightMD: function(){
			/*yGrid = this.rows;
			yStep = this.paperHeight/yGrid;
			return this.attrs.height/yStep*/
			return this.MDHeight;
		},
		setMDx: function(x){
			xGrid = this.columns;
			xStep = this.paperWidth/xGrid;
			this.MDx = x;
			if(this.type == "rect")
				this.attr({x:x*xStep})
			else
				this.attr({cx:x*xStep});
		},
		setMDy: function(y){
			yGrid = this.rows;
			yStep = this.paperHeight/yGrid;
			this.MDy = y;
			if(this.type == "rect")
				this.attr({y:y*yStep})
			else
				this.attr({cy:y*yStep});
		},
		getMDx: function(){
			xGrid = this.columns;
			xStep = this.paperWidth/xGrid;
			if(this.type == "rect")
				return this.attrs.x / xStep
			else
				return this.attrs.cx / xStep;
		},
		getMDy: function(){
			yGrid = this.rows;
			yStep = this.paperHeight/yGrid;
			if(this.type == "rect")
				return this.attrs.y / yStep
			else
				return this.attrs.cy / yStep;
		}
	};
	application.drawRectZone = function(rectXMD, rectYMD, rectWidthMD,rectHeightMD, layersCount){
		color = conf.md_zones.global_conf.zone_colors[layersCount];
		paper = this;
		paperGridSupport = paper.paperGridSupport;
		rectPosition = paper.MDPositionToPosition(rectXMD, rectYMD);
		rectDim = paper.MDPositionToPosition(rectWidthMD, rectHeightMD);

		//var rect = paper.rect(rectPosition.x + rectStrokeWidth, rectPosition.y + rectStrokeWidth, rectDim.x - rectStrokeWidth*2, rectDim.y - rectStrokeWidth*2);
		
		var rect = paper.rect(rectPosition.x, rectPosition.y, rectDim.x, rectDim.y);
		rect.attr('stroke', color);
		rect.attr('stroke-width', rectStrokeWidth.toString());
		rect.attr('fill', color);
		rect.attr('fill-opacity', '0.5');
		rect.MDx = rectXMD;
		rect.MDy = rectYMD;
		rect.MDWidth = rectWidthMD;
		rect.MDHeight = rectHeightMD;
		_.extend(rect, paperGridSupport);
		_.extend(paper, paperGridSupport);
		var circles = [];
		circles[0] = paper.circle(rect.attrs.x, rect.attrs.y, circlesDiameter);
		circles[0].scale_multiplier = {x: -1, y: -1};
		circles[0].hide();
		circles[1] = paper.circle(rect.attrs.x + rect.attrs.width, rect.attrs.y, circlesDiameter);
		circles[1].scale_multiplier = {x: 1, y: -1};
		circles[1].hide();
		circles[2] = paper.circle(rect.attrs.x + rect.attrs.width, rect.attrs.y + rect.attrs.height, circlesDiameter);
		circles[2].scale_multiplier = {x: 1, y: 1};
		circles[2].hide();
		circles[3] = paper.circle(rect.attrs.x, rect.attrs.y + rect.attrs.height, circlesDiameter);
		circles[3].scale_multiplier = {x: -1, y: 1};
		circles[3].hide();
		
		circles[0].MDx = rectXMD;
		circles[0].MDy = rectYMD;
		
		circles[1].MDx = rectXMD + rectWidthMD;
		circles[1].MDy = rectYMD;
		
		circles[2].MDx = rectXMD + rectWidthMD;
		circles[2].MDy = rectYMD + rectHeightMD;
		
		circles[3].MDx = rectXMD;
		circles[3].MDy = rectYMD + rectHeightMD;
		
		circles[0].x_circle = circles[3];
		circles[0].y_circle = circles[1];
		
		circles[1].x_circle = circles[2];
		circles[1].y_circle = circles[0];
		
		circles[2].x_circle = circles[1];
		circles[2].y_circle = circles[3];
		
		circles[3].x_circle = circles[0];
		circles[3].y_circle = circles[2];
		
		
		for(var i=0;i<4;i++){
			circles[i].attr('fill', color);
			circles[i].attr('stroke-width', '0');
			_.extend(circles[i], paperGridSupport);
			circles[i].mainRect = rect;
		}
		//_.extend(paper, {rect:rect,circles:circles});
		//paper.rectsGroups[layersCount] = [];
		_.extend(rect, {circles: circles});
		paper.rectsGroups[layersCount].push(rect);
		paper.rectsGroups[layersCount].push(circles[0]);
		paper.rectsGroups[layersCount].push(circles[1]);
		paper.rectsGroups[layersCount].push(circles[2]);
		paper.rectsGroups[layersCount].push(circles[3]);
		paper.redrawRect = function(){
			this.setSize($('.flash-player-container')[0].clientWidth, $('.flash-player-container')[0].clientHeight);
			this.paperWidth = $('.flash-player-container')[0].clientWidth;
			this.paperHeight = $('.flash-player-container')[0].clientHeight;
			xStep = this.width/this.columns;
			yStep = this.height/this.rows;
			
			for(j=0;j<this.rectsGroups.length;j++){
				
				rectAttr = {'width': this.rectsGroups[j][0].MDWidth*xStep, 'height': this.rectsGroups[j][0].MDHeight*yStep, 'x': this.rectsGroups[j][0].MDx*xStep, 'y': this.rectsGroups[j][0].MDy*yStep}
				this.rectsGroups[j][0].attr(rectAttr);
				this.rectsGroups[j][0].paperWidth = this.width;
				this.rectsGroups[j][0].paperHeight = this.height;
				for(var i=1;i<5;i++){
					this.rectsGroups[j][i].attr({'cx': this.rectsGroups[j][i].MDx*xStep, 'cy': this.rectsGroups[j][i].MDy*yStep});
					this.rectsGroups[j][i].paperWidth = this.width;
					this.rectsGroups[j][i].paperHeight = this.height;
				}
			}
		};
		//return paper;
	};
	application.addSquareZone = function(md_zones){
		application.showMDPanelSquare();
		circlesDiameter = 10;
		rectStrokeWidth = 4;
		rectXMD = 0;
		rectYMD = 0;
		rectWidthMD = 20;
		rectHeightMD = 10;
		
		paper = application.showAddZone();
		
		function RectArray(){
			rectArray = []
			for(var i=1;i<=md_zones.motion_detection.caps.columns;i++){
				rectArray[i] = [];
			}
			return {rects: rectArray}
		}
		
		for(var i=0;i<md_zones.motion_detection.caps.max_regions;i++){
			paper.layers[i] = new RectArray();
			paper.rectsGroups[i] = paper.set();
		}
		
		paperGridSupport.columns = md_zones.motion_detection.caps.columns;
		paperGridSupport.rows = md_zones.motion_detection.caps.rows;
		paperGridSupport.paperWidth = paper.width;
		paperGridSupport.paperHeight = paper.height;
		_.extend(paper, paperGridSupport);
		paper.paperGridSupport = paperGridSupport;
		_.extend(paper,{drawRectZone: application.drawRectZone})
		//paper = application.drawRectZone(paper, rectXMD, rectYMD, rectWidthMD,rectHeightMD, paperGridSupport);
		
		
		return paper;
	};
	application.centringLayoutButtons = function(){
		panelWidth = $('.layers').width();
		documentWidth = $(window).width();
		$('.layers').css('left', documentWidth/2 - panelWidth/2);
	};
	application.addZone = function(columns, rows,layersCount){
		application.showMDPanelGrid();
		paper = application.showAddZone();
		function RectArray(){
			rectArray = []
			for(var i=1;i<=columns;i++){
				/*var subarray = []
				for(var j=0;j<rows;j++){
					subarray[j] = 0;
				}*/
				rectArray[i] = [];
			}
			return {rects: rectArray}
		}
		
		for(var i=0;i<layersCount;i++){
			//paper.layers[i] = {rects: _.extend([], rectArray)};
			paper.layers[i] = new RectArray();
			paper.rectsGroups[i] = paper.set();
			/*for(var a=0;a<paper.layers[i].rects.length;a++){
				if(paper.layers[i].rects[a]){
					for(var b=0;b<paper.layers[i].rects[a].length;b++)
						if(paper.layers[i].rects[a][b])
							paper.rectsGroups[i].push(paper.layers[i].rects[a][b]);
				}
			}*/
			//paper.rectsGroups[i].attr('style','z-index:' + i);
			//paper.layers[i].rects = rectArray;
			//_.extend(paper.layers[i], {rects:rectArray});
		}
		
		paperGridSupport.columns = columns;
		paperGridSupport.rows = rows;
		paperGridSupport.paperWidth = paper.width;
		paperGridSupport.paperHeight = paper.height;
		_.extend(paper, paperGridSupport);
		xStep = paper.width / columns;
		yStep = paper.height / rows;
		paper.createGrid = function(){
			for(var i=0;i<this.columns;i++){
				for(var j=0;j<this.rows;j++){
					var rect = paper.rect(xStep*(i), yStep*(j), xStep, yStep);
					rect.attr('stroke', '#000000');
					rect.attr('stroke-width', '1');
					rect.attr('fill', '#bf66ff');
					rect.attr('fill-opacity', '0');
				}
			}
		}
		paper.addCell = function(xCell, yCell, layerNumber){
			//if(color = none)
				//color = '#bf66ff';
			var rect = paper.rect(xStep*(xCell-1), yStep*(yCell-1), xStep, yStep);
			rect.xCell = xCell;
			rect.yCell = yCell;
			paper.layers[layerNumber].rects[xCell][yCell] = rect;
			paper.rectsGroups[layerNumber].push(rect);
			
			rect.attr('z-index', layerNumber);
			rect.attr('stroke-width', '0');
			rect.attr('fill', conf.md_zones.global_conf.zone_colors[layerNumber]);
			rect.attr('fill-opacity', '0.5');
		}
		/*paper.addCell = function(xCell, yCell){
			rect = paper.getElementByPoint(xCell, yCell);
			//rect.attr('stroke-width', '0');
			//rect.attr('fill', '#bf66ff');
			rect.attr('fill-opacity', '0.5');
		}*/
		paper.removeCell = function(xCell, yCell, layerNumber){
			paper.layers[layerNumber].rects[xCell][yCell].remove();
			//paper.rects[xCell][yCell] = null;
			//element = paper.getElementByPoint(xCell, yCell);
			/*console.log(element);
			if(element != null){
				element.remove();
				return true;
			}else{
				return false;
			}*/
		};
		paper.redrawRect = function(){
			this.setSize($('.flash-player-container')[0].clientWidth, $('.flash-player-container')[0].clientHeight);
			this.paperWidth = $('.flash-player-container')[0].clientWidth;
			this.paperHeight = $('.flash-player-container')[0].clientHeight;
			xStep = this.width/this.columns;
			yStep = this.height/this.rows;
			for(var i=0;i<=this.rectsGroups.length;i++){
				for(var j=0;j<this.rectsGroups[i].length;j++){
					var x_pos = (this.rectsGroups[i][j].xCell-1)*xStep;
					var y_pos = (this.rectsGroups[i][j].yCell-1)*yStep;
					this.rectsGroups[i][j].attr({'width': xStep, 'height': yStep, 'x': x_pos, 'y':y_pos});
				}
			}
			/*for(var i=1;i<=this.columns;i++){
				for(var j=1;j<=this.rows;j++){
					if(this.rects[i][j]){
						this.rects[i][j].attr({'width': xStep, 'height': yStep, 'x': xStep*(i-1), 'y':yStep*(j-1)});
					}
				}
			}*/
		};
		/*paper.removeCell = function(xCell, yCell){
			rect = paper.getElementByPoint(xCell, yCell);
			rect.attr('fill-opacity', '0');
		};*/
		
		return paper;
	};
	return application;
});
