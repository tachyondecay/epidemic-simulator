var Simulator = {

  /*
  The following objects are the initial configuration variables. They will 
  change as the user adjusts the simulation.
   */
  config: {
    grid_size: 20,           // Grid size
    pop: 100,           // Initial population
    infected: 0.5,       // Initial percentage infected
    immune: 0.1,           // Initial percentage immune
    duration: 6,        // How many days the disease lasts
    infects_after: 0,          // How many days until person is infectious
    immune_after: true,     // Boolean: Do people become immune if they survive?
    behaviour: 0,        // How do sick people behave? 0: normal, 1: stationary, 2: isolated
    prob_death: 0.5,         // Probability someone will die each day
    prob_infection: 0.5,     // Probability someone will become infected after contact
    prob_static: 0.2,         // Probability someone will remain stationary
    speed: 1              // Simulation speed
  },
  canvas: {
    element: '#canvas',
    colours: {
      grid: '#aaa',
      text: '#000',
      normal: '#20B2AA',
      immune: '#608341',
      infected: '#A62A2A',
    },
    fontFamily: 'Oswald, sans-serif'
  },
  resultsTable: '#results',
  history: [],
  currentEpidemic: null,
  pastEpidemics: [],
  mean: {
    day: 0,
    dead: 0,
    healthy: 0,
    recovered: 0
  },
  sum_diffs: {
    day: 0,
    dead: 0,
    healthy: 0,
    recovered: 0
  },

  controls: {
    clear: {
      element: '#clear',
      disabled: true,
      callback: function() {
        Simulator.reset();
        $('tbody:not(:last)', Simulator.resultsTable).remove();
        $('tbody', Simulator.resultsTable)
          .find('tr.epidemic')
            .remove()
            .end()
          .find('tr.stats td')
            .text('');
        Simulator.toggleControls([], ['clear']);
      }
    },

    generate: {
      element: '#new',
      disabled: false,
      callback: function() {
        Simulator.toggleControls(['run']);
        Simulator.init();
      }
    },
    pause: {
      element: '#pause',
      disabled: true,
      callback: function() {
        Simulator.toggleControls(['generate', 'run', 'config'], ['pause']);
        if(Simulator.process) {
          window.clearInterval(Simulator.process);
          console.log('Simulation paused at ' + Simulator.currentEpidemic.day + ' days.');
        }
      }
    },
    run: {
      element: '#run',
      disabled: false,
      callback: function() {
        Simulator.toggleControls(['pause'], ['generate', 'run', 'config']);
        Simulator.run();
      }
    },
    config: {
      element: '#config :input',
      disabled: false
    }
  },

  /*
    Methods
   */
  
  init: function() {
    this.currentEpidemic = new Epidemic();
    Simulator.legend(25);
    Simulator.draw();
  },

  draw: function(epidemic, canvas) {
    epidemic = epidemic || this.currentEpidemic;
    canvas = canvas || this.canvas;
    var c = $(canvas.element);

    $('.' + c.data('count') +' span').text(epidemic.day);

    var w = c.attr('width');
    var cell_width = Math.floor(w / epidemic.grid.size);
    var new_width = (cell_width)*epidemic.grid.size;
    c.attr({
      'width': new_width,
      'height': new_width
    });

    c.clearCanvas();
    for (var x = 0; x <= w; x += cell_width) {
      c.drawLine({
        strokeStyle: canvas.colours.grid,
        strokeWidth: 1,
        x1: x, y1: 0,
        x2: x, y2: w
      })
      .drawLine({
        strokeStyle: canvas.colours.grid,
        strokeWidth: 1,
        x1: 0, y1: x,
        x2: w, y2: x
      });
    }

    epidemic.grid.forEach(function(villager, v) {
      if(villager) {
        villager.draw(canvas, cell_width);
      }
    });
  },

  legend: function(size) {
    var self = this;
    $('.legend dt').each(function() {
      var c = $('<canvas width="' + size + '" height="' + size + '"></canvas>');
      var status = $(this).data('status');

      c.drawEllipse({
        fillStyle: self.canvas.colours[(status=='quarantined') ? 'infected' : status],
        width: size, height: size,
        x: size/2, y: size/2
      });

      if(status == 'quarantined') {
        c.drawText({
          fillStyle: self.canvas.colours.text,
          fontStyle: 400,
          fontFamily: self.canvas.fontFamily,
          fontSize: size*0.65,
          x: size/2, y: size/2,
          text: 'Q'
        });
      }

      $(this).html(c);
    });
  },

  log: function(e) {
    var self = this;
    self.pastEpidemics.push(e);
    var rounds = self.history.length;
    var n = self.pastEpidemics.length;
    var stats = ['day', 'dead', 'healthy', 'recovered'];
    var rRow = $('<tr class="epidemic">');
    var rTable = $('tbody', self.resultsTable).last();

    rRow.append('<th scope="row">Epidemic ' + n + '</th>');
    // Include epidemic in the stats
    $.each(stats, function(i,s) {
      // Include this epidemic's stat in the overall stats
      var old_mean = self.mean[s];
      self.mean[s] = old_mean + (e[s] - old_mean)/n;
      self.sum_diffs[s] = self.sum_diffs[s] + (e[s] - old_mean)*(e[s] - self.mean[s]);

      $('.mean', rTable).find('.' + s).text(Math.round(self.mean[s]*100)/100);
      $('.std_dev', rTable).find('.' + s).text(Math.round(Math.sqrt(self.sum_diffs[s]/n)*100)/100);
      $('<td>').addClass(s).text(e[s]).appendTo(rRow);
    });

    rRow.insertBefore($('.stats', rTable).eq(0));
    Simulator.toggleControls(['clear']);
  },

  reset: function() {
    var self = this;
    self.pastEpidemics = [];
    $.each(self.mean, function(k,v) {
      self.mean[k] = 0;
    });
    $.each(self.sum_diffs, function(k,v) {
      self.sum_diffs[k] = 0;
    });
  },

  run: function(e) {
    var self = this;
    e = e || this.currentEpidemic;
    this.draw(e);
    this.process = window.setInterval(function() {
        e.newDay();
        self.draw(e);
        console.log(e.day + ": " + e.dead + " dead, " + e.infected, " infected, " + e.immune + " immune, " + e.recovered + " recovered, " + e.healthy + " never sick.");
        if(e.dead == self.config.pop || e.infected === 0) {
          window.clearInterval(self.process);
          self.log(e);
          self.toggleControls(['generate', 'config'], ['pause']);
        }
      }, self.config.speed*1000);
  },

  toggleControls: function(enable, disable) {
    var self = this;
    enable = enable || [];
    disable = disable || [];
    $.each(self.controls, function(i,v) {
      if(enable.indexOf(i) !== -1) {
        $(v.element).prop('disabled', false);
      } else if(disable.indexOf(i) !== -1) {
        $(v.element).prop('disabled', true);
      }
    });
  },

  update: function(new_config) {
    var self = this;

    // Check if we actually ran any trials since the last config change.
    if(self.pastEpidemics.length > 0) {
      // Store the old state
      self.history.push({
        config: $.extend({}, self.config),
        epidemics: self.pastEpidemics,
      });

      // Clean slate, new config
      self.reset();

      $('tbody', self.resultsTable)
        .last()
          .clone()
            .data('round', self.history.length)
            .find('tr.epidemic')
              .remove()
              .end()
            .find('.stats td')
              .empty()
              .end()
            .appendTo($(self.resultsTable));
    }

    // Diff
    var comp = (self.history.length > 0) ? self.history.slice(-1)[0].config : self.defaults;
    console.log(comp);
    var changed = [];
    $.each(new_config, function(k,v) {
      if(k != 'speed' && v != comp[k]) {
        changed.push(k);
      }
    });

    var changelog = 'Changed ';
    // If we changed one value, show the change directly.
    if(changed.length == 1) {
      changelog += '<strong>' + $('label[for=' + changed[0] + ']').text() + '</strong> from ' + comp[changed[0]] + ' to ' + new_config[changed[0]] + '.';
    } else {
      changelog += changed.length.toString() + ' variables.';
    }

    self.config = $.extend(self.config, new_config);

    $('tbody', self.resultsTable)
      .last()
        .find('.divider span')
          .html(changelog)
          .data('changed', changed);

    if($('.show-config').is(':visible')) {
      $('tbody', self.resultsTable).last().find('.view-config').click();
    }

    self.toggleControls(['run']);
    self.init();
  },

  validate: function(new_config) {
    var errors = {};
    
    if(new_config.grid_size < 2 || new_config.grid_size > 50) {
      errors.grid_size = 'Grid size must be between 2 and 50.';
    }
    if(new_config.pop < 2 || new_config.pop > 1000) {
      errors.pop = 'Population must be between 2 and 1000.';
    }
    if(new_config.pop > Math.pow(new_config.grid_size,2)) {
      errors.pop = 'Your village is overpopulated. Is that why you’re unleashing a deadly disease? You monster.';
    }
    if(new_config.duration < 1 || new_config.duration > 15) {
      new_config.duration = Simulator.config.duration;
    }
    if(new_config.infects_after < 0 || new_config.infects_after > 14) {
      new_config.infects_after = Simulator.config.infects_after;
    }

    new_config.immune_after = (new_config.immune_after === '1') ? true : false;
    if(['0','1','2'].indexOf(new_config.behaviour) === -1) {
      new_config.behaviour = Simulator.config.behaviour;
    }

    var frac = ['infected', 'immune', 'prob_death', 'prob_infection', 'prob_static'];
    $.each(frac, function(i,v) {
      if (new_config[v] > 1 || new_config[v] < 0) {
        new_config[v] = Simulator.config[v];
      }
    });

    return errors;
  }
};

