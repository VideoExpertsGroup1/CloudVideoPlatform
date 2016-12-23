$( document ).ready(function() {
	AccpApi.base_url = "http://cnvrclient2.videoexpertsgroup.com/";
	if(AccpClient.containsPageParam("demo_logout")){
		localStorage.removeItem('selectedCam');
		AccpApi.logout().done(function(){
			window.location = AccpApi.getCurrentUrl();
		}).fail(function(){
			window.location = AccpApi.getCurrentUrl();
		});
		return;
	}
	
	if(AccpClient.containsPageParam("demo") || AccpApi.isDemo()){
		AccpApi.demo_login().done(function(response){
			window.location = AccpApi.getSvcpAuthWebUrl_WithRedirect({"demo":""});
		});
		return;
	}

	AccpApi.profile().done(function(response){
		console.log(response);
		AccpClient.username = response.username;
		AccpClient.email = response.email;
		AccpClient.firstname = response.first_name;
		AccpClient.lastname = response.last_name;
		//ask server to send the list of cameras back
		AccpApi.cameras().done(function(response){
			$('#content').html(AccpClient.cameraGrid(response));
			AccpClient.cameralistBindButtons();
			updateCamerasLoop();
		});
		//AccpClient.updateCameraList();
	}).fail(function(){
		$('.vxgaccp-cell-content').html(AccpClient.signinForm());
		document.getElementById('username').style.color='#046B90';
		AccpClient.signinBindButtons();	
	});	
});

