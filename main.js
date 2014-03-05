var test = require("./lib");

var led_gpio = 13; // maps to digital PIN7

// for (var i = 0; i < 13; i++) {
// 	test.galileo.preparePin(i,true,function(){
// 		test.galileo.writeGpio(i, 1);
// 	});
// };

var options = {
	pins: {
		
	}
} 

 
test.galileo.preparePin(led_gpio,false,function(){
		test.galileo.writeGpio(led_gpio, 1);

		 setInterval(function(){
		 	test.galileo.writeGpio(led_gpio, 0);
		 },2000);
});