var fs = require('fs');
var fileOptions = {encoding: 'ascii'};
// _VALIDPINS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var mapping = [50,51,32,18,28,17,24,27,26,19,16,25,38,39];

var events = require('events');
var eventEmitter = new events.EventEmitter();


var galileo = new Object();

galileo.prepareBoard = function(options, callback){

		var recursivePrepare = function(pinArray){
			if(pinArray.length == 0){
				eventEmitter.emit('galileoConfigured');
				if(callback){
					callback();
				}
			}else{
				galileo.preparePin(pinArray[pinArray.length-1].number,pinArray[pinArray.length-1].input,function(){
					pinArray.pop();
					recursivePrepare(pinArray);
				});
			}
		}


		var pinArray = options.pins;
		recursivePrepare(pinArray);

}

galileo.preparePin = function(gpio_map, direction, callback) {
	exportGpio(gpio_map,function(){
		if(direction){
			galileo.setGpioIn(gpio_map, callback);
		}else{
			galileo.setGpioOut(gpio_map, callback);
		}
	});
}

exportGpio = function(gpio_map, callback) {
	var gpio_nr = mapping[gpio_map];
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

setGpioDirection = function(gpio_map, direction, callback) {
	var gpio_nr = mapping[gpio_map];
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
galileo.readGpio = function(gpio_map, callback) {
	var gpio_nr = mapping[gpio_map];
	fs.readFile("/sys/class/gpio/gpio" + gpio_nr + "/value", fileOptions, function(err, data) {
		if (err) { console.log("Error reading gpio" + gpio_nr); }
		var value = data;
		callback(data);
	});
	return value;
};

galileo.writeGpio = function(gpio_map, value) {
	var gpio_nr = mapping[gpio_map];
	fs.writeFile("/sys/class/gpio/gpio" + gpio_nr + "/value", value, fileOptions, function(err, data) {
		if (err) { console.log("Writing " + gpio_nr + " " + value); }
	});
};

exports.galileo = galileo;
exports.eventEmitter = eventEmitter;