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
  var dim = Math.floor((container.width() - 20)/100)*100;
  $(Simulator.canvas.element).attr({
    width: dim,
    height: dim
  });
  Simulator.draw();
});

$(function() {
  $('.instructions').hover(function() {
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

  // Update the output displays each time the slider moves
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

  // The percentage immune and percentage infected must not exceed a total 100%
  $('#infected, #immune').on('input', function() {
    var other = ($(this).attr('id') == 'infected') ? '#immune' : '#infected';
    var other_value = $(other).val();
    var old_value = $(this).data('old') || Simulator.config[$(this).attr('id')];

    // Check if new value and other field's value are more than 100%
    if(parseFloat(other_value, 10) + parseFloat($(this).val(), 10) > 1) {
      var diff = $(this).val() - old_value;
      $(other).val(other_value - diff).trigger('input');
    }
    $(this).data('old', $(this).val());
  });

  // Changing the speed will not regenerate the grid/reset epidemic stats
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

      Simulator.update(data);
    }
  });

  $(Simulator.resultsTable).on('click', '.view-config', function(e) {
    e.preventDefault();
    var round = $(this).parents('tbody').data('round');
    var changed = $(this).prev().data('changed') || [];
    var c = null;

    if(round < Simulator.history.length) {
      c = Simulator.history[round].config;
    } else {
      c = Simulator.config;
    }

    var list = $('<dl></dl>');
    $.each(c, function(k,v) {
      $('<dt></dt>').text($('label[for=' + k + ']').text()).appendTo(list);
      var dd = $('<dd></dd>');
      if(changed.indexOf(k) !== -1) {
        dd.addClass('changed');
      }
      dd.text(v).appendTo(list);
    });
    $('.show-config')
      .children('dl')
        .replaceWith(list)
        .end()
      .fadeIn();
  });

  $('.show-config a').click(function(e) {
    e.preventDefault();
    $('.show-config').fadeOut();
  });
});