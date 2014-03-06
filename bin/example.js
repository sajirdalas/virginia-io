var virginia = require("../lib/virginia");

var led_gpio = virginia.digitalMapping[0]; 

var options = {
    pins: [
        // {
        //     digital: true,
        //     number: "0",
        //     input: false
        // },
        // {
        //     digital: true,
        //     number: "1",
        //     input: false
        // },
        {
            digital: false,
            number: "A5"
        }
        ]
    };

virginia.galileo.prepareBoard(options);

virginia.eventEmitter.on('galileoConfigured', function(){
	// virginia.galileo.writeGpio(led_gpio, 1);

	// setInterval(function(){
	// 	 	virginia.galileo.writeGpio(led_gpio, 0);
	// },2000);

    virginia.galileo.readAnalog(5,function(val){
        console.log(val);
    });
}, false);
 