var Epidemic = function() {
  this.day = 0;
  this.grid = new Grid(Simulator.config.grid_size);
  this.grid.populate();

  this.dead = 0;
  this.infected = Math.floor(Simulator.config.infected * Simulator.config.pop);
  this.immune = Math.floor(Simulator.config.immune * Simulator.config.pop);
  this.healthy = Simulator.config.pop - this.infected;
  this.recovered = 0;
};

Epidemic.prototype.newDay = function() {
  this.day++;

  var moved = [];
  this.grid.forEach(function(villager) {
    // Check if the villager has moved already
    if(moved.indexOf(villager) == -1) {
      if (villager.status == 'infected') {
        villager.duration++;

        // If the illness has run its course, so the villager dies or recovers.
        if (villager.duration > Simulator.config.duration) {
          if(Math.random() <= Simulator.config.prob_death) {
            // Bring out your dead!
            this.grid.set(villager.position, undefined);
            this.dead++;
            this.infected--;
            return;
          } else {
            // The villager lives!
            villager.cure(this);
          }
        } else if(Simulator.config.behaviour > 0) {
          // This simulator does not let sick villagers move.
          return;
        }
      }
  
      // Move villager, if possible and if they want to move.
      villager.move(this.grid);
  
      // Check if the villager has become infected
      if (villager.status == 'normal') {
        var neighbours = this.grid.look(villager.position, 'occupied');
        for(var i = 0; i < neighbours.length; i++) {
          var n = this.grid.get(neighbours[i]);
          if(n.status == 'infected' && Simulator.config.behaviour != 2 && n.duration >= Simulator.config.infects_after) {
            if(Math.random() <= Simulator.config.prob_infection) {
              villager.infect(this);
              break;  // Villager can only be infected once even if exposed multiple times
            }
          }
        }
      }
  
      // Record that this villager has moved
      moved.push(villager);
    }
  }, this);
};

