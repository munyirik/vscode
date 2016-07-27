# Windows IoT Core Extension for VS Code
## Deploying the Blinky Sample to Windows IoT Core
1. Install Node.js https://nodejs.org/ (use the LTS version if you don't know which one to choose.)
1. md c:\blinky (directory name/location isn’t important)
1. cd c:\blinky
1. npm init (accept all defaults)
1. 'code &nbsp; .'
1. F1 -> iot: Initialize settings.json
1. Enter device ip address and desired name
1. Enter the username and password to log into the device with. The defaults are "Administrator" and "p@ssw0rd".  If you prefer not to have your username and/or password in a plain text file delete these lines from the generated .json file and you will be prompted each time they are needed.
1. Wire your circuit as described [here](https://developer.microsoft.com/en-us/windows/iot/win10/samples/blinky)
1. Add a new file to the workspace by clicking the icon found here. Name it index.js or whatever filename you provided in npm.init.

    ![NewFile](images/NewFile.png)

1. Copy and paste code from [here](https://github.com/ms-iot/samples/blob/develop/BlinkyHeadless/node.js/NodeJsBlinky/server.js)

    ```   
    // Copyright (c) Microsoft. All rights reserved.

    var http = require('http');

    var uwp = require("uwp");
    uwp.projectNamespace("Windows");

    var gpioController = Windows.Devices.Gpio.GpioController.getDefault();
    var pin = gpioController.openPin(5);
    var currentValue = Windows.Devices.Gpio.GpioPinValue.high;
    pin.write(currentValue);
    pin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.output);
    setTimeout(flipLed, 500);


    function flipLed(){
        if (currentValue == Windows.Devices.Gpio.GpioPinValue.high) {
            currentValue = Windows.Devices.Gpio.GpioPinValue.low;
        } else {
            currentValue = Windows.Devices.Gpio.GpioPinValue.high;
        }
        pin.write(currentValue);
        setTimeout(flipLed, 500);
    }
    ```

1. F1 > "iot: Run Remote Script"
1. You should see the LED blinking

## Deploying the Hello World Sample to Windows IoT Core
1. md c:\hello (directory name/location isn’t important)
1. cd c:\hello
1. npm init (accept all defaults)
1. 'code &nbsp; .'
1. F1 -> iot: Initialize settings.json
1. Enter device ip address and desired name
1. Enter the username and password to log into the device with. The defaults are "Administrator" and "p@ssw0rd".  If you prefer not to have your username and/or password in a plain text file delete these lines from the generated .json file and you will be prompted each time they are needed.
1. Change LaunchBrowserPageNo in settings.json to LaunchBrowserPage
1. Add a new file to the workspace by clicking the icon found here. Name it index.js or whatever filename you provided in npm.init.

    ![NewFile](images/NewFile.png)

1. Copy and paste code from [here](https://github.com/ms-iot/samples/blob/develop/BlinkyHeadless/node.js/NodeJsBlinky/server.js)
    ```   
        var http = require('http');
        
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello Demo!\n');
        }).listen(1337);
    ```

1. F1 > "iot: Run Remote Script"
1. Navigate to http://${deviceip}:1337/ in a browser
