var fs = require('fs');
var fileOptions = {encoding: 'ascii'};


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

var PMWmapping = {
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

		var recursivePrepare = function(pinArray, PMWarray){
			if(pinArray.length == 0){
				//not yet
				if(PMWarray.length == 0){
					eventEmitter.emit('galileoConfigured');
					if(callback){
						callback();
					}
				}else{
					var usedPMW = PMWarray[PMWarray.length-1].number;
					var mappedPMW = PMWmapping[usedPMW];
					galileo.preparePMW(mappedPMW,function(){
							debugger;
							if(typeof PMWarray[PMWarray.length-1].period == undefined || typeof PMWarray[PMWarray.length-1].dutyCycle == undefined){								
								PMWarray.pop();
								recursivePrepare(pinArray, PMWarray);
							}
							else{
								galileo.setPMWperiod(mappedPMW, PMWarray[PMWarray.length-1].period, function(){
									galileo.setPMWdutycycle(mappedPMW, PMWarray[PMWarray.length-1].dutyCycle, function(){
										PMWarray.pop();
										recursivePrepare(pinArray, PMWarray);
									});
								});
							}
					});
				}
			}else{
				if(pinArray[pinArray.length-1].digital){
					var usedPin = pinArray[pinArray.length-1].number;
					var mappedPin = digitalMapping[usedPin];
					galileo.preparePin(mappedPin,pinArray[pinArray.length-1].input,function(){
						pinArray.pop();
						recursivePrepare(pinArray);
					});
				}else{
					var usedPin = pinArray[pinArray.length-1].number;
					var mappedPin = analogMuxMapping[usedPin];
					prepareAnalogIn(mappedPin, function(){
						pinArray.pop();
						recursivePrepare(pinArray, PMWarray);
					});
				}
			}
		}

		if(typeof options.pins == undefined){
			var pinArray = [];
		}else{
			var pinArray = options.pins;
		}

		if(typeof options.pmw == undefined){
			var PMWarray = [];
		}else{
			var PMWarray = options.pmw;
		}
		recursivePrepare(pinArray,PMWarray);

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

galileo.setGpioIn = function(gpio_map, callback) {
	setGpioDirection(gpio_map, 'in', callback);
}

galileo.setGpioOut = function(gpio_map, callback) {
	setGpioDirection(gpio_map, 'out', callback);
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

//PMW functions for analog output

exportPMW = function(pmw_w, callback) {
	fs.writeFile('/sys/class/pwm/pwmchip0/export', pmw_w, fileOptions, function (err) {
		if (err) { 
			console.log("export error");
			console.log(err);
		}
		if(callback){
				callback();
			}
});
};

galileo.writePMW = function(pmw_wr, value, callback){
	if(value != 0 && value !=1){
		console.log("PMW write only supports binary values");
		return;
	}
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + pmw_wr + "/enable", value, fileOptions, function(err, data) {
		if (err) { console.log("Writing " + pmw_wr + " " + value); }
		if (callback){ callback();}
	});
}

galileo.preparePMW = function(pmw_w, callback) {
	exportPMW(pmw_w, function(){
		galileo.writePMW(pmw_w, 1, function(){
			callback();
		});
	});
}

galileo.setPMWperiod = function(pmw_wr, value, callback){
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + pmw_wr + "/period", value, fileOptions, function(err, data) {
		if (err) { console.log("Period " + pmw_wr + " " + value); }
		if (callback){ callback();}
	});
}

galileo.setPMWdutycycle = function(pmw_wr, value, callback){
	fs.writeFile("/sys/class/pwm/pwmchip0/pwm" + pmw_wr + "/duty_cycle", value, fileOptions, function(err, data) {
		if (err) { console.log("duty_cycle " + pmw_wr + " " + value); }
		if (callback){ callback();}
	});
}

//higher level general preparing function


galileo.preparePin = function(gpio_map, direction, callback) {
	exportGpio(gpio_map, function(){
		if(direction){
			galileo.setGpioIn(gpio_map, callback);
		}else{
			galileo.setGpioOut(gpio_map, callback);
		}
	});
}

exports.galileo = galileo;
exports.eventEmitter = eventEmitter;
exports.digitalMapping = digitalMapping;