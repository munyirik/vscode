// Before running this code, update serialport by right-clicking on the npm node 
// (in the Solution Explorer) and selecting 'Update npm Packages'
// Doing this will enable serialport to work with this application.

var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function () {
    var led = new five.Led(13);
    led.blink(127);
});