window.AccpClient = new function (){
	this.videoServerURL="http://54.173.34.172";
	this.thereIsNoCameras=undefined;
	this.svcpLink='';
	this.plusPress=false;
	this.camerasInfo=null;
	this.polingCamerasListInterval = 30000;
	this.DelIndex="";
	this.parsePageParams = function() {
		var loc = window.location.search.slice(1);
		var arr = loc.split("&");
		var result = {};
		var regex = new RegExp("(.*)=([^&#]*)");
		for(var i = 0; i < arr.length; i++){
			if(arr[i].trim() != ""){
				p = regex.exec(arr[i].trim());
				// console.log("results: " + JSON.stringify(p));
				if(p == null){
					result[decodeURIComponent(arr[i].trim().replace(/\+/g, " "))] = '';
				}else{
					result[decodeURIComponent(p[1].replace(/\+/g, " "))] = decodeURIComponent(p[2].replace(/\+/g, " "));
				};
			};
		};
		console.log(JSON.stringify(result));
		return result;
	};
	this.pageParams = this.parsePageParams();
	this.containsPageParam = function(name){
		return (typeof this.pageParams[name] !== "undefined");
	};
	this.canShowGoogleAuthButton = function(){
		return window.location.host == "54.173.34.172:12050"
			|| window.location.host == "cnvrclient2.videoexpertsgroup.com"
			|| window.location.host == "localhost";
	}
	
	this.signinForm = function(){
		var result = ""
		+ "<h2>Video Experts Group<\/h2>"
		+ "<p class=\"subtitle\">Cloud Video Platform<\/p>"
		result += "<div class=\"form-wrapper\">";
		result += "	<form id=\"loginform\">";
		result += "		<input placeholder=\"Username\" id=\"username\" maxlength=\"254\" onfocus='$(\".error\").hide()' name=\"username\" type=\"text\"><br>";
		result += "		<input placeholder='Password' id=\"password\" name=\"password\" onfocus='$(\".error\").hide()' type=\"password\"><br>";
		result += "		<div class=\"error\" id='loginError'><\/div>";
		result += "		<input value=\"Sign In\" type='submit'>";
		result += "	</form>";

		// only for debug server
		if(this.canShowGoogleAuthButton()){
			result += "	   	<div class='social-signin'>"
			+ " <div class='social-caption'>Or:</div>"
			+ " <div class='social-gplus'></div>"
			+ "		</div>";
		}
		result += "	<button class='signup'>Sign Up</button><br> " +
		// "<a id=\"forgot-password\" href=\"#\">Forgot your password ?</a>"+
		'<div id="see-demo">See Demo</div>';
		result += "</div>";
		result += "<div class='row-content-powered-by'>";
		result += "<div class='powered-by'>Powered by VXG Cloud Platform</div>";
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
	this.getPreview=function(status,camera){
		var preview='';
		switch(status)
			{
			      case("offline"): preview="./vmanager/files/images/camimg_offline.png";
					break;
				  case("inactive"):preview="./vmanager/files/images/camimg_inactive.png";
				    break;
				  case("unauthorized"): preview="./vmanager/files/images/camimg_unauthorized.png";
					break;
				  case("active"):preview=(camera.preview===undefined)?"./vmanager/files/images/camimg_default.png":camera.preview.url;
					break;
				  case("not_started"):preview=(camera.preview===undefined)?"./vmanager/files/images/camimg_inactive.png":camera.preview.url;
					break;
			}
		
		return preview;
		
		
		
	};
	this.getCamName=function(name){
		     var camName='';
			 if(name===''){
			    camName="NoName";
			 }else{
				camName=name;
			 }
			 return camName;
	};
	this.appendBigPlusDivToGrid=function(){
		
		  var Grid=document.getElementById("camGrid");
		  var newDiv1=document.createElement('div');
		  newDiv1.id='bigPlusDiv';
		  
		 newDiv1.setAttribute('style',"float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
			"margin-top:20px;background-color:#3788b1");
		  
		  //"float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
			// "margin-top:20px;background-color:#3788b1";
		  var child1=document.createElement('div');
		  child1.setAttribute('style','width:300px;height:200px;background:#3788b1;color: #FFF;font-size:200;cursor:pointer');
		  child1.setAttribute('onclick','addCameraDialog(false)');
		  child1.appendChild(document.createTextNode("+"));
		  var child2=document.createElement('div');
		  child2.setAttribute('style','width:300px;height:70px;background:#3788b1;color: #FFF;font-size:16;font-family: \"Open Sans\",sans-serif;');
		  child2.appendChild(document.createTextNode("There are no cameras yet."));
		  newDiv1.appendChild(child1);
		  newDiv1.appendChild(child2);
		  Grid.appendChild(newDiv1);
	};
    this.clearGrid=function(){
		
		  var Grid=document.getElementById("camGrid");
		  document.getElementById("content").removeChild(Grid);
		  Grid=document.createElement('div');
		  Grid.className="camGrid";
		  Grid.id='camGrid';
		  document.getElementById("content").appendChild(Grid);
		  
		
	} 
	this.cameraGrid = function(cameras){
		var camera="";
		this.camerasInfo=cameras;
		var Grid=document.getElementById('camGrid');
		var bigPlusDiv=document.getElementById('bigPlusDiv');
	
		var preview="./vmanager/files/images/camimg_unauthorized.png";
		var l=cameras.objects.length;
		
		var camName='';
		if(Grid===null){
			var camGrid="<div class='camGrid' id='camGrid'>";
	
			//l=0;
			for(var i=0;i<l;i++){
				preview=this.getPreview(cameras.objects[i].status,cameras.objects[i]);
				camName=this.getCamName(cameras.objects[i].name);
				var index=i.toString();
				camera='<div  class="camera-item">'+
				"<img class='camera-preview' src=\"./vmanager/images/transparent_2x2.png\" onload='this.src=\""+preview+"\";this.onload=\"\" ' onerror='this.src=\"./images/camimg_default.png\";' onclick='AccpClient.openVManager(this,"+index+")' width='294px' height='210px'/>"+
				"<div  class='camName'>"+camName+"</div>"+
				"<img src='./images/delete_blue_25x25.svg' onclick='showCameraDeletionDialog("+index+")' style='float:right;margin-right:10px;margin-top:20px;color:red;cursor:pointer'></img> </div>";
				camGrid+=camera;
			}
		
			if(l==0){
				  camera="<div id='bigPlusDiv' style='float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
				 "margin-top:20px;background-color:#3788b1'>"+
				 "<div  style='width:300px;height:200px;background:#3788b1;color: #FFF;font-size:200;cursor:pointer' onclick='addCameraDialog()'>+</div>"+
				 "<div style='width:300px;height:70px;background:#3788b1;color: #FFF;font-size:16;font-family: \"Open Sans\",sans-serif;'>There are no cameras yet.</div>"+
				"</div>";
				camGrid+=camera;
				this.thereIsNoCameras=true;
			}
		//set ActionBar and UserName contents
		var actionBarContent="<div id='menulogout' class='actions' style='margin-right:10px'>Logout</div>"+
		"<div  class='actions' style='font-size:xx-large;font-weight: bold;' onclick='addCameraDialog(true)'>+</div>"+
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
		}
		else
		{
			if(l!=0)
			{
			if(bigPlusDiv!==null)Grid.removeChild(bigPlusDiv);
			var count=Grid.childElementCount;
	        var dif =l-count;
			
			if(dif>0)
			{
			this.thereIsNoCameras=false;
			for(var j=0;j<dif;j++)
			{
			 var newDiv=document.createElement('div');
			 newDiv.setAttribute("style","float:left;width:300px;height:270px;background:#3788b1;margin-left:20px;"+
			 "margin-top:20px;background-color:#3788b1");
			 var image=document.createElement('img');
			 image.setAttribute('style','width:294px;height:210px;margin-top:3px;cursor:pointer');
			 var name=document.createElement('div');
			 var basketImage=document.createElement('img');
			 basketImage.setAttribute('style','float:right;margin-right:10px;margin-top:20px;cursor:pointer');
			 basketImage.src='./images/delete_blue_25x25.svg';
			 
			 name.className='camName';
			 newDiv.appendChild(image);
			 newDiv.appendChild(name);
			 newDiv.appendChild(basketImage);
			 Grid.appendChild(newDiv);
			}
			}
			else if(dif<0)
			{
			
			this.thereIsNoCameras=false;	
			for(var p=0;p>dif;p--)	
			Grid.removeChild(Grid.childNodes[Grid.childNodes.length-1]);
			
			}
			
		//l=0;
		for(var k=0;k<l;k++)
		{
			
			preview=this.getPreview(cameras.objects[k].status,cameras.objects[k]);
			
			camName=this.getCamName(cameras.objects[k].name);
			 
			 //var ind=k.toString();
			 var ind=k.toString();
			 
			 var cam=Grid.childNodes[k];
			 cam.style.display='inline';
			 var camchild1=cam.childNodes[0];
			 camchild1.src=preview;
			 //if(cam.childNodes[1].childNodes.length>0)
			 //cam.childNodes[1].removeChild(cam.childNodes[1].childNodes[0]);
			 cam.childNodes[0].setAttribute('onclick','AccpClient.openVManager(this,'+ind+')');
			 cam.childNodes[1].innerHTML="";
			 cam.childNodes[1].appendChild(document.createTextNode(camName));
			 cam.childNodes[2].setAttribute('onclick','showCameraDeletionDialog('+ind+')');
			
		}
			}
			else if(l==0&& document.getElementById('addCameraDialog').style.display!="block")
		{
		  this.clearGrid();
		  this.appendBigPlusDivToGrid();
		  this.thereIsNoCameras=true;
		  
		}

		}
	};
	// login
	this.signinBindButtons = function(){
		$('#loginform').unbind().submit(function(e){
			e.preventDefault();
			AccpApi.login($('#username').val(), $('#password').val()).done(function(response){
				if ("next" in AccpClient.pageParams) {
					window.location.replace(window.location.protocol + '//' + window.location.host + AccpClient.pageParams['next'])
					return;
				}
				AccpApi.profile().done(function(response){
					AccpClient.username = response.username;
					AccpClient.email = response.email;
					AccpClient.firstname = response.first_name;
					AccpClient.lastname = response.last_name;
					//sign in button (form submitting) with request for user s cameras
					AccpApi.cameras().done(function(response){
						$('#content').html(AccpClient.cameraGrid(response));
						AccpClient.cameralistBindButtons();
						updateCamerasLoop();
					});
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
		
		$('.social-gplus').unbind().bind('click', function(e){
			window.location = AccpApi.getSvcpAuthWebUrl_WithRedirect_GPLUS();
		});
		
		$('#see-demo').unbind().bind('click', function(){
			AccpApi.demo_login().done(function(response){
				window.location = AccpApi.getSvcpAuthWebUrl_WithRedirect({"demo":""});
			});
		})
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
			stopUpdateCamerasLoop();
			AccpApi.logout();
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

AccpClient.openVManager = function(el,ind){
	var index=parseInt(ind);
	var selectedCam = AccpClient.camerasInfo.objects[index];
	if(AccpClient.camerasInfo.objects[index]===null) {alert("null"); return}
	var camid = selectedCam['svcp_id'];
	window.location = AccpApi.getSvcpAuthWebUrl_WithRedirect({"camid":camid});
}
     
	
	addCameraDialog=function(isThereAnyCamera){
		document.getElementById("new-camera-timezone").style.width='330px';
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
		$('#url-error').hide();
		$('#name-error').hide();
		$("#shadow").hide();
		$("#addCameraDialog").hide();
	}
	closeCameraDeletionDialog=function(){
		
		$("#shadow").hide();
		$("#deleteCameraDialog").hide();
	}
	showCameraDeletionDialog=function(index){
		AccpClient.DelIndex=index;
		$("#shadow").show();
		$("#deleteCameraDialog").show();
	}
	deleteCamera=function(){
		closeCameraDeletionDialog();
		var index=parseInt(AccpClient.DelIndex);
		document.getElementById('camGrid').childNodes[index].style.display='none';
		if(AccpClient.camerasInfo.objects.length==1){
			AccpClient.clearGrid();
			AccpClient.appendBigPlusDivToGrid();
		}
		AccpApi.cameraDelete(AccpClient.camerasInfo.objects[index].id);
		
	}
	addCamera=function(){
		if($("#new-camera-name").val()!==""&&$("#new-camera-live-stream-link").val()!==""){
			var data = {};
			data.name = $('#new-camera-name').val();
			data.url = $('#new-camera-live-stream-link').val();
			data.login = $('#new-camera-live-stream-link-login').val();
			data.password = $('#new-camera-live-stream-link-password').val();
			data.timezone = $('#new-camera-timezone').val();
			AccpApi.cameraCreate(data).done(function(){
				closeAddCamDialog();
			}).fail(function(){
				closeAddCamDialog();
			});
		}else{
			if($("#new-camera-name").val()==="")
				$("#name-error").show();
			else if($("#new-camera-live-stream-link").val()==="")
				$("#url-error").show();
		}
	}
	
	showCoords=function (event){
		
	var clickPos = $("#addCameraDialog").offset();

	if(document.getElementById('addCameraDialog').style.display==='block'){
		if(event.clientX>clickPos.left&&event.clientX<clickPos.left+$("#addCameraDialog").outerWidth()&&
		   event.clientY>clickPos.top&&event.clientY<clickPos.top+$("#addCameraDialog").outerHeight()){
			// TODO ?
		}else if(!AccpClient.plusPress){
			// TODO ?
		}
	}
	
	//AccpClient.plusPress=false;
}

var camerasLoop;
function updateCamerasLoop(){
	function updateCameras(){
		AccpApi.cameras().done(function(response){
			console.log("Update cameras list");
			AccpClient.cameraGrid(response); 
		}).fail(function(){
			console.error("Could not get cameras list");
		});
	}
	updateCameras();
	camerasLoop = setTimeout(updateCamerasLoop,AccpClient.polingCamerasListInterval);
}
	
function stopUpdateCamerasLoop() {
    clearTimeout(camerasLoop);
}
