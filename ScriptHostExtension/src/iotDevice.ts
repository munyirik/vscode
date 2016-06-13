'use strict';
import fs = require('fs');
//import delayed = require('delayed');

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
var request = require('request');
var iotOutputChannel = vscode.window.createOutputChannel('IoT');

var appx = {
    "arm" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packagefullname": "NodeScriptHost_1.0.0.0_arm__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_ARM.appx",
        "certificate": "NodeScriptHost_1.0.0.0_ARM.cer",
        "dependencies": [
            "Microsoft.VCLibs.ARM.14.00.appx"
        ]
    },
    "x86" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packagefullname": "NodeScriptHost_1.0.0.0_x86__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_x86.appx",
        "certificate": "NodeScriptHost_1.0.0.0_x86.cer",
        "dependencies": [
            "Microsoft.VCLibs.x86.14.00.appx"
        ]
    },
    "x64" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packagefullname": "NodeScriptHost_1.0.0.0_x64__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_x64.appx",
        "certificate": "NodeScriptHost_1.0.0.0_x64.cer",
        "dependencies": [
            "Microsoft.VCLibs.x64.14.00.appx"
        ]
    }
};

export class IotDevice
{
    //private outputChannel : vscode.OutputChannel;
    private host: string;
    private user: string;
    private password: string;
    
    constructor()
    {
        // todo: why aren't lambas inside class declarations in class scope?
        //this.outputChannel = vscode.window.createOutputChannel('IoT');
    }

