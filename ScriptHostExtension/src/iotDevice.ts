'use strict';
import fs = require('fs');

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var request = require('request');

export class IotDevice
{
    constructor(){}
    
    public getHost() : Thenable<string>
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string = config.get('IpAddress', '');
        if (host)
        {
            return new Promise<string> (function (resolve, reject){ 
                resolve(host);
            });
        }
        else
        {
            console.log("iot.IPAddress is null");
            //vscode.window.showErrorMessage('Please specify iot.IPAddress in workspace settings');
            return vscode.window.showInputBox({"placeHolder":"device name or ip address", "prompt":"Enter IP Address"}); //.then((addr: string) => {resolve(addr)});
        }
    }
    
    public GetDeviceInfo()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.getHost().then((h:string) => {
            host = h; 
            
            var url = 'http://' + host + ':8080/api/os/info';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log("Error!");
                    vscode.window.setStatusBarMessage(`Error getting Device name ${host}`)
                } else {
                    console.log('URL: ' + body);
                    var info = JSON.parse(body);
                    var iotOutputChannel = vscode.window.createOutputChannel('IoT');
                    iotOutputChannel.show();
                    //{"ComputerName" : "paulmon-vm", 
                    //"Language" : "en-us", 
                    //"OsEdition" : "IoTUAP", //
                    //"OsEditionId" : 123, 
                    //"OsVersion" : "14351.1000.x86fre.rs1_iot_core.160520-1700", 
                    //"Platform" : "Virtual Machine"}
                    iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName);
                    iotOutputChannel.appendLine( 'Language=' + info.Language);
                    iotOutputChannel.appendLine( 'OsEdition=' + info.OsEdition);
                    iotOutputChannel.appendLine( 'OsEditionId=' + info.OsEditionId);
                    iotOutputChannel.appendLine( 'OsVersion=' + info.OsVersion);
                    iotOutputChannel.appendLine( 'Platform=' + info.Platform);
                }
            });
        });
    }
    
    public GetDeviceName()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.getHost().then((h:string) => {
            host = h; 
            
            var url = 'http://' + host + ':8080/api/os/machinename';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log("Error!");
                    vscode.window.setStatusBarMessage(`Error getting Device name ${host}`)
                } else {
                    console.log('URL: ' + body);
                    //vscode.window.setStatusBarMessage(`getDevicename=${body}`)
                    var info = JSON.parse(body);
                    var iotOutputChannel = vscode.window.createOutputChannel('IoT');
                    iotOutputChannel.show();
                    iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName);                    
                }
            });
        });                       
    }
    
    public SetDeviceName()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.getHost().then((h:string) => {
            host = h; 
            
            var devicename = config.get('DeviceName', '');
            if (!devicename)
            {
                console.log("iot.DeviceName is null");
                vscode.window.showErrorMessage('Please specify iot.DeviceName in workspace settings');
                return;
            }
            
            var url = 'http://' + host + ':8080/api/iot/device/name?newdevicename=' + new Buffer(devicename).toString('base64');
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log("Error!");
                    vscode.window.setStatusBarMessage(`Error setting Device name ${host}`)
                } else {
                    console.log('URL: ' + body);
                    vscode.window.setStatusBarMessage(`Set Device Name succeeded!`);
                    let iotDevice = new IotDevice();
                    iotDevice.RestartDevice(host);
                }
            });
        });                       
    }
    
    public RestartDevice(host: string)
    {
        var config = vscode.workspace.getConfiguration('iot');
        
        var param = {'auth': {
            'user': config.get("Name"),
            'pass': config.get("Password")
        }};

        var restarturl = 'http://' + host + ':8080/api/control/restart';
        var restartreq = request.post(restarturl, param, function (err, resp, body) {
            if (err){
                console.log("Error!");
                vscode.window.setStatusBarMessage(`Error restarting device ${host}`)
            } else {
                console.log('URL: ' + body);
                vscode.window.setStatusBarMessage(`Set Device Name succeeded! Restarting device...`)
            }
        });
    }
    
    public UploadFile()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        let iotDevice = new IotDevice();
        this.getHost().then((h:string) => {
            host = h; 
            
            var iotfile :string = config.get('File', '');
            if (!iotfile)
            {
                console.log("iot.File is null");
                vscode.window.showErrorMessage('Please specify iot.File in workspace settings');
                return;
            }
            
            var packageFullName = config.get('PackageFullName');

            var url = 'http://' + host + ':8080/api/filesystem/apps/file?knownfolderid=LocalAppData&packagefullname=' + packageFullName + '&path=\\LocalState';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log("Error!");
                    vscode.window.setStatusBarMessage(`Error uploading ${iotfile}`)
                } else {
                    console.log('URL: ' + body);
                    vscode.window.setStatusBarMessage(`Successfully uploaded ${iotfile}`)
                }
            });
            var form = req.form();
            form.append('file', fs.createReadStream(iotfile));
        });
    }

    public GetPackages()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.getHost().then((h:string) => {
            host = h; 
            
            var url = 'http://' + host + ':8080/api/appx/packagemanager/packages';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.get(url, param, function (err, resp, body) {
                if (err){
                    vscode.window.setStatusBarMessage(`Error getting installed packages ${host}`)
                } else {
                    var info = JSON.parse(body);
                    var iotOutputChannel = vscode.window.createOutputChannel('IoT');
                    iotOutputChannel.show();

                    info.InstalledPackages.forEach(element => {
                        iotOutputChannel.appendLine( 'Name: ' + element.Name );
                        iotOutputChannel.appendLine( 'PackageFamilyName: ' + element.PackageFamilyName);
                        iotOutputChannel.appendLine( 'PackageFullName: ' + element.PackageFullName);
                        iotOutputChannel.appendLine( 'PackageOrigin: ' + element.PackageOrigin);
                        iotOutputChannel.appendLine( 'PackageRelativeId: ' + element.PackageRelativeId);
                        iotOutputChannel.appendLine( 'Publisher: ' + element.Publisher);
                        element.RegisteredUsers.forEach(user =>{
                           iotOutputChannel.appendLine( 'UserDisplayName: ' + user.UserDisplayName);
                           iotOutputChannel.appendLine( 'Name: ' + user.UserSID); 
                        });
                        iotOutputChannel.appendLine( 'Version: ' + element.Version.Build + '.' + element.Version.Major + '.' + element.Version.Minor);
                        iotOutputChannel.appendLine( '');
                    });
                }
            });
        });
    }
    
    public InstallPackage()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        let iotDevice = new IotDevice();
        this.getHost().then((h:string) => {
            host = h; 
            
            var iotfile :string = config.get('File', '');
            if (!iotfile)
            {
                console.log("iot.File is null");
                vscode.window.showErrorMessage('Please specify iot.File in workspace settings');
                return;
            }

            var url = 'http://' + host + ':8080/api/appx/packagemanager/package?package=Clock_1.0.6.0_x86.appx';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Name"),
                'pass': config.get("Password")
            }};

            vscode.window.setStatusBarMessage(``);

            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    var iotOutputChannel = vscode.window.createOutputChannel('IoT');
                    iotOutputChannel.show();
                    iotOutputChannel.appendLine(err.message);
                } else {
                    console.log('URL: ' + body);
                    var iotOutputChannel = vscode.window.createOutputChannel('IoT');
                    iotOutputChannel.show();
                    iotOutputChannel.appendLine('Successfully installed ${iotfile}');
                }
            });
            var form = req.form();
            form.append('Clock_1.0.6.0_x86.appx', fs.createReadStream('\\\\scratch2\\scratch\\paulmon\\appx\\Clock_1.0.6.0_x86_Test\\Clock_1.0.6.0_x86.appx'));
            form.append('Clock_1.0.6.0_x86.cer', fs.createReadStream('\\\\scratch2\\scratch\\paulmon\\appx\\Clock_1.0.6.0_x86_Test\\Clock_1.0.6.0_x86.cer'));
            form.append('Microsoft.NET.Native.Framework.1.3.appx', fs.createReadStream('\\\\scratch2\\scratch\\paulmon\\appx\\Clock_1.0.6.0_x86_Test\\Dependencies\\x86\\Microsoft.NET.Native.Framework.1.3.appx'));
            form.append('Microsoft.NET.Native.Runtime.1.3.appx', fs.createReadStream('\\\\scratch2\\scratch\\paulmon\\appx\\Clock_1.0.6.0_x86_Test\\Dependencies\\x86\\Microsoft.NET.Native.Runtime.1.3.appx'));
            form.append('Microsoft.VCLibs.x86.14.00.appx', fs.createReadStream('\\\\scratch2\\scratch\\paulmon\\appx\\Clock_1.0.6.0_x86_Test\\Dependencies\\x86\\Microsoft.VCLibs.x86.14.00.appx'));
        });
    }
}
