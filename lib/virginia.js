var fs = require('fs');
var fileOptions = {encoding: 'ascii'};
var Epoll = require('epoll').Epoll;

var digitalMapping = {
	"0": 50,
	"1": 51,
	"2": 32,
	"3": 18,
	"4": 28,
	"5": 17,
	"6": 24,
	"7": 27,
	"8": 26,
	"9": 19,
	"10": 16,
	"11": 25,
	"12": 38,
	"13": 39,
}

var analogMapping = {
	"A0": 44,
	"A1": 45,
	"A2": 46,
	"A3": 47,
	"A4": 48,
	"A5": 49
}

var analogMuxMapping = {
	"A0": 37,
	"A1": 36,
	"A2": 23,
	"A3": 22,
	"A4": 21,
	"A5": 20
}

var PWMmapping = {
	"3": 3,
	"5": 5,
	"6": 6,
	"9": 1,
	"10": 7,
	"11": 4
}
// // _VALIDPINS =   [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
//     var mapping = [50,51,32,18,28,17,24,27,26,19,16,25,38,39];

//  _ANALOGPINS = ["A0","A1","A2","A3","A4","A5"];
//     _ANALGPIO = ["44","45","46","47","48","49"];

var events = require('events');
var eventEmitter = new events.EventEmitter();

var galileo = new Object();

//functions that trigger events

galileo.prepareBoard = function(options, callback){

		var recursivePrepare = function(pinArray, PWMarray){
			if(pinArray.length == 0){
				debugger;
				console.log(PWMarray);
				if(PWMarray.length == 0){
					eventEmitter.emit('galileoConfigured');
					if(callback){
						callback();
					}
				}else{
					var usedPWM = PWMarray[PWMarray.length-1].number;
					var mappedPWM = PWMmapping[usedPWM];
					galileo.preparePWM(mappedPWM,function(){
							debugger;
							if(typeof PWMarray[PWMarray.length-1].period == undefined || typeof PWMarray[PWMarray.length-1].dutyCycle == undefined){								
								PWMarray.pop();
								recursivePrepare(pinArray, PWMarray);
							}
							else{
								galileo.setPWMperiod(mappedPWM, PWMarray[PWMarray.length-1].period, function(){
									galileo.setPWMdutycycle(mappedPWM, PWMarray[PWMarray.length-1].dutyCycle, function(){
										PWMarray.pop();
										recursivePrepare(pinArray, PWMarray);
									});
								});
							}
					});
				}
			}else{
				if(pinArray[pinArray.length-1].digital){
					var usedPin = pinArray[pinArray.length-1].number;
					var mappedPin = digitalMapping[usedPin];

					if(pinArray[pinArray.length-1].button){
						galileo.setUpButton(mappedPin,function(){
							pinArray.pop();
							recursivePrepare(pinArray, PWMarray);
						});
					}
					else{
						galileo.preparePin(mappedPin,pinArray[pinArray.length-1].input,function(){
							pinArray.pop();
							recursivePrepare(pinArray, PWMarray);
						});
					}
				}else{
					var usedPin = pinArray[pinArray.length-1].number;
					var mappedPin = analogMuxMapping[usedPin];
					prepareAnalogIn(mappedPin, function(){
						pinArray.pop();
						recursivePrepare(pinArray, PWMarray);
					});
				}
			}
		}

		if(typeof options.pins == undefined){
			var pinArray = [];
		}else{
			var pinArray = options.pins;
		}
		if(typeof options.PWM == undefined){
			var PWMarray = [];
		}else{
			var PWMarray = options.PWM;
		}
		debugger;
		recursivePrepare(pinArray,PWMarray);

}

//low level GPIO functions

exportGpio = function(gpio_nr, callback) {
	fs.writeFile('/sys/class/gpio/export', gpio_nr, fileOptions, function (err) {
		if (err) { 
			// console.log("Couldn't export %d, probably already exported.", gpio_nr); 
			console.log("export error");
			console.log(err);
		}
		if(callback){
				callback();
			}
});
};

setGpioDirection = function(gpio_nr, direction, callback) {
	fs.writeFile("/sys/class/gpio/gpio" + gpio_nr + "/direction", direction, fileOptions, function (err) {
		if (err) { 
			// console.log("Could'd set gpio" + gpio_nr + " direction to " + direction + " - probably gpio not available via sysfs");
			console.log("direction error");
			console.log(err); 
		}
		callback();
	});
}

galileo.setGpioIn = function(gpio_nr, callback) {
	setGpioDirection(gpio_nr, 'in', callback);
}

