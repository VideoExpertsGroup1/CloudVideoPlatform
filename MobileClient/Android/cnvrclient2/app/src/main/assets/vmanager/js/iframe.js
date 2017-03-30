var isFramed = false;
try {
  isFramed = window != window.top || document != top.document || self.location != top.location;
} catch (e) {
  isFramed = true;
}
if (isFramed) {
	if(!SkyVR.containsPageParam("mobile")){
		var lnk  = document.createElement('link');
		lnk.rel  = 'stylesheet';
		lnk.type = 'text/css';
		lnk.href = './css/iframe.css';
		lnk.media = 'all';
		document.head.appendChild(lnk);
	}
} else {
	console.log("Is not frame");
}
