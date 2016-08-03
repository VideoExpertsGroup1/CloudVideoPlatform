function ShowCameras(){
	AccpClient.updateJsonAcl();
	AccpApi.setacls(JSON.parse($('#jsonacls').val()));
	var iss = encodeURIComponent(location.origin + '/openid');
	var newWin = window.open("http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/svcauth/init?iss=" + iss + "&uatype=web", "_blank");
	newWin.focus();
}

window.AccpClient = new function (){
	var self = this;

	this.isAuthorizePHPPage = function(){
		return window.location.pathname == "/openid/authorize.php";
	}

	this.loginForm = function(action){
		action = (action != undefined ? 'action="' + action + '"' : '');
		var result="";
		result += "<h2>VXG Accp Example (use PHP)<\/h2>";
		result += "<p class=\"subtitle\">VXG Accp Example (use PHP)<\/p>";
		result += "<div class=\"form-wrapper\">";
		result += "	<form id=\"loginform\" method=\"post\" " + action + ">";
		result += "		<input placeholder=\"Username...\" id=\"username\" maxlength=\"254\" name=\"username\" type=\"text\"><br>";
		result += "		<input placeholder=\"Password...\" id=\"password\" name=\"password\" type=\"password\"><br>";
		result += "		<div class=\"error\"><\/div>";
		result += "	   <input value=\"Sign In\" type=\"submit\">";
		result += "   <\/form>";
		if(!self.isAuthorizePHPPage()){
			result += "	  <button id='signup'>Sign Up</button>";
		}
		result += "<\/div>";
		result += "";
		return result;
	}
	
	this.signupForm = function(){
		var result="";
		result += "<h2>VXG Accp Example (use PHP)<\/h2>";
		result += "<p class=\"subtitle\">Registration<\/p>";
		result += "<div class=\"form-wrapper\">";
		result += "	  <form id=\"signupform\" method=\"post\">";
		result += "		  <input placeholder=\"Username...\" id=\"username\" maxlength=\"254\" name=\"username\" type=\"text\"><br>";
		result += "		  <input placeholder=\"Password...\" id=\"password\" name=\"password\" type=\"password\"><br>";
		result += "		  <div class=\"error\"><\/div>";
		result += "	      <input value=\"Sign Up\" type=\"submit\">";
		result += "   <\/form>";
		result += "	  <button id='signin'>Sign In</button>";
		result += "<\/div>";
		result += "";
		return result;
	}
	
	this.addFieldAcl = function(){
		var i = $('.acls .acl').length - 1;
		console.log('length: ' + $('.acls .acl').length);
		$('.acls').append(''
			+ '<div class="acl">'
			+ '		<input class="acl_uuid" type="text" value="" placeholder="Camera.UUID"/><br>'
			+ '		<div class="permissions">Camera permissions: '
			+ '			<div class="permissionitem"><input class="checkbox" id="camera_all_' + i +'" topic="Camera" type="checkbox" value="All"/><label for="camera_all_' + i +'">All</label></div>'
			+ '			<div class="permissionitem"><input class="checkbox" id="camera_live_' + i +'" topic="Camera" type="checkbox" value="Live"/><label for="camera_live_' + i +'">Live</label></div>'
			+ '			<div class="permissionitem"><input class="checkbox" id="camera_playback_' + i +'" topic="Camera" type="checkbox" value="Playback"/><label for="camera_playback_' + i +'">Playback</label></div>'
			+ '			<div class="permissionitem"><input class="checkbox" id="camera_ptz_' + i +'" topic="Camera" type="checkbox" value="PTZ"/><label for="camera_ptz_' + i +'">PTZ</label></div>'
			+ '		</div>'
			+ '		<div class="permissions">Clip permisions: '
			+ '			<div class="permissionitem"><input class="checkbox" id="clip_all_' + i +'" topic="Clip" type="checkbox" value="All"/><label for="clip_all_' + i +'">All</label></div>'
			+ '			<div class="permissionitem"><input class="checkbox" id="clip_play_' + i +'" topic="Clip" type="checkbox" value="Play"/><label for="clip_play_' + i +'">Play</label></div>'
			+ '		</div>'
			+ '</div>'
		);
		$('.acl_uuid').unbind().bind('keyup', self.updateJsonAcl);
		$('.acl_uuid').change(self.updateJsonAcl);
		$('.checkbox').unbind().change(self.updateJsonAcl);
		self.updateJsonAcl();
	}
	
	this.removeFieldAcl = function(){
		var i = $('.acls .acl').length;
		if($('.acls .acl').length > 1){
			$('.acls .acl')[i-1].remove();
		}
		self.updateJsonAcl();
	}

	this.updateJsonAcl = function(){
		var jsonacl = [];
		for(var i = 0; i < $('.acls .acl').length; i++){
			var el = $('.acls .acl')[i];
			var uuid = $(el).find('.acl_uuid').val();
			var camera_access = [];
			var clip_access = [];
			var checkboxes = $(el).find('.checkbox');
			for(var t = 0; t < checkboxes.length; t++){
				var topic = $(checkboxes[t]).attr('topic');
				var checked = $(checkboxes[t]).prop("checked");
				var name = $(checkboxes[t]).val();
				// console.log(uuid + " " + name + " " + checked + " " + topic);
				if(topic == "Clip"){
					if(checked){
						clip_access.push(name);
					}
				}else if(topic == "Camera"){
					if(checked){
						camera_access.push(name);
					}
				}
			}

			jsonacl.push({
				'S': 'Camera.UUID',
				'F': [uuid],
				'O': 'Camera',
				'P': camera_access
			});
			
			jsonacl.push({
				'S': 'Camera.UUID',
				'F': [uuid],
				'O': 'Clip',
				'P': clip_access
			});
		}
		$('#jsonacls').val(JSON.stringify(jsonacl, null, "\t"));
	}

	this.aclsForm = function(){
		var result="";
		result += "<div class='camlist'>";
		
		if(!self.isAuthorizePHPPage()){
			result += "<div class='menu'>";
			result += "    <div class='logout'>Sign-out</div>";
			result += "    <div class='profile'>Profile</div>";
			result += "</div>";
		}
		
		result += "ACLs:<hr>";
		result += "<button id='addacl'>Add Acl</button>";
		result += "<button id='removeacl'>Remove Acl</button>";
		result += "<button id='showacls'>Show JSON</button>";
		if(!self.isAuthorizePHPPage()){
			result += "<button id='setacl'>Cameras</button>";
		}else{
			result += "<button id='setacl'>Continue</button>";
		}
		result += "<textarea id='jsonacls'></textarea><br/>";
		result += "<div class='acls'>";
		result += "</div>";
		result += "</div>";
		return result;
	}

	this.showhideJsonAcls = function(){
		if($('#jsonacls').is(':visible')){
			$('#jsonacls').hide();
			$('.acl').show();
			$('#removeacl').show();
			$('#addacl').show();
			$('#showacls').html('Show JSON');
		}else{
			$('#jsonacls').show();
			$('.acl').hide();
			$('#removeacl').hide();
			$('#addacl').hide();
			$('#showacls').html('Hide JSON');
		}
	}

	this.signout = function(){
		AccpApi.signout().done(function(){
			self.showLoginForm();
		});
	}

	this.showACLs = function(){
		$('.vxgaccp-cell-content').html(AccpClient.aclsForm());
		this.addFieldAcl();
		$('#addacl').unbind().bind('click', self.addFieldAcl);
		$('#removeacl').unbind().bind('click', self.removeFieldAcl);
		$('#showacls').unbind().bind('click', self.showhideJsonAcls);
		if(!self.isAuthorizePHPPage()){
			$('#setacl').unbind().bind('click', ShowCameras);
		}else{
			$('#setacl').unbind().bind('click', function(){
				AccpClient.updateJsonAcl();
				AccpApi.setacls(JSON.parse($('#jsonacls').val()));
				window.location = window.location.search;
			});
		}
		$('.logout').unbind().bind('click', self.signout);
	}
	
	this.showSignupForm = function(){
		$('.vxgaccp-cell-content').html(AccpClient.signupForm());
		$('#signupform').unbind().submit(function(e){
			e.preventDefault();
			$('.error').html("");
			AccpApi.signup($('#username').val(), $('#password').val()).done(function(response){
				self.showLoginForm();
			}).fail(function(){
				$('.error').html("Error");
			});
		});
		$('#signin').unbind().bind('click', function(e){
			self.showLoginForm();
		});
	}
	
	this.showLoginForm = function(action){
		$('.vxgaccp-cell-content').html(AccpClient.loginForm(action));
		if(!self.isAuthorizePHPPage()){
			$('#loginform').unbind().submit(function(e){
				e.preventDefault();
				$('.error').html("");
				AccpApi.login($('#username').val(), $('#password').val()).done(function(response){
					AccpApi.svcp_auth_app_url = response.svcp_auth_app_url;
					AccpApi.svcp_auth_web_url = response.svcp_auth_web_url;
					AccpClient.showACLs();
				}).fail(function(){
					$('.error').html("Error");
				});
			});
			$('#signup').unbind().bind('click', function(e){
				self.showSignupForm();
			});
		};
	}
}