var Grid = function(size) {
  this.size = size;
  this.space = new Array(size*size);

  this.directions = [
    new Vector(-1, -1),
    new Vector(-1, 0),
    new Vector(-1, 1),
    new Vector(0, -1),
    new Vector(0, 1),
    new Vector(1, -1),
    new Vector(1, 0),
    new Vector(1, 1),
  ];
};

Grid.prototype.isInside = function(vector) {
  return vector.x >= 0 && vector.x < this.size &&
         vector.y >= 0 && vector.y < this.size;
};

Grid.prototype.get = function(vector) {
  return this.space[vector.x + this.size * vector.y];
};

Grid.prototype.set = function(vector, value) {
  this.space[vector.x + this.size * vector.y] = value;
};

Grid.prototype.forEach = function(f, context, allowEmpty) {
  for (var y = 0; y < this.size; y++) {
    for (var x = 0; x < this.size; x++) {
      var value = this.space[x + y * this.size];
      if (allowEmpty || value !== undefined) {
        f.call(context, value, new Vector(x,y));
      }
    }
  }
};

Grid.prototype.look = function(v, status) {
  var surroundings = [];
  for (var i = 0; i < this.directions.length; i++) {
    var direction = v.plus(this.directions[i]);
    if (this.isInside(direction)) {
      var occupant = this.get(direction);

      // Check if we only want empty or occupied spaces
      if(
        (status == 'empty' && occupant !== undefined) ||
        (status == 'occupied' && occupant === undefined)
      ) {
        continue;
      }
      surroundings.push(direction);
    }
  }
  return surroundings;
};