    public Init() : Thenable<boolean>
    {
        return this.GetHost().then((hostResult :string) => {
            this.host = hostResult;
            return this.GetUserName();
        }).then( (userResult :string) => {
            this.user = userResult;
            return this.GetPassword();
        }).then( (passwordResult :string) => {
            this.password = passwordResult;
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            })
        });
    }
    
    public Delay(ms, data:any) : Thenable<any>
    {
        return new Promise((resolve,reject)=>{
            setTimeout(function(){
                iotOutputChannel.appendLine('Delaying ' + ms + ' ms');
                resolve(data); 
            }, 1000);
        });
    }

    public GetHost() : Thenable<string>
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string = config.get('Device.IpAddress', '');
        if (host)
        {
            return new Promise<string> (function (resolve, reject){ 
                resolve(host);
            });
        }
        else
        {
            return vscode.window.showInputBox({"placeHolder":"device ip address", "prompt":"Enter IP Address"});
        }
    }

    public GetUserName() : Thenable<string>
    {
        var config = vscode.workspace.getConfiguration('iot');
        var userName :string = config.get('Device.UserName', '');
        if (userName)
        {
            return new Promise<string> (function (resolve, reject){ 
                resolve(userName);
            });
        }
        else
        {
            return vscode.window.showInputBox({"placeHolder":"user name", "prompt":"Enter Device User Name"});
        }
    }
    
    public GetPassword() : Thenable<string>
    {
        var config = vscode.workspace.getConfiguration('iot');
        var password :string = config.get('Device.Password', '');
        if (password)
        {
            return new Promise<string> (function (resolve, reject){ 
                resolve(password);
            });
        }
        else
        {
            return vscode.window.showInputBox({"placeHolder":"password", "prompt":"Enter Device Password"});
        }
    }

    private FileFromPath(path :string) :string
    {
        var filename = path.replace(/^.*[\\\/]/, '');
        return filename;
    }
    
    public GetExtensionInfo()
    {
        let ext = vscode.extensions.getExtension('Microsoft.windowsiot');
        iotOutputChannel.show();
        iotOutputChannel.appendLine('ext.extensionPath=' + ext.extensionPath);
        iotOutputChannel.appendLine('ext.exports=' + ext.exports);
        iotOutputChannel.appendLine('ext.id=' + ext.id);
        iotOutputChannel.appendLine('version='+ext.packageJSON.version);
        iotOutputChannel.appendLine('');
    }
    
    public ListIotCommands()
    {
        let ext = vscode.extensions.getExtension('Microsoft.windowsiot');
        iotOutputChannel.show();
        var commands = ext.packageJSON.contributes.commands;
        iotOutputChannel.appendLine('List IoT Extension Commands:')
        commands.forEach(c => {
            iotOutputChannel.appendLine(c.title)
        })
        iotOutputChannel.appendLine('');
    }
    
    public GetDeviceInfo() : Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            var url = 'http://' + this.host + ':8080/api/os/info';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            var req = request.get(url, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    var info = JSON.parse(body);
                    resolve(info);
                }
                else
                { 
                    if (err)
                    {
                        console.log(err.message);
                        iotOutputChannel.appendLine(err.message);
                        iotOutputChannel.appendLine( '' );
                    }

                    if (resp.statusCode != 200)
                    {
                        var info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                        iotOutputChannel.appendLine( '' );
                    }
                } 
            });
        });
    }

    public GetAppxInfo(architecture: string) : Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            var appxDetail: any;
            if (architecture == "x86")
            {
                appxDetail = appx.x86;
            }
            else if (architecture == "amd64")
            {
                appxDetail = appx.x64;
            }
            else if (architecture == "arm")
            {
                appxDetail = appx.arm;
            }

            if (appxDetail != null)
            {
                iotOutputChannel.appendLine( 'architecture=' + architecture );
                iotOutputChannel.appendLine( 'package=' + appxDetail.package );
                iotOutputChannel.appendLine( 'certificate=' + appxDetail.package );
                iotOutputChannel.appendLine( 'dependencies=' );
                appxDetail.dependencies.forEach(dep => {
                    iotOutputChannel.appendLine( "  " + dep );
                });
                iotOutputChannel.appendLine( '' );
                resolve(appxDetail);
            }
            else
            {
                iotOutputChannel.appendLine('Platform not recognized');
                reject('Platform not recognized');
            }

        });
    }
    
    public PrintDeviceInfo(host: string, info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine('Get Device Info:');
        iotOutputChannel.appendLine( 'Device=' + host );
        iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName );
        iotOutputChannel.appendLine( 'Language=' + info.Language );
        iotOutputChannel.appendLine( 'OsEdition=' + info.OsEdition );
        iotOutputChannel.appendLine( 'OsEditionId=' + info.OsEditionId );
        iotOutputChannel.appendLine( 'OsVersion=' + info.OsVersion );
        iotOutputChannel.appendLine( 'Platform=' + info.Platform );
        iotOutputChannel.appendLine( '' );
    }

    public GetDeviceName()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.GetHost().then((h:string) => {
            host = h; 
            
            var url = 'http://' + host + ':8080/api/os/machinename';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Device.UserName"),
                'pass': config.get("Device.Password")
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine('Get Device Name:');
            var req = request.get(url, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    var info = JSON.parse(body);
                    iotOutputChannel.appendLine( 'Device=' + host );
                    iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName);
                    iotOutputChannel.appendLine( '' );
                }                    
                else 
                {
                    if (err){
                        console.log(err.message);
                        iotOutputChannel.appendLine(err.message);
                        iotOutputChannel.appendLine( '' );
                    }

                    if (resp.statusCode != 200)
                    {
                        var info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                        iotOutputChannel.appendLine( '' );
                    }
                }
            });
        });                       
    }
    
    public SetDeviceName()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.GetHost().then((h:string) => {
            host = h; 
            
            var devicename = config.get('Device.DeviceName', '');
            if (!devicename)
            {
                console.log("iot.DeviceName is null");
                vscode.window.showErrorMessage('Please specify iot.DeviceName in workspace settings');
                return;
            }
            
            var url = 'http://' + host + ':8080/api/iot/device/name?newdevicename=' + new Buffer(devicename).toString('base64');
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Device.UserName"),
                'pass': config.get("Device.Password")
            }};

            iotOutputChannel.show();
            var req = request.post(url, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    iotOutputChannel.appendLine(`Set Device Name succeeded!`);
                    iotOutputChannel.appendLine( '' );
                    
                    let iotDevice = new IotDevice();
                    iotDevice.RestartDevice(host);
                }
                else
                {
                    if (err){
                        iotOutputChannel.appendLine(err.message);
                        iotOutputChannel.appendLine( '' );
                    }

                    if (resp.statusCode != 200)
                    {
                        var info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                        iotOutputChannel.appendLine( '' );
                    }
                }
            });
        });                       
    }
    
    public RestartDevice(host: string)
    {
        var config = vscode.workspace.getConfiguration('iot');
        
        var param = {'auth': {
            'user': config.get("Device.UserName"),
            'pass': config.get("Device.Password")
        }};

        iotOutputChannel.show();
        var restarturl = 'http://' + host + ':8080/api/control/restart';
        var restartreq = request.post(restarturl, param, function (err, resp, body) {
            if (!err && resp.statusCode == 200) 
            {
                iotOutputChannel.appendLine(`Restarting device...`)
                iotOutputChannel.appendLine( '' );
            }
            else 
            {   if (err)
                {
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                }
            }
        });
    }
    
    private UploadFileToPackage(packageFullName :any, filename: string) :Thenable<any>
    {
        return new Promise<any> ((resolve, reject) => {
            var url = 'http://' + this.host + ':8080/api/filesystem/apps/file?knownfolderid=LocalAppData&packagefullname=' + packageFullName + '&path=\\LocalState';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    // iotOutputChannel.appendLine(err.message);
                    // iotOutputChannel.appendLine( '' );
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
            var form = req.form();
            form.append('file', fs.createReadStream(filename));
        })
    }

    public UploadFile()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var iotfile :string = config.get('File', '');
        if (!iotfile)
        {
            console.log("iot.File is null");
            vscode.window.showErrorMessage('Please specify iot.File in workspace settings');
            return;
        }

        var packageFullName = config.get('AppxInfo.PackageFullName');

        iotOutputChannel.show();
        iotOutputChannel.appendLine( `Uploading file ${iotfile} ...` );

        this.UploadFileToPackage(packageFullName, iotfile).then((res:any) => {
            iotOutputChannel.appendLine(`Successfully uploaded ${iotfile}`)
            iotOutputChannel.appendLine( '' );
        })
    }

    public GetPackages()
    {
        return new Promise<any>( (resolve, reject) =>
        {
            var config = vscode.workspace.getConfiguration('iot');               
            var url = 'http://' + this.host + ':8080/api/appx/packagemanager/packages';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            var req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    reject(err);
                } else {
                    var info = JSON.parse(body);
                    resolve(info);
                }
            });
        });
    }

    public PrintPackages(info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine( 'iot: Get Installed Packages:');
        iotOutputChannel.appendLine( 'Device=' + this.host );
        iotOutputChannel.appendLine( '');
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

    public GetProcessInfo()
    {
        return new Promise<any>( (resolve, reject) =>
        {
            var url = 'http://' + this.host + ':8080/api/resourcemanager/processes';
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            var req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                } else {
                    var info = JSON.parse(body);
                    resolve(info);
                }
            });
        });
    }

    public PrintProcessInfo(info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine( 'iot: Get Installed Packages:');
        iotOutputChannel.appendLine( 'Device=' + this.host );
        iotOutputChannel.appendLine( '');
        info.Processes.forEach(proc => {
            iotOutputChannel.appendLine( 'CPUUsage: ' + proc.CPUUsage );
            iotOutputChannel.appendLine( 'ImageName: ' + proc.ImageName );
            iotOutputChannel.appendLine( 'PageFileUsage: ' + proc.PageFileUsage );
            iotOutputChannel.appendLine( 'PrivateWorkingSet: ' + proc.PrivateWorkingSet );
            iotOutputChannel.appendLine( 'ProcessId: ' + proc.ProcessId );
            iotOutputChannel.appendLine( 'SessionId: ' + proc.SessionId );
            iotOutputChannel.appendLine( 'UserName: ' + proc.UserName );
            iotOutputChannel.appendLine( 'VirtualSize: ' + proc.VirtualSize );
            iotOutputChannel.appendLine( 'WorkingSetSize: ' + proc.WorkingSetSize );
            iotOutputChannel.appendLine( '');
        });
    }
    
    private InstallPackage(appxInfo: any, appxFolder: string) : Thenable<boolean>
    {
        return new Promise<boolean> ((resolve, reject) => {
            var appxPath = appxFolder + appxInfo.package;
            var appxFile = this.FileFromPath(appxFolder + appxInfo.package);
            var certPath = appxFolder + appxInfo.certificate;
            var certFile = this.FileFromPath(appxFolder + appxInfo.certificate);

            var url = 'http://' + this.host + ':8080/api/appx/packagemanager/package?package=' + appxFile;
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine('Installing Appx Package');
            iotOutputChannel.appendLine('appxPath='+appxPath);
            iotOutputChannel.appendLine('appxFile='+appxFile);
            iotOutputChannel.appendLine('certPath='+certPath);
            iotOutputChannel.appendLine('certFile='+certFile);

            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                } else {
                    if (resp.statusCode == 200)
                    {
                        iotOutputChannel.appendLine(`Successfully installed ${appxFile}`);
                    }
                    else if (resp.statusCode == 202)
                    {
                        var info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                    }
                    else
                    {
                        iotOutputChannel.appendLine('message=' + resp.statusMessage);
                        iotOutputChannel.appendLine('status=' + resp.statusCode);
                    }
                    iotOutputChannel.appendLine( '' );
                }
            });
            var form = req.form();
            
            form.append(appxFile, fs.createReadStream(appxPath));
            form.append(certFile, fs.createReadStream(certPath));
            //var dependencies :any = appxInfo.dependencies;
            appxInfo.dependencies.forEach(dependency => {
                var depFile = this.FileFromPath(appxFolder + dependency);
                var depPath = appxFolder + dependency;
                iotOutputChannel.appendLine('depFile='+depFile);
                iotOutputChannel.appendLine('depPath='+depPath);
                form.append(depFile, fs.createReadStream(depPath));
            })
        });
    }

    public RunCommandFromSettings()
    {
        // TODO: show pick list of commands from config file
        var command :string = 'icacls c:\\data\\Users\\DefaultAccount\\AppData\\Local\\Packages\\NodeScriptHost_dnsz84vs3g3zp\\LocalState\\server.js /grant *S-1-5-21-2702878673-795188819-444038987-503:F';

        iotOutputChannel.show();
        iotOutputChannel.appendLine(`Running ${command}`)           
        this.RunCommand(command).then((resp) => {
            iotOutputChannel.appendLine('resp.statusCode=' + resp.statusCode);
            iotOutputChannel.appendLine( '' );
        })
    }
    
    public RunCommand(command: string) :Thenable<any>
    {
        return new Promise<any> ((resolve, reject) => {
            var config = vscode.workspace.getConfiguration('iot');
            var host :string;
            let iotDevice = new IotDevice();
            this.GetHost().then((h:string) => {
                host = h; 
                
                var url = 'http://' + host + ':8080/api/iot/processmanagement/runcommand?command=' + new Buffer(command).toString('base64') + '&runasdefaultaccount=false' ;
                console.log ('url=' + url)

                var param = {'auth': {
                    'user': config.get("Device.UserName"),
                    'pass': config.get("Device.Password")
                }};

                var req = request.post(url, param, function (err, resp, body) {
                    if (err){
                        console.log(err.message);
                        reject(err);
                    } else {
                        resolve(resp);
                    }
                });
            });
        });
    }

    public IsInstalled(info:any, PackageRelativeId: string) : Thenable<boolean>
    {
        return new Promise<boolean> ((resolve,reject) => {
            var installed = false;
            info.InstalledPackages.some(appx => {
                if (PackageRelativeId == appx.PackageRelativeId)
                {
                    installed = true;
                    return installed;
                }
            });
            resolve (installed); // TODO: don't really need a promise here
        });
    }

    public RunRemoteScript()
    {
        var iotHost :string;
        var iotUser :string;
        var iotPassword: string;
        var architecture: string;
        var iotAppxDetail :any;

        iotOutputChannel.show();
        iotOutputChannel.appendLine('Run Remote Script:');

        // TODO: GetArchitecture?
        return this.GetDeviceInfo().then((info) => {
            var osVersionTokens = info.OsVersion.split('.');
            architecture = osVersionTokens[2];
            architecture = architecture.substr(0,architecture.length-3);
            return this.GetAppxInfo(architecture);
        }).then ((appxDetail) => {
            iotAppxDetail = appxDetail;
            return this.GetPackages();
        }).then ((info: any) => {
            return this.IsInstalled(info, iotAppxDetail.id);
        }).then((installed: boolean)=>{
            if (!installed)
            {
                let ext = vscode.extensions.getExtension('Microsoft.windowsiot');
                iotOutputChannel.appendLine('ext.extensionPath=' + ext.extensionPath);
                return this.InstallPackage(iotAppxDetail, ext.extensionPath + '\\appx\\' + architecture + '-appx\\');
            }
            else{
                iotOutputChannel.appendLine('NodeScriptHost is already installed');
                var command = 'iotstartup stop nodescripthost';
                iotOutputChannel.appendLine(`Running ${command}`)           
                return this.RunCommand(command);
            }
        }).then((resp: any) => { 
            // TODO: wait for nodescripthost to finish installing.  How does the apps view update in webb?
            return this.Delay(1000, true);
        }).then((b: boolean) => {
            // TODO: get files to upload from project
            iotOutputChannel.appendLine('uploading file');
            return this.UploadFileToPackage(iotAppxDetail.packagefullname, "\\\\scratch2\\scratch\\paulmon\\vscode\\server.js");
        }).then((resp: any) => {
            iotOutputChannel.appendLine('statusCode='+resp.statusCode);
            iotOutputChannel.appendLine('statusMessage='+resp.statusMessage);
            iotOutputChannel.appendLine('activating...');
            var command = 'icacls c:\\data\\Users\\DefaultAccount\\AppData\\Local\\Packages\\NodeScriptHost_dnsz84vs3g3zp\\LocalState\\server.js /grant *S-1-5-21-2702878673-795188819-444038987-503:F';
            iotOutputChannel.appendLine(`Running ${command}`)           
            return this.RunCommand(command);
        }).then((resp:any) => {
            iotOutputChannel.appendLine('resp.statusCode=' + resp.statusCode);
            iotOutputChannel.appendLine( '' );
            var command = 'iotstartup run nodescripthost';
            iotOutputChannel.appendLine(`Running ${command}`)           
            return this.RunCommand(command);
        // TODO: fix this?
        //     return this.ActivateApplication(iotAppxDetail.packagefullname);
        // }).then((b: boolean) => {
            // TODO: launch browser to view changes? or http-get and log results?\
        }).then((resp:any) => {
            iotOutputChannel.appendLine('resp.statusCode=' + resp.statusCode);
            iotOutputChannel.appendLine( '' );
            iotOutputChannel.appendLine('Done?');
        });
    }

    public ActivateApplication(packageFullName: string) : Thenable<boolean>
    {
        return new Promise ((resolve, reject) => {
            var config = vscode.workspace.getConfiguration('iot');
                
            var url = 'http://' + this.host + ':8080/api/iot/appx/app?appid=' + new Buffer(packageFullName).toString('base64');
            console.log ('url=' + url)

            var param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Activating ${packageFullName}`);
            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                    reject(err);
                } else {
                    iotOutputChannel.appendLine('Application Started');
                    iotOutputChannel.appendLine( '' );
                    resolve(true);
                }
            });
        });
    }
    
    public StartApp()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        this.GetHost().then((h:string) => {
            host = h; 
            
            var packageRelativeId :string = config.get('AppxInfo.PackageRelativeId', '');
            if (!packageRelativeId)
            {
                console.log("iot.AppxInfo.PackageRelativeId is null");
                vscode.window.showErrorMessage('Please specify iot.AppxInfo.PackageRelativeId in workspace settings');
                return;
            }

            var url = 'http://' + host + ':8080/api/taskmanager/app?appid=' + new Buffer(packageRelativeId).toString('base64');
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Device.UserName"),
                'pass': config.get("Device.Password")
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Starting ${packageRelativeId}`);
            var req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                } else {
                    iotOutputChannel.appendLine('Application Started');
                    iotOutputChannel.appendLine( '' );
                }
            });
        });
    }
    
    public StopApp()
    {
        var config = vscode.workspace.getConfiguration('iot');
        var host :string;
        let iotDevice = new IotDevice();
        this.GetHost().then((h:string) => {
            host = h; 
            
            var packageFullName :string = config.get('AppxInfo.PackageFullName', '');
            if (!packageFullName)
            {
                console.log("iot.AppxInfo.PackageFullName is null");
                vscode.window.showErrorMessage('Please specify iot.AppxInfo.PackageFullName in workspace settings');
                return;
            }

            var url = 'http://' + host + ':8080/api/taskmanager/app?package=' + new Buffer(packageFullName).toString('base64');
            console.log ('url=' + url)

            var param = {'auth': {
                'user': config.get("Device.UserName"),
                'pass': config.get("Device.Password")
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Stopping ${packageFullName}`);
            var req = request.delete(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                } else {
                    iotOutputChannel.appendLine('Application Stopped');
                    iotOutputChannel.appendLine( '' );
                }
            });
        });
    }
}
