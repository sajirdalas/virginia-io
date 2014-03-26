virginia-io
===========

This is a library for interaction with the GPIO and arduino-like pins on the [Intel Galileo](http://www.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html) for node. It will alloy to use digital input/output, analog input, PWM and even buttons from node.js using javascript.

This is very much work in progress - we are just starting and they are many things missing, as well as bugs, so any help is appreciated (see [contributing](#contributing)).

I keep documenting my progress on this library as I go on this [blog](http://runawaydev.wordpress.com/).

Installation
------------

    npm install virginia-io
    
Configuration
-------

Pins can be set with the prepare board function, which takes an options object with the following structure:

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

The pin array takes every pin used and its configuration options. If the pin is marked as digital you should specify a number from 0 to 13 representing the digital pin used, as well as the direction (input: true means in, input: false means out) and if you plan to use as a button (in order to set the appropriate events). Pins marked as buttons must be input.

After that, the PWM array sets the pins you plan to use as PWM analog outputs. Only pins 3, 5, 6, 9, 10, and 11 can be used for this purpose, and a period and duty cycle in milliseconds must be set.

After the options object is correctly created the prepareBoard function must be called:


    var virginia = require("virginia-io");
    virginia.galileo.prepareBoard(options);

    virginia.eventEmitter.on('galileoConfigured', function(){
          // do cool things here
    }

The 'galileoConfigured' event is thrown on competition, so you can start doing things with the pins after they have been correctly configured.

Digital Input - Output
------------

Pins set up as digital input or output can be read using two simple functions.

    var virginia = require("virginia-io");

    var led_gpio = virginia.digitalMapping[1]; 
    var in_gpio = virginia.digitalMapping[0]; 

    virginia.galileo.writeGpio(led_gpio, 1);

    virginia.galileo.readGpio(in_gpio,function(val){
          console.log(val);
     });

Digital Input - Output
------------

Analog inputs can easily be read with a simple function

     var virginia = require("virginia-io");

     virginia.galileo.readAnalog(5,function(val){
           console.log(val);
     });

The analog pins do not need to be mapped, as on the internal files 0 actually means A0 and 5 actually means A5.

PMW
------------

While just setting up PMW on the options objects while enable and start up PWM right away, there are a couple a functions that allow you to change the period and duty cycle programmatically. PWM pins do need to be mapped:

     var virginia = require("virginia-io");

     var pwm_pin = galileo.PWMmapping(11);

     virginia.galileo.setPWMperiod(pwm_pin,1000000,function(){
           virginia.galileo.setPWMdutycycle(pwm_pin,500000,function(){
                  console.log("done");
           });
     });


Buttons
------------

Once a pin has been set as a button, you can set up a callback function to be called every time the button is pressed or released (two events per press). The function is passed a val value you can use to determine if it was pressed or released.

     var virginia = require("virginia-io");

     var button = virginia.digitalMapping[3]; 

     virginia.galileo.setButtonCallback(button,function(val){
         console.log("event");
     });

Contributing
------------

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
