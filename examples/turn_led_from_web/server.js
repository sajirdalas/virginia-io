var express = require('express');

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

var intel = require('virginia-io');

var led_pin    = 7;

var options = {
    pins: [{
              number: 7,
              input: false
           }]
    };

intel.galileo.prepareBoard(options);

intel.eventEmitter.on('galileoConfigured', function() {
  app.post('/nodebutton', function(request, response) {
      intel.galileo.writeGpio(led_pin, request.body.value);
  });
});

var server = app.listen(8080);
