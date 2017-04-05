window.AndroidRTMPPlayers = {};
window.AndroidRTMPPlayer = function (id, opt){
	var self = this;
	self.interfaceName = "AndroidWebPlayerInterface";
	window.AndroidRTMPPlayers = window.AndroidRTMPPlayers || {};
	self.bExists = true;
	if(!window[self.interfaceName]){
		console.error('Did not found AndroidWebPlayerInterface');
		self.bExists = false;
		// return undefined;
	}

	if(!window.AndroidRTMPPlayers[id]){
		window.AndroidRTMPPlayers[id] = new function(id1, opt){
			this.id = id1;
			var selfPlayer = this;
			selfPlayer.id = id1;
			this.pause = function(){
				if(self.bExists)
					AndroidWebPlayerInterface.pause(selfPlayer.id);
			}
			this.dispose = function(){
				if(self.bExists)
					AndroidWebPlayerInterface.dispose(selfPlayer.id);
				delete window.AndroidRTMPPlayers[this.id];
			};
			this.src = function(source){
				if(self.bExists){
					if(source){
						var src = source.src ? source.src : source[0].src;
						try{ AndroidWebPlayerInterface.setSource(selfPlayer.id,src); } catch(e) { ApplicationMobileInterface.toast("(on src) " + e.name + ":" + e.message); };
					}else{
						return AndroidWebPlayerInterface.getSource(selfPlayer.id);
					}
				}else{
					 // fake value
					if(source){
						if(source.src){
							this.srcLink = source.src;
						}else{
							this.srcLink = source[0].src;
						}
					}else{
						return this.srcLink;
					}
				}
			};
			this.hide = function(){
				if(self.bExists){
					try{ AndroidWebPlayerInterface.hide(selfPlayer.id); } catch(e) { ApplicationMobileInterface.toast("(on hide " + selfPlayer.id + ") " + e.name + ":" + e.message); }
				}
			};
			this.show = function(){
				if(self.bExists){
					try{ AndroidWebPlayerInterface.show(selfPlayer.id); } catch(e) { ApplicationMobileInterface.toast("(on show " + selfPlayer.id + ") " + e.name + ":" + e.message); }
				}
			};
			this.play = function(){
				if(self.bExists){
					try{ AndroidWebPlayerInterface.play(selfPlayer.id); } catch(e) { ApplicationMobileInterface.toast("(on play) " + e.name + ":" + e.message); }
				}
			};
			this.volume = function(val){
				if(self.bExists){
					if(val)
						AndroidWebPlayerInterface.setVolume(selfPlayer.id,val);
					else
						return AndroidWebPlayerInterface.getVolume(selfPlayer.id);
				}else{
					 // fake values
					if(val)
						this.fakeVolume = val;
					else
						return this.fakeVolume;
				}
			};
			this.currentTime = function(val){
				if(self.bExists){
					if(val){
						AndroidWebPlayerInterface.setCurrentTime(selfPlayer.id, val);
					}else{
						var currentTime = AndroidWebPlayerInterface.getCurrentTime(selfPlayer.id);
						return currentTime;
					}
				}else{
					if(val){
						self.currentTimeCounter = val;
					}else{
						self.currentTimeCounter = self.currentTimeCounter || 0;
					}
					self.currentTimeCounter++;
					return self.currentTimeCounter;  // fake value
				}
			};
			this.ready = function(handler){
				// TODO
			}
			this.endedHandler = undefined;
			this.ended = function(){
				if(selfPlayer.endedHandler != undefined){
					setTimeout(selfPlayer.endedHandler, 1);
				}
			};
			this.oneLoadstartHandlers = [];
			this.loadstart = function(){
				if(selfPlayer.oneLoadstartHandlers.length > 0){
					try{
						for(var i = 0; i < selfPlayer.oneLoadstartHandlers.length; i++){
							setTimeout(selfPlayer.oneLoadstartHandlers[i],1);
						}
					}catch(e){
						
					}
					selfPlayer.oneLoadstartHandlers = [];
				}
			}
			
			this.oneLoadeddataHandlers = [];
			this.loadeddata = function(){
				console.log("loadeddata");
				if(selfPlayer.oneLoadeddataHandlers.length > 0){
					try{
						for(var i = 0; i < selfPlayer.oneLoadeddataHandlers.length; i++){
							setTimeout(selfPlayer.oneLoadeddataHandlers[i], 1);
						}
					}catch(e){
						
					}
					selfPlayer.oneLoadeddataHandlers = [];
				}
			}

			this.off = function(name){
				if(name == "ended"){
					selfPlayer.endedHandler = undefined;
				}
				if(name == "loadstart"){
					selfPlayer.oneLoadstartHandlers = [];
				}
			};
			this.on = function(name, handler){
				if(name == "ended"){
					// set new handler
					selfPlayer.endedHandler = handler;
				}
			}
			this.one = function(name, handler){
				if(name == "loadeddata"){
					// ApplicationMobileInterface.toast("(loadeddata) " + selfPlayer.id + " : " + handler);
					selfPlayer.oneLoadeddataHandlers.push(handler);
				}
				if(name == "loadstart"){
					selfPlayer.oneLoadstartHandlers.push(handler);
				}
			}
			this.el = function(){
				// TODO return
				// console.log("el: ", this.id);
				return $(this.id);
			}
			this.error = function(){
				return null;
			}
			this.currentSrc = function(){
				if(self.bExists){
					return AndroidWebPlayerInterface.getSource(selfPlayer.id);
				}
				return this.srcLink; // fake value
			}
			this.readyState = function(){
				if(self.bExists){
					return AndroidWebPlayerInterface.getReadyState(selfPlayer.id);
				}
				return 4; // fake value
			}
			
			this.videoHeight = function(){
				if(self.bExists){
					return AndroidWebPlayerInterface.getVideoHeight(selfPlayer.id);
				}
				return 420; // fake value
			}
			this.videoWidth = function(){
				if(self.bExists){
					return AndroidWebPlayerInterface.getVideoWidth(selfPlayer.id);
				}else{
					return 640; // fake value
				}
			}
			this.paused = function(){
				if(self.bExists){
					var b = AndroidWebPlayerInterface.paused(selfPlayer.id);
					return b;
				}else{
					return false; // fake value
				}
			}
			
		}(id, opt);
	}
	return window.AndroidRTMPPlayers[id];
};
