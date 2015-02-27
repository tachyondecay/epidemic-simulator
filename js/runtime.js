function inputError(control, message) {
  control.addClass('error');
  messageDiv = $('.message').filter(function() {
    return $(this).data('for') == control.attr('id');
  });

  if(messageDiv.length === 0) {
    messageDiv = $('<div class="message"/>').data('for', control.attr('id')).hide().insertAfter(control.parents('.form-input'));
  }

  if(message != messageDiv.text()) {
    messageDiv
      .text(message)
      .hide()
      .fadeIn('slow');
  }
}

function loadConfig() {
  $.each(Object.keys(Simulator.config), function(i,k) {
    $('#' + k).val(Simulator.config[k]);
  });
  $('input[name=immune_after]').prop('checked', function() {
    return ($(this).val() == Simulator.config.immune_after);
  });
}

$(window).resize(function() {
  var container = $('.canvas-container');
  // var dim = Math.floor((Math.min(container.height(), container.width()) - 20)/100)*100;
  var dim = Math.floor((container.width() - 20)/100)*100;
  $(Simulator.canvas.element).attr({
    width: dim,
    height: dim
  });
  Simulator.draw();
});

$(function() {
  $('.instructions').click(function() {
    $(this).toggleClass('hovered');
  })
  .hover(function() {
    $(window).resize();
  });

  $.each(Simulator.controls, function(i,v) {
    $(v.element).prop('disabled', v.disabled);
    if(v.callback) {
      $(v.element).bind('click', v.callback);
    }
  });

  Simulator.defaults = $.extend({}, Simulator.config);
  Simulator.init();
  loadConfig();
  $(window).trigger('resize');

  $('input[type=range]').on('input', function() {
    var t = $(this).val();
    var o = $(this).data('output');
    if(o == '%') {
      t = Math.floor(t*100) + '%';
    } else if(o) {
      o = o.replace('?s', (t == 1) ? '' : 's');
      t = o.replace('%o', t);
    }
    $('output[for=' + $(this).attr('id') + ']').text(t);
  }).trigger('input');

  $('#speed').change(function(e) {
    e.stopImmediatePropagation();
    v = $(this).val();
    if(v > 0 && v <= 3) {
      Simulator.config.speed = v;
    }
  });

  $('#config').change(function() {
    var data = {};
    $.each($(this).serializeArray(), function(i,item) {
      data[item.name] = item.value;
    });

    $('.error').removeClass('error');
    if(data.prob_death == 1) {
      inputError($('[name=prob_death]'), 'You monster.');
    }
    var errors = Simulator.validate(data);
    if(Object.keys(errors).length > 0) {
      $.each(errors, function(name, value) {
        inputError($('[name=' + name + ']'), value);
      });
      Simulator.toggleControls([], ['run']);
    } else {
      $('.message').each(function() {
        var field = $(this).data('for');
        console.log(field);
        if(!$('#' + field).hasClass('error')) {
          $(this).slideUp(300, function() { $(this).remove(); });
        }
      });
      Simulator.config = $.extend(Simulator.config, data);
      Simulator.toggleControls(['run']);
      Simulator.init();
    }
  });
});