// Populate the grid with villagers
Grid.prototype.populate = function() {
  if(Simulator.config.pop > Math.pow(Simulator.config.grid_size,2)) {
    throw new Error("Your village is overpopulated.");
  }

  var num_infected = Math.floor(Simulator.config.pop * Simulator.config.infected);
  var num_immune = Math.floor(Simulator.config.pop * Simulator.config.immune);
  for (var i = 0; i < Simulator.config.pop; i++) {
    // Create a new villager, and check if we have hit our max infected/immune
    var newbie = new Villager();
    if (num_infected > 0) {
      newbie.infect();
      num_infected--;
    } else if(num_immune > 0) {
      newbie.status = 'immune';
      num_immune--;
    }

    // Find a random, unoccupied space and place the villager there.
    while(true) {
      var v = Vector.random(Simulator.config.grid_size);
      if (!this.get(v)) {
        newbie.position = v;
        this.set(v, newbie);
        break;
      }
    }
  }
};

var Vector = function(x, y) {
  this.x = x;
  this.y = y;
};

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.random = function(xmax, ymax) {
  ymax = ymax || xmax;
  var x = Math.floor(Math.random() * xmax);
  var y = Math.floor(Math.random() * ymax);
  return new Vector(x, y);
};

var Villager = function(status, position) {
  this.status = status || 'normal';
  this.position = position || null;
  this.duration = 0;
  this.times_infected = 0;
};

Villager.prototype.cure = function(epidemic) {
  this.status = (Simulator.config.immune_after) ? 'immune' : 'normal';
  this.duration = 0;

  if(epidemic) {
    epidemic.recovered++;
    epidemic.infected--;

    if (this.status == 'immune') {
      epidemic.immune++;
    }
  }
};

Villager.prototype.draw = function(canvas, cell_width) {
  // var char = {
  //   'normal': 'O',
  //   'infected': '/',
  //   'immune': 'N',
  //   'isolated': 'Q'
  // };
  // if (this.status == 'infected' && Simulator.config.behaviour == 2) {
  //   return char.isolated;
  // } else {
  //   return char[this.status];
  // }
  // console.log(this.position);
  // console.log(cell_width);
  var canvas_pos = [
    this.position.x * cell_width + (cell_width/2),
    this.position.y * cell_width + (cell_width/2)
  ];

  $(canvas.element).drawEllipse({
    fillStyle: canvas.colours[this.status],
    x: canvas_pos[0], y: canvas_pos[1],
    width: cell_width, height: cell_width
  });

  if(this.status == 'infected' && Simulator.config.behaviour == 2) {
    $(canvas.element).drawText({
      fillStyle: canvas.colours.text,
      fontStyle: 400,
      fontSize: cell_width*0.65,
      fontFamily: canvas.fontFamily,
      text: 'Q',
      x: canvas_pos[0], y: canvas_pos[1]
    });
  }
};

Villager.prototype.infect = function(epidemic) {
  this.status = 'infected';
  this.duration = 0;
  this.times_infected++;

  if(epidemic) {
    epidemic.infected++;
    if(this.times_infected == 1) {
      epidemic.healthy--;
    }
  }
};

Villager.prototype.move = function(grid) {
  if(Math.random() > Simulator.config.prob_static) {
    // Find all empty spaces around the villager
    var empty = grid.look(this.position, 'empty');

    // If the villager has one or more valid directions for movement, 
    // select one at random and move to that space.
    if (empty.length > 0) {
      var destination = empty[Math.floor(Math.random() * empty.length)];
      grid.set(this.position, undefined);
      grid.set(destination, this);
      this.position = destination;
    }
  }
};
