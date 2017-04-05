$(document).ready(function () {
    $.tpl = {}
    $('script.template').each(function(index) {
      $.tpl[$(this).attr('id')] = _.template($(this).html());
      $(this).remove();
    });
    
});