galileo.setGpioOut = function(gpio_nr, callback) {
	setGpioDirection(gpio_nr, 'out', callback);
}

// pass callback to process data asynchroniously
galileo.readGpio = function(gpio_nr, callback) {
	fs.readFile("/sys/class/gpio/gpio" + gpio_nr + "/value", fileOptions, function(err, data) {
		if (err) { console.log("Error reading gpio" + gpio_nr); }
		var value = data;
		callback(value);
	});
};

galileo.writeGpio = function(gpio_nr, value, callback) {

	if(value != 0 && value !=1){
		console.log("gpio write only supports binary values");
		return;
	}

	fs.writeFile("/sys/class/gpio/gpio" + gpio_nr + "/value", value, fileOptions, function(err, data) {
		if (err) { console.log("Writing " + gpio_nr + " " + value); }
		if (callback){ callback();}
	});
};

//higher level analog functions

galileo.readAnalog = function(analog_nr, callback){
	fs.readFile("/sys/bus/iio/devices/iio:device0/in_voltage" + analog_nr + "_raw", fileOptions, function(err, data) {
		if (err) { console.log("Error reading analog" + analog_nr); }
		var value = data;
		callback(value);
	});
}

prepareAnalogIn = function(gpio_mux, callback){
	exportGpio(gpio_mux, function(){
		galileo.setGpioOut(gpio_mux, function(){
			galileo.writeGpio(gpio_mux, 0, callback);
		});
	});
}

//PWM functions for analog output

exportPWM = function(PWM_w, callback) {
	fs.writeFile('/sys/class/pwm/pwmchip0/export', PWM_w, fileOptions, function (err) {
		if (err) { 
			console.log("export error");
			console.log(err);
		}
		if(callback){
				callback();
			}
});
};

galileo.writePWM = function(PWM_wr, value, callback){
	if(value != 0 && value !=1){
		console.log("PWM write only supports binary values");
		return;
	}
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + PWM_wr + "/enable", value, fileOptions, function(err, data) {
		if (err) { console.log("Writing " + PWM_wr + " " + value); }
		if (callback){ callback();}
	});
}

galileo.preparePWM = function(PWM_w, callback) {
	exportPWM(PWM_w, function(){
		galileo.writePWM(PWM_w, 1, function(){
			callback();
		});
	});
}

galileo.setPWMperiod = function(PWM_wr, value, callback){
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + PWM_wr + "/period", value, fileOptions, function(err, data) {
		if (err) { console.log("Period " + PWM_wr + " " + value); }
		if (callback){ callback();}
	});
}

galileo.setPWMdutycycle = function(PWM_wr, value, callback){
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + PWM_wr + "/duty_cycle", value, fileOptions, function(err, data) {
		if (err) { console.log("duty_cycle " + PWM_wr + " " + value); }
		if (callback){ callback();}
	});
}

//button related functions

galileo.setUpButton = function(gpio_nr, callback){
	exportGpio(gpio_nr,function(){
		setGpioDirection(gpio_nr,"in",function(){
			fs.writeFile("/sys/class/gpio/gpio" + gpio_nr + "/edge", "both", fileOptions, function (err) {
				if (err) { 
					console.log("edge error");
					console.log(err); 
				}
				callback();
			});
		});
	});
}

galileo.setButtonCallback = function(gpio_nr, callback){
	
	var  valuefd = fs.openSync('/sys/class/gpio/gpio'+gpio_nr+'/value', 'r');
	var  buffer = new Buffer(1);

// Create a new Epoll. The callback is the interrupt handler.

	var poller = new Epoll(function (err, fd, events) {

// Read GPIO value file. Reading also clears the interrupt.
  		fs.readSync(fd, buffer, 0, 1, 0);
  		callback(buffer.toString());
	});

// Read the GPIO value file before watching to
// prevent an initial unauthentic interrupt.
	fs.readSync(valuefd, buffer, 0, 1, 0);
// Start watching for interrupts.

	poller.add(valuefd, Epoll.EPOLLPRI);

	return poller;
}

//higher level general preparing function


galileo.preparePin = function(gpio_nr, direction, callback) {
	exportGpio(gpio_nr, function(){
		if(direction){
			galileo.setGpioIn(gpio_nr, callback);
		}else{
			galileo.setGpioOut(gpio_nr, callback);
		}
	});
}

exports.galileo = galileo;
exports.eventEmitter = eventEmitter;
exports.digitalMapping = digitalMapping;