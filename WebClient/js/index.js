$( document ).ready(function() {
	AccpApi.profile().done(function(response){
		console.log(response);
		AccpClient.username = response.username;
		AccpClient.email = response.email;
		AccpApi.svcp_auth_web_url=localStorage.getItem("svURL");
		AccpClient.firstname = response.first_name;
		AccpClient.lastname = response.last_name;
		//ask server to send the list of cameras back
		AccpApi.cameras().done(function(response){
			
			
			$('#content').html(AccpClient.cameraGrid(response));
			AccpClient.cameralistBindButtons();
			
			
			}).fail(function(){alert("fail");});
		
		
		//AccpClient.updateCameraList();
		  
		  
		  
	}).fail(function(){
		$('.vxgaccp-cell-content').html(AccpClient.signinForm());
		document.getElementById('username').style.color='#046B90';
		AccpClient.signinBindButtons();	
	});
	
	
	
});

window.AccpClient = new function (){
	this.videoServerURL="http://54.173.34.172";
	this.svcpLink='';
	this.plusPress=false;
	this.camerasInfo=null;
	this.DelIndex="";
	this.signinForm = function(){
		var result = ""
		+ "<h2>Video Experts Group<\/h2>"
		+ "<p class=\"subtitle\">Cloud Video Platform<\/p>"
		result += "<div class=\"form-wrapper\">";
		result += "	<form id=\"loginform\">";
		result += "		<input placeholder=\"Username\" id=\"username\" maxlength=\"254\" onfocus='$(\".error\").hide()' name=\"username\" type=\"text\"><br>";
		result += "		<input placeholder='Password' id=\"password\" name=\"password\" onfocus='$(\".error\").hide()' type=\"password\"><br>";
		result += "		<div class=\"error\" id='loginError'><\/div>";
		result += "	   <input value=\"Sign In\" type='submit'>";
		result += "   </form>";
		result += "	  <button class='signup'>Sign Up</button>";
		result += "</div>";
		result += "<div class='row-content-powered-by'>";
		result += "		<div class='powered-by'>Powered by VXG Cloud Platform</div>";
		result += "</div>";
		result += "";
		return result;
	};
	
	this.signupForm = function(){
		var result = ""
		+ "<h2>Video Experts Group<\/h2>"
		+ "<p class=\"subtitle\">Registration<\/p>"
		result += "<div class=\"form-wrapper\">";
		result += "	<form id='signupform'>";
		result += "		<input placeholder='Username' id=\"username\" maxlength=\"254\" onfocus='$(\".error\").hide()' name=\"username\" type=\"text\"><br>";
		result += "		<input placeholder='Password' id=\"password\" name=\"password\"  onfocus='$(\".error\").hide()' type=\"password\"><br>";
		result += "		<input placeholder='Email' id='email' maxlength='254' name='email' onfocus='$(\".error\").hide()' type='text'><br>";
		result += "		<input placeholder='First Name' id='firstname' maxlength='254' onfocus='$(\".error\").hide()' name='firstname' type='text'><br>";
		result += "		<input placeholder='Last Name' id='lastname' maxlength='254' onfocus='$(\".error\").hide()'  name='lastname' type='text'><br>";
		result += "		<div class=\"error\"><\/div>";
		result += "	   <input value=\"Sign Up\" type='submit'>";
		result += "   </form>";
		result += "	  <button class='signin'>Sign In</button>";
		result += "</div>";
		result += "<div class='row-content-powered-by'>";
		result += "		<div class='powered-by'>Powered by VXG Cloud Platform</div>";
		result += "</div>";
		result += "";
		return result;
	};
					
	this.cameraGrid = function(cameras){
	    
		
		var camera="";
		this.camerasInfo=cameras;
		var camGrid="<div class='camGrid'>";
		var preview="http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/files/images/camimg_unauthorized.png";
		var camName='';
		var l=cameras.objects.length;
		//l=0;
		for(var i=0;i<l;i++)
		{
			
			switch(cameras.objects[i].status)
			{
			      case("offline"): preview="http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/files/images/camimg_offline.png";
					break;
				  case("inactive"):preview="http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/files/images/camimg_inactive.png";
				    break;
				  case("unauthorized"): preview="http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/files/images/camimg_unauthorized.png";
					break;
				  case("active"):preview=(cameras.objects[i].preview===undefined)?"http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/files/images/camimg_default.png":
				                   cameras.objects[i].preview.url;
					break;
				  
			}
			 if(cameras.objects[i].name===''){
			    camName="NoName";
			 }else{
				camName=cameras.objects[i].name;
			 }
			 var index=i.toString();
			 
			 //camera="<div onclick='goToVideo(this,"+index+")' style='float:left;width:300px;height:300px;background:blue;margin-left:20px;"+
			 //"margin-top:20px;background-image:url("+preview+");background-repeat:no-repeat;background-size: 181px 131px;background-position:center'>"+
			 //"<div  style='margin-top:100px'>"+camName+"</div> </div>";
			 
			 camera="<div  style='float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
			 "margin-top:20px;background-color:#3788b1'>"+
			 "<img src="+preview+" onclick='goToVideo(this,"+index+")' width='294px' height='210px' style='margin-top:3px;cursor:pointer'></img>"+
			 "<div  class='camName'>"+camName+"</div>"+
			 "<img src='./images/delete_blue_25x25.svg' onclick='showCameraDeletionDialog("+index+")' style='float:right;margin-right:10px;margin-top:20px;color:red;cursor:pointer'></img> </div>";
			camGrid+=camera;
		}
		
		if(l==0)
		{
		      camera="<div  style='float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
			 "margin-top:20px;background-color:#3788b1'>"+
			 "<div style='width:300px;height:200px;background:#3788b1;color: #FFF;font-size:200;cursor:pointer' onclick='addCameraDialog()'>+</div>"+
			 "<div style='width:300px;height:70px;background:#3788b1;color: #FFF;font-size:16;font-family: \"Open Sans\",sans-serif;'>There are no cameras yet.</div>"+
			"</div>";
			camGrid+=camera;
		}
		//set ActionBar and UserName contents
		var actionBarContent="<div id='menulogout' class='actions' style='margin-right:10px'>Logout</div>"+
		"<div  class='actions' style='font-size:xx-large;font-weight: bold;' onclick='addCameraDialog()'>+</div>"+
		"<div id='usernam'>"+(AccpClient.username ? AccpClient.username : "...")+"</div>";
		$('.vxgaccp-cell-content').empty();
		$('.vxgaccp-cell-content').hide();
		
		$('#actionBar').height(50);
		
		//$('#userName').height(50);
		$('#actionBar').html(actionBarContent);
		$('#actionBar').show();
		$('#content').show();
		
		
		camGrid+="</div>";
		
		return camGrid;
	};
	
	
	
	
	
	// login
	this.signinBindButtons = function(){
		$('#loginform').unbind().submit(function(e){
			e.preventDefault();
			
			AccpApi.login($('#username').val(), $('#password').val()).done(function(response){
				AccpApi.svcp_auth_app_url = response.svcp_auth_app_url;
				AccpApi.svcp_auth_web_url = response.svcp_auth_web_url;
				localStorage.setItem("svURL",AccpApi.svcp_auth_web_url);
				AccpApi.profile().done(function(response){
					AccpClient.username = response.username;
					AccpClient.email = response.email;
					AccpClient.firstname = response.first_name;
					AccpClient.lastname = response.last_name;
					//sign in button (form submitting) with request for user s cameras
					AccpApi.cameras().done(function(response){
			
			
			$('#content').html(AccpClient.cameraGrid(response));
			
			AccpClient.cameralistBindButtons();
			
			
			}).fail(function(){alert("fail");});
					
				});
			}).fail(function(){
				$('.error').show();
				$('.error').html('Incorrect username or password');
				
			});
		});
		
		$('.signup').unbind().bind("click", function(e){
			e.preventDefault();
			$('.vxgaccp-cell-content').html(AccpClient.signupForm());
			document.getElementById('username').style.color='#046B90';
			AccpClient.signupBindButtons();
		});
	}
	
	// registration
	this.signupBindButtons = function(){
		$('#signupform').unbind().submit(function(e){
			e.preventDefault();
			$('.error').html("");
			var data = {};
			
			data.username = $('#username').val();
			data.password = $('#password').val();
			data.email = $('#email').val();
			data.firstname = $('#firstname').val();
			data.lastname = $('#lastname').val();
			
			AccpApi.registration(data).done(function(response){
				$('.vxgaccp-cell-content').html(AccpClient.signinForm());
				AccpClient.signinBindButtons();
			}).fail(function(){
				$('.error').show();
				$('.error').html("Fill in username and password fields.");
			});
		});
		
		$('.signin').unbind().bind("click", function(e){
			e.preventDefault();
			$('.vxgaccp-cell-content').html(AccpClient.signinForm());
			AccpClient.signinBindButtons();
		});
	}

	// camera list
	
	this.cameralistBindButtons = function(){
		
		$("#menulogout").unbind().bind("click", function(e){
			AccpApi.logout().fail(function(){alert("fail to log out");});
			$('#actionBar').empty();
			$('#actionBar').hide();
			$('#content').empty();
			$('#content').hide();
			$('.vxgaccp-cell-content').html(AccpClient.signinForm());
			$('.vxgaccp-cell-content').show();
			AccpClient.signinBindButtons();
		});
	}


	this.updateCameraList = function(){
		AccpApi.cameras().done(function(response){
			console.log(response);
		}).fail(function(){
			alert("Could not load camera list");
		});
	}
}

    //go to the camera
     goToVideo=function(el,ind){
		
	    var thisServerUrl=AccpApi.getBaseUrl();
		//var index=parseInt(ind);
		var videoURL=(window.location.host!=="10.20.16.28")?AccpApi.svcp_auth_web_url+"&redirect="+thisServerUrl+"vmanager/":
		"http://54.173.34.172/svcauth/init?iss=http%3A//emagin.videoexpertsgroup.com/openid&vendor=VXG&uatype=web&redirect="+thisServerUrl+"vmanager/";
		window.location.replace(videoURL);

		
		
		
	}
	
	addCameraDialog=function(){
	 	
	  var timezones_options = "";
	  var timezones = moment.tz.names();
	 
	  for(var t in timezones){
					timezones_options += '<option value=' + timezones[t] + '>(UTC' + moment.tz(timezones[t]).format("Z") + ') ' + timezones[t] + '</option>';
				}
		$('#new-camera-timezone').html(timezones_options);
				
         //AccpClient.plusPress=true;	
        $("#shadow").show();
	 
       document.getElementById('addCameraDialog').style.display="block";
		

		
	}
	
	closeAddCamDialog=function(){
	
	   $("#shadow").hide();
	   $("#addCameraDialog").hide();
		
		}
	closeCameraDeletionDialog=function()
	{
		
		$("#shadow").hide();
		$("#deleteCameraDialog").hide();
	}
	showCameraDeletionDialog=function(index)
	{
		AccpClient.DelIndex=index;
		$("#shadow").show();
		$("#deleteCameraDialog").show();
	}
	
	deleteCamera=function(){
		
		closeCameraDeletionDialog();
		var index=parseInt(AccpClient.DelIndex);
		AccpApi.deleteCamera(AccpClient.camerasInfo.objects[index].id);
		
	}
	addCamera=function(){
		
		if($("#new-camera-name").val()!==""&&$("#new-camera-live-stream-link").val()!=="")
		{
		closeAddCamDialog();
		AccpApi.newCamera().done();
		}
		else
		{
			if($("#new-camera-name").val()==="")
			$("#name-error").show();
			else
			if($("#new-camera-live-stream-link").val()==="")
			   $("#url-error").show();
			
			
		}
		
	
	}
	
	showCoords=function (event){
		
     var clickPos = $("#addCameraDialog").offset();
	 
     if(document.getElementById('addCameraDialog').style.display==='block')
	{
		if(event.clientX>clickPos.left&&event.clientX<clickPos.left+$("#addCameraDialog").outerWidth()&&
		   event.clientY>clickPos.top&&event.clientY<clickPos.top+$("#addCameraDialog").outerHeight())
		;
		else
		if(!AccpClient.plusPress)
		;
		
		
	}
	
	//AccpClient.plusPress=false;
    
    
}
	
	
	
	