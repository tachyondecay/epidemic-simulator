function inputError(control, message) {
  control.addClass('error');
  messageDiv = $('<span class="message"/>');
  messageDiv.text(message).appendTo(control.parent());
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
  $('canvas').attr({
    width: dim,
    height: dim
  });
  Simulator.draw();
});

$(function() {
  $.each(Simulator.controls, function(i,v) {
    $(v.element).prop('disabled', v.disabled);
    if(v.callback) {
      $(v.element).bind('click', v.callback);
    }
  });


  Simulator.default_config = $.extend({}, Simulator.config);
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

  $('#config').change(function() {
    var data = {};
    $.each($(this).serializeArray(), function(i,item) {
      data[item.name] = item.value;
    });

    $('.error').removeClass('error');
    $('.message').remove();
    var errors = Simulator.validate(data);
    if(Object.keys(errors).length > 0) {
      $.each(errors, function(name, value) {
        inputError($('[name=' + name + ']'), value);
      });
      Simulator.toggleControls([], ['run']);
    } else {
      if(data.prob_death == 1) {
        inputError($('[name=prob_death]'), 'You monster.');
      }
      Simulator.config = $.extend(Simulator.config, data);
      console.log(Simulator.config);
      console.log(Simulator.default_config);
      Simulator.toggleControls(['run']);
      Simulator.init();
    }
  });
});