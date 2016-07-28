# Windows IoT Core Extension for VS Code

## Installing the extension
To install the extension: 

1. First get [VS Code](http://code.visualstudio.com/)
1. Then go to  [Visual Studio Marketplace](https://marketplace.visualstudio.com/) and search for **iot**
1. Choose the [Windows IoT Core Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-iot.windowsiot)
1. Following the directions press Ctrl+P and paste **ext install windowsiot**

OR

1. In VS Code you can press F1 and then type **View: Show Extensions** 
1. Type **iot** in the search box
1. Select  **Windows IoT Core Extension for VS Code** and press **Install**
1. Click **Enable** to restart VS Code with the extension enabled.

## Building and Debbuging the Extension
1. Install [Node](https://nodejs.org/)
1. cd ScriptHostExtension
1. npm install
1. npm install -g tslint
1. code .
1. (Ctrl+P) ext install tslint  // install tslint extension
1. F5


## Notes
The NodeScriptHost directory contains the foundation project used to generate the APPX files that are contained in the extension
