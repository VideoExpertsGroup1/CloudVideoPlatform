window.AudioStreaming = new function (){
	this.elemId = "audio_streaming_swf";
	this.obj = undefined;

	this.log = function(s){
		if(window["AndroidWebPlayerInterface"]) return;
		console.log("[AUDIO-STREAMING-JS] " + s);
	}

	this.error = function(s){
		if(window["AndroidWebPlayerInterface"]) return;
		console.log("[AUDIO-STREAMING-JS] " + s);
	}

	this.startedPublish = function(){
		// nothing
	}
	
	this.stoppedPublish = function(){
		// nothing
	}
	
	this.showSecuritySettings = function(){
		// nothing
	}

	this.hideSecuritySettings = function(){
		// nothing
	}
	
	this.activityLevel = function(lvl){
		console.log("audio lvl " + lvl);
	}

	this.flash = function(){
		if(!this.obj){
			this.obj = document.getElementById(this.elemId);
			if(!this.obj){
				this.error("Element '" + this.elemId + "' not found");
			}
			this.log("Init");
		}else if(!this.obj.vjs_activate){
			// try again
			this.obj = document.getElementById(this.elemId);
			if(!this.obj){
				this.error("Element '" + this.elemId + "' not found");
			}
			this.log("reinit");
		}
		return this.obj;
	};

	this.activate = function(rtmpUrl){
		var f = this.flash();
		if(!f) return;
		if(f.vjs_activate)
			f.vjs_activate(rtmpUrl);
		else{
			this.error("Function vjs_activate not found");
			this.obj = undefined;
		}
	};

	this.support = function(){
		var f = this.flash();
		if(!f) return;
		if(f.vjs_support)
			return f.vjs_support();
		else{
			this.error("Function vjs_support not found");
			this.obj = undefined;
		}
	};

	this.status = function(){
		var f = this.flash();
		if(!f) return;
		if(f.vjs_status)
			return f.vjs_status();
		else{
			this.error("Function vjs_status not found");
			this.obj = undefined;
		}
	};

	this.deactivate = function(){
		var f = this.flash();
		if(!f) return;
		if(f.vjs_deactivate)
			f.vjs_deactivate();
		else{
			this.error("Function vjs_deactivate not found");
			this.obj = undefined;
		}
	};
	
	this.isActivated = function(){
		return (this.status() == "activated");
	};
	
	this.isDeactivated = function(){
		return (this.status() == "deactivated");
	};
	
	this.isTransitive = function(){
		return (this.status() == "transitive");
	};
	
}();
