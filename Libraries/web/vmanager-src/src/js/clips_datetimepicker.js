
function clips_datetimepicker(elemid, elemidpicker){
	if($('#' + elemidpicker).is(":visible")){
		$('#' + elemidpicker).hide();
	}else{
		var top = 185 + $('#' + elemid).position().top + $('#' + elemid).height();
		
		$('#' + elemidpicker).css({'top': -1*top + 'px'});

		var tmpHtml = '';
		$('#' + elemidpicker).html($('#clipmaker-input-template-datetimepicker').html());
		var month = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-month');
		var days = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-day');
		var year = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-year');
		var hours = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-hours');
		var minutes = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-minutes');
		var seconds = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-seconds');
		
		tmpHtml = '';
		for(var i = 1; i < 32; i++){
			val = ("00" + i).slice(-2);
			tmpHtml += '<option value="' + val + '">' + val + '</options>';
		}
		days.html(tmpHtml);
		
		tmpHtml = '';
		for(var i = 0; i < 24; i++){
			val = ("00" + i).slice(-2);
			tmpHtml += '<option value="' + val + '">' + val + '</options>';
		}
		hours.html(tmpHtml);
	
		tmpHtml = '';
		for(var i = 0; i < 60; i++){
			val = ("00" + i).slice(-2);
			tmpHtml += '<option value="' + val + '">' + val + '</options>';
		}
		seconds.html(tmpHtml);
		minutes.html(tmpHtml);
		
		re = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/i
		found = $('#' + elemid).val().match(re);
		if(found){
			month.val(found[1]);
			days.val(found[2]);
			year.val(found[3]);
			hours.val(found[4]);
			minutes.val(found[5]);
			seconds.val(found[6]);
		}

		var apply = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-apply');
		var cancel = $('#' + elemidpicker + ' .clipmaker-datetimeeditor-cancel');
	
		apply.unbind().bind('click', function(){
			var value = month.val();
			value += '/' + days.val() + '/' + year.val();
			value += ' ' + hours.val() + ':' + minutes.val() + ':' + seconds.val();
			$('#' + elemid).val(value);
			$('#' + elemidpicker).hide();
		});
		
		cancel.unbind().bind('click', function(){
			$('#' + elemidpicker).hide();
		});
	
		$('#' + elemidpicker).show();
	}
}
