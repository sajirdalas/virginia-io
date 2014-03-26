var virginia = require("../lib/virginia");

var led_gpio = virginia.digitalMapping[0]; 
var button = virginia.digitalMapping[3]; 

var options = {
    pins: [
        {
            digital: true,
            number: "0",
            input: true,
            button: false
        },
        {
            digital: true,
            number: "1",
            input: false
        },
        {
            digital: true,
            number: "3",
            input: true,
            button: true
        },
        {
            digital: false,
            number: "A5"
        }
        ],
    PWM: [

        {
            number: 11,
            period: 1000000,
            dutyCycle: 500000
        }

        ]
    };

virginia.galileo.prepareBoard(options);

virginia.eventEmitter.on('galileoConfigured', function(){
	// virginia.galileo.writeGpio(led_gpio, 1);

	// setInterval(function(){
	// 	 	virginia.galileo.writeGpio(led_gpio, 0);
	// },2000);

 //    virginia.galileo.readAnalog(5,function(val){
 //        console.log(val);
 //    });

virginia.galileo.setButtonCallback(button,function(val){
    console.log("event");
});


}, false);
 


