# Windows IoT Core Extension for VS Code
## Deploying the Blinky Sample to Windows IoT Core
1. Install Node.js https://nodejs.org/ (use the LTS version if you don't know which one to choose.)
1. md c:\blinky (directory name/location isn’t important)
1. cd c:\blinky
1. npm init (accept all defaults)
1. 'code .'
1. F1 -> Preferences: Open Workspace Settings
1. Add this to settings.json

    ``` json
    {
        "iot" : {
            "Device" : {
                "IpAddress": "10.127.127.1",
                "DeviceName": "<devicename>",
                "UserName": "Administrator",
                "Password": "p@ssw0rd"
            },
            "Deployment" : {
                "Files": [
                    "index.js",
                    "package.json"
                ],
                "LaunchBrowserPageNo": "http://10.137.184.44:1337/"
            },
            "RunCommands": [
                "iotstartup list",
                "iotstartup add headless NodeScriptHost",
                "iotstartup remove headless NodeScriptHost",
                "deployappx getpackages|findstr -i nodescripthost",
                "deployappx uninstall NodeScriptHost_1.0.0.0_x86__dnsz84vs3g3zp"
            ]

        }
    }
    ```

1. Wire your circuit as described [here](https://developer.microsoft.com/en-us/windows/iot/win10/samples/blinky)
1. Add a new file to the workspace by clicking the icon found here. Name it server.js

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
1. 'code .'
1. F1 -> Preferences: Open Workspace Settings
1. Add this to settings.json

    ``` json
    {
        "iot" : {
            "Device" : {
                "IpAddress": "10.127.127.1",
                "DeviceName": "<devicename>",
                "UserName": "Administrator",
                "Password": "p@ssw0rd"
            },
            "Deployment" : {
                "Files": [
                    "index.js",
                    "package.json"
                ],
                "LaunchBrowserPageNo": "http://10.137.184.44:1337/"
            },
            "RunCommands": [
                "iotstartup list",
                "iotstartup add headless NodeScriptHost",
                "iotstartup remove headless NodeScriptHost",
                "deployappx getpackages|findstr -i nodescripthost",
                "deployappx uninstall NodeScriptHost_1.0.0.0_x86__dnsz84vs3g3zp"
            ]

        }
    }
    ```

1. Wire your circuit as described [here](https://developer.microsoft.com/en-us/windows/iot/win10/samples/blinky)
1. Add a new file to the workspace by clicking the icon found here. Name it server.js

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
