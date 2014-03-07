var virginia = require("../lib/virginia");

virginia.galileo.preparePMW(3, function(){
	virginia.galileo.setPMWperiod(3, 1000000, function(){
		virginia.galileo.setPMWdutycycle(3, 100000, function(){
			console.log("done");
		});
	});
});