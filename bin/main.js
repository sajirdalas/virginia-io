var test = require("../lib/virginia");

var led_gpio = 0; 

var options = {
    pins: [
        {
            number: 0,
            input: false
        },
        {
            number: 1,
            input: false
        }
        ]
    };

test.galileo.prepareBoard(options);

test.eventEmitter.on('galileoConfigured', function(){
	test.galileo.writeGpio(led_gpio, 1);

	setInterval(function(){
		 	test.galileo.writeGpio(led_gpio, 0);
	},2000);
}, false);
 

// 		test.galileo.writeGpio(led_gpio, 1);

// 		 setInterval(function(){
// 		 	test.galileo.writeGpio(led_gpio, 0);
// 		 },2000);
