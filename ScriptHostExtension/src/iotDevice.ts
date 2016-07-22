'use strict';

import * as vscode from 'vscode';
import fs = require('fs');

const path = require('path');
const request = require('request');
const spawn = require('child_process').spawn;

const iotOutputChannel = vscode.window.createOutputChannel('IoT');

const appx = {
    "arm" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packageFullName": "NodeScriptHost_1.0.0.0_arm__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_ARM.appx",
        "certificate": "NodeScriptHost_1.0.0.0_ARM.cer",
        "dependencies": [
            "Microsoft.VCLibs.ARM.14.00.appx"
        ]
    },
    "x86" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packageFullName": "NodeScriptHost_1.0.0.0_x86__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_x86.appx",
        "certificate": "NodeScriptHost_1.0.0.0_x86.cer",
        "dependencies": [
            "Microsoft.VCLibs.x86.14.00.appx"
        ]
    },
    "x64" : {
        "id": "NodeScriptHost_dnsz84vs3g3zp!App",
        "packageFullName": "NodeScriptHost_1.0.0.0_x64__dnsz84vs3g3zp",
        "package": "NodeScriptHost_1.0.0.0_x64.appx",
        "certificate": "NodeScriptHost_1.0.0.0_x64.cer",
        "dependencies": [
            "Microsoft.VCLibs.x64.14.00.appx"
        ]
    }
};

export class IotDevice
{
    private host: string;
    private devName: string;
    private user: string;
    private password: string;
    
    constructor()
    {
    }

    public Init() : Thenable<boolean>
    {
        return this.GetHost().then((hostResult :string) => {
            this.host = hostResult;
            return this.GetDevName();
        }).then( (devName :string) => {
            this.devName = devName;
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
    
    public ArchitectureFromDeviceInfo(info: any) :string
    {
        const osVersionTokens = info.OsVersion.split('.');
        const token2 = osVersionTokens[2];
        const architecture = token2.substr(0,token2.length-3);
        return architecture;
    }

    public GetDevName() : Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const deviceName :string = config.get('Device.DeviceName', '');
        if (deviceName)
        {
            return new Promise<string> (function (resolve, reject){ 
                resolve(deviceName);
            });
        }
        else
        {
            return vscode.window.showInputBox({"placeHolder":"device name", "prompt":"Enter Device Name"});
        }
    }

    public GetHost() : Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const host :string = config.get('Device.IpAddress', '');
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
        const config = vscode.workspace.getConfiguration('iot');
        const userName :string = config.get('Device.UserName', '');
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
        const config = vscode.workspace.getConfiguration('iot');
        const password :string = config.get('Device.Password', '');
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
        const filename = path.replace(/^.*[\\\/]/, '');
        return filename;
    }
    
    public GetExtensionInfo()
    {
        const ext = vscode.extensions.getExtension('ms-iot.windowsiot');
        iotOutputChannel.show();
        iotOutputChannel.appendLine('ext.extensionPath=' + ext.extensionPath);
        //iotOutputChannel.appendLine('ext.exports=' + ext.exports);
        iotOutputChannel.appendLine('ext.id=' + ext.id);
        iotOutputChannel.appendLine('version='+ext.packageJSON.version);
        iotOutputChannel.appendLine('');
    }
    
    public GetDeviceInfo() : Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/os/info';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            const req = request.get(url, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    const info = JSON.parse(body);
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
                    else if (resp && resp.statusCode != 200)
                    {
                        const info = JSON.parse(body);
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
            let appxDetail: any;
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
                console.log( 'architecture=' + architecture );
                console.log( 'package=' + appxDetail.package );
                console.log( 'certificate=' + appxDetail.certificate );
                console.log( 'dependencies=' );
                appxDetail.dependencies.forEach(dep => {
                    console.log( "  " + dep );
                });
                console.log( '' );
                resolve(appxDetail);
            }
            else
            {
                iotOutputChannel.appendLine('Platform not recognized');
                reject('Platform not recognized');
            }

        });
    }
    
    public PrintDeviceInfo(info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine('Get Device Info:');
        iotOutputChannel.appendLine( 'Device=' + this.host );
        iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName );
        iotOutputChannel.appendLine( 'Language=' + info.Language );
        iotOutputChannel.appendLine( 'OsEdition=' + info.OsEdition );
        iotOutputChannel.appendLine( 'OsEditionId=' + info.OsEditionId );
        iotOutputChannel.appendLine( 'OsVersion=' + info.OsVersion );
        iotOutputChannel.appendLine( 'Platform=' + info.Platform );
        iotOutputChannel.appendLine( '' );
    }

    public PrintMessage(message :string)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine(message);        
    }

    public GetDeviceName(maxRetries :number) :Promise<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/os/machinename';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            let retries = maxRetries;

            (function GetDeviceNameCallback(){
                const req = request.get(url, param, function (err, resp, body) {
                    if (!err && resp.statusCode == 200) 
                    {
                        const info = JSON.parse(body);
                        let message = `Get Device Name:\nDevice=${this.host}\nComputerName=${info.ComputerName}\n`; 
                        // iotOutputChannel.appendLine( 'Device=' + this.host );
                        // iotOutputChannel.appendLine( 'ComputerName=' + info.ComputerName);
                        // iotOutputChannel.appendLine( '' );
                        resolve(message);
                    }
                    else 
                    {
                        --retries;
                        if (retries < 0)
                        {
                            if (err){
                                console.log(err.message);
                                // iotOutputChannel.appendLine(err.message);
                                // iotOutputChannel.appendLine( '' );
                                reject(err.message);
                            }
                            else if (resp && resp.statusCode != 200)
                            {
                                const info = JSON.parse(body);
                                const message = info.Reason + ' status=' + resp.statusCode;
                                // iotOutputChannel.appendLine(message);
                                // iotOutputChannel.appendLine( '' );
                                reject(message);
                            }
                        }
                        setTimeout(GetDeviceNameCallback, 1000);
                    }
                });
            })();
        });
    }
    
    public SetDeviceName() : Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/iot/device/name?newdevicename=' + new Buffer(this.devName).toString('base64');
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            iotOutputChannel.show();
            const req = request.post(url, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    iotOutputChannel.appendLine(`Set Device Name succeeded!`);
                    iotOutputChannel.appendLine( '' );
                    resolve(resp);
                }
                else
                {
                    if (err){
                        iotOutputChannel.appendLine(err.message);
                        iotOutputChannel.appendLine( '' );
                        reject(err);
                    }

                    if (resp.statusCode != 200)
                    {
                        const info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                        iotOutputChannel.appendLine( '' );
                        reject(resp);
                    }
                }
            });
        });                   
    }
    
    public RestartDevice()
    {
        return new Promise<any>( (resolve, reject) =>
        {       
            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            iotOutputChannel.show();
            const restarturl = 'http://' + this.host + ':8080/api/control/restart';
            const restartreq = request.post(restarturl, param, function (err, resp, body) {
                if (!err && resp.statusCode == 200) 
                {
                    iotOutputChannel.appendLine(`Restarting device...`)
                    iotOutputChannel.appendLine( '' );
                    resolve(resp);
                }
                else 
                {   if (err)
                    {
                        console.log(err.message);
                        iotOutputChannel.appendLine(err.message);
                        iotOutputChannel.appendLine( '' );
                        reject(err);
                    }
                }
            });
        });
    }
    
    private UploadFileToPackage(packageFullName :any, filename: string) :Promise<string>
    {
        return new Promise<string> ((resolve, reject) => {
            let relPath = path.relative(vscode.workspace.rootPath, filename);
            let relDir = path.dirname(relPath);
            let remotePath = '\\LocalState'
            console.log ('filename='+filename);
            console.log ('relDir=' + relDir);
            if (relDir !== '.')
            {
                remotePath = remotePath + '\\' + relDir;
            }
            console.log ('remotePath=' + remotePath);

            let longRemotePath = 'c:\\data\\Users\\DefaultAccount\\AppData\\Local\\Packages\\NodeScriptHost_dnsz84vs3g3zp' + remotePath;
            console.log ('longRemotePath=' + longRemotePath);

            //this.RunCommand(`if not exist ${longRemotePath} md ${longRemotePath}`, true)
            this.RunCommand(`md ${longRemotePath}`, true)
            .then((message) => {
                if (message)
                {
                    iotOutputChannel.appendLine(message);
                }

                const url = 'http://' + this.host + ':8080/api/filesystem/apps/file?knownfolderid=LocalAppData&packagefullname=' + packageFullName + '&path=' + remotePath;
                console.log ('url=' + url);

                const param = {'auth': {
                    'user': this.user,
                    'pass': this.password
                }};

                const req = request.post(url, param, function (err, resp, body) {
                    if (err){
                        console.error(err.message);
                        reject(err.message);
                    } 
                    else if (resp.statusCode != 200)
                    {
                        let message = `ERROR: File upload failed: ${filename}\n`;
                        if (resp.body.length > 0)
                        {
                            const info = JSON.parse(body);
                            message = message + `Reason=${info.Reason}\nstatusCode=${resp.statusCode}`;
                        }
                        else if (resp.statusMessage.length > 0)
                        {
                            message = message + `Reason=${resp.statusMessage}\nstatusCode=${resp.statusCode}`;
                        }

                        console.error(message);
                        resolve(message);
                    }
                    else 
                    {
                        resolve(relPath);
                    }
                }, function(err){
                    console.error(err);                    
                });
                const form = req.form();
                form.append('file', fs.createReadStream(filename));
            })
        })
    }

    public FindFilesToUpload() :Promise<any>
    {
        return new Promise<any> ((resolve,reject) => {
            iotOutputChannel.appendLine('Locating files to upload in workspace.');

            const config = vscode.workspace.getConfiguration('iot');
            let files :any = config.get('Deployment.Files', '');
            if (!files)
            {
                // todo - get "main" from package.json?
                reject("Please specify files to upload in settings.json - iot.Deployment.Files")
            }
            
            let foundFiles = [];
            Promise.all(files.map(item => {
                return vscode.workspace.findFiles(`${item}`, "");
            }))
            .then((result :vscode.Uri[][]) =>{
                for (let i=0;i<result.length;i++)
                {
                    for (let j=0;j<result[i].length;j++)
                    {
                        foundFiles.push(result[i][j]);
                    }
                }

                let vscode_dir_cmd = 'dir c:\\data\\Users\\DefaultAccount\\AppData\\Local\\Packages\\NodeScriptHost_dnsz84vs3g3zp\\LocalState /s/b';
                this.RunCommand(vscode_dir_cmd, false)
                .then((output) =>{
                    //console.log(output);
                    let installedFiles = output.split("\r\n");
                    installedFiles.forEach((file, index, array) => {
                        array[index] = file.replace("c:\\data\\Users\\DefaultAccount\\AppData\\Local\\Packages\\NodeScriptHost_dnsz84vs3g3zp\\LocalState\\", "");
                    });
                    let foundFilesFiltered = foundFiles.filter((uri,index,array) => {
                        let relpath = path.relative(vscode.workspace.rootPath, uri.fsPath);
                        if (relpath.indexOf("node_modules") < 0){ 
                            return true;
                        }
                        return !installedFiles.find((value, index, array) => { if(value===relpath) return true; else return false; });
                    })
                    resolve(foundFilesFiltered);
                })                
            }, function(err){
                iotOutputChannel.appendLine("ERROR: err");
            })
        });
    }

    public UploadWorkspaceFiles()
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine('Upload Workspace Files:');

        let architecture :string;
        let iotAppxDetail :any;
        let iotFile :string
        let hostInstalled = false;

        return this.GetDeviceInfo().then((info) => {
            architecture = this.ArchitectureFromDeviceInfo(info);
            return this.GetAppxInfo(architecture);
        })
        .then ((appxDetail: any) => {
            iotAppxDetail = appxDetail;
            return this.GetPackages();
        })
        .then ((info: any) => {
            hostInstalled = IotDevice.IsInstalled(info, iotAppxDetail.id);
            return this.InstallPackage(iotAppxDetail, architecture, hostInstalled);
        })
        .then((resp: any) => {
            return this.WaitForAppxInstall(iotAppxDetail.id, hostInstalled);
        })
        .then((info: any) => {
            return this.FindFilesToUpload();
        })
        .then((uri :vscode.Uri[]) => {
            let chain :Promise<string> = null;
            uri.forEach(iotFile => {
                if (!chain)
                {
                    chain = this.UploadFileToPackage(iotAppxDetail.packageFullName, iotFile.fsPath);
                }
                else
                {
                    chain = chain.then((message) =>{
                        iotOutputChannel.appendLine( '  ' + message );
                        return this.UploadFileToPackage(iotAppxDetail.packageFullName, iotFile.fsPath);
                    })
                }
            })
            iotOutputChannel.appendLine( '\nUploading files:' );
            return chain;
        }).then((message) => {
            iotOutputChannel.appendLine( message );
            iotOutputChannel.appendLine( 'Upload Complete\n' );
        }, function(err){
            iotOutputChannel.appendLine(err);
            iotOutputChannel.appendLine( '' );
        })
    }

    public GetPackages()
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const config = vscode.workspace.getConfiguration('iot');               
            const url = 'http://' + this.host + ':8080/api/appx/packagemanager/packages';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            const req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    reject(err);
                } else {
                    const info = JSON.parse(body);
                    resolve(info);
                }
            });
        });
    }

    public PrintPackages(info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine( 'Get Installed Packages:');
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
            const url = 'http://' + this.host + ':8080/api/resourcemanager/processes';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            const req = request.get(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                } else {
                    const info = JSON.parse(body);
                    resolve(info);
                }
            });
        });
    }

    public GetWorkspaceInfo()
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine(`rootpath=${vscode.workspace.rootPath}`);
        vscode.workspace.findFiles("**/*","",null,null)
        .then((result :any) =>{
            result.forEach( r => {
                iotOutputChannel.appendLine(r);
            });
            iotOutputChannel.appendLine('');
            //return vscode.workspace.findFiles("**/package.json","",null,null)
        })
        // .then((results) =>{
        //     results.forEach( r => {
        //         iotOutputChannel.appendLine(`opening ${r}`);
        //         vscode.workspace.openTextDocument(r)
        //         .then((doc:any) =>{
        //             iotOutputChannel.appendLine(`success:${doc}`);
        //             vscode.window.showTextDocument(doc).then((editor :vscode.TextEditor)=>{
        //                 editor.show
        //             })   
        //         }, function(err){
        //             iotOutputChannel.appendLine(`error:${err}`);
        //         })
        //     });
        // });
    }

    public PrintProcessInfo(info: any, appxOnly: boolean)
    {
        iotOutputChannel.show();
        if (appxOnly){
            iotOutputChannel.appendLine( 'Get APPX Process Info:');
        }
        else{
            iotOutputChannel.appendLine( 'Get Process Info:');
            iotOutputChannel.appendLine( 'Device=' + this.host );
            iotOutputChannel.appendLine( '');
        }
        info.Processes.forEach(proc => {
            if (!appxOnly || proc.PackageFullName) 
            {
                if (proc.AppName) iotOutputChannel.appendLine( 'AppName: ' + proc.AppName );
                if (proc.PackageFullName) iotOutputChannel.appendLine( 'PackageFullName: ' + proc.PackageFullName );
                if (!appxOnly)
                {              
                    if (proc.IsRunning) iotOutputChannel.appendLine( 'IsRunning: ' + proc.IsRunning );
                    if (proc.Publisher) iotOutputChannel.appendLine( 'Publisher: ' + proc.Publisher );
                    if (proc.Version) iotOutputChannel.appendLine( 'Version: ' + proc.Version.Major + '.' + proc.Version.Minor + '.' + proc.Version.Revision + '.' + proc.Version.Build);
                    iotOutputChannel.appendLine( 'CPUUsage: ' + proc.CPUUsage );
                    iotOutputChannel.appendLine( 'ImageName: ' + proc.ImageName );
                    iotOutputChannel.appendLine( 'PageFileUsage: ' + proc.PageFileUsage );
                    iotOutputChannel.appendLine( 'PrivateWorkingSet: ' + proc.PrivateWorkingSet );
                    iotOutputChannel.appendLine( 'ProcessId: ' + proc.ProcessId );
                    iotOutputChannel.appendLine( 'SessionId: ' + proc.SessionId );
                    iotOutputChannel.appendLine( 'UserName: ' + proc.UserName );
                    iotOutputChannel.appendLine( 'VirtualSize: ' + proc.VirtualSize );
                    iotOutputChannel.appendLine( 'WorkingSetSize: ' + proc.WorkingSetSize );
                }
                iotOutputChannel.appendLine( '');
            }
        });
    }
    
    private InstallPackage(appxInfo :any, architecture :string, hostInstalled :boolean) :Promise<any>
    {
        return new Promise<any> ((resolve, reject) => {
            iotOutputChannel.show();
            if (hostInstalled)
            {
                iotOutputChannel.appendLine('NodeScriptHost is already installed');
                resolve(null);
                return;
            }

            const ext = vscode.extensions.getExtension('ms-iot.windowsiot');
            const appxFolder = ext.extensionPath + '\\appx\\' + architecture + '-appx\\';
            console.log('ext.extensionPath=' + ext.extensionPath);           

            const appxPath = appxFolder + appxInfo.package;
            const appxFile = this.FileFromPath(appxFolder + appxInfo.package);
            const certPath = appxFolder + appxInfo.certificate;
            const certFile = this.FileFromPath(appxFolder + appxInfo.certificate);

            const url = 'http://' + this.host + ':8080/api/appx/packagemanager/package?package=' + appxFile;
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            iotOutputChannel.appendLine('Installing Appx Package...');
            console.log('appxPath='+appxPath);
            console.log('appxFile='+appxFile);
            console.log('certPath='+certPath);
            console.log('certFile='+certFile);

            const req = request.post(url, param, function (err, resp, body) {
                if (err){
                    console.log(err.message);
                    iotOutputChannel.appendLine(err.message);
                    iotOutputChannel.appendLine( '' );
                    reject(err);
                } else {
                    if (resp.statusCode == 200)
                    {
                        iotOutputChannel.appendLine(`Successfully installed ${appxFile}`);
                        resolve(resp);
                    }
                    else if (resp.statusCode == 202)
                    {
                        const info = JSON.parse(body);
                        console.log(info.Reason);
                        console.log('status=' + resp.statusCode);
                        resolve(resp);
                    }
                    else
                    {
                        iotOutputChannel.appendLine('message=' + resp.statusMessage);
                        iotOutputChannel.appendLine('status=' + resp.statusCode);
                        reject(resp);
                    }
                    console.log( '' );
                }
            });
            const form = req.form();
            
            form.append(appxFile, fs.createReadStream(appxPath));
            form.append(certFile, fs.createReadStream(certPath));
            appxInfo.dependencies.forEach(dependency => {
                const depFile = this.FileFromPath(appxFolder + dependency);
                const depPath = appxFolder + dependency;
                console.log('depFile='+depFile);
                console.log('depPath='+depPath);
                form.append(depFile, fs.createReadStream(depPath));
            })
        });
    }

    public RunCommandInternal(command, resolve, reject, quiet)
    {
        if (!quiet)
        {
            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Run ${command}`)
        }

        const url = 
            'http://' + this.host + 
            ':8080/api/iot/processmanagement/runcommandwithoutput?command=' + new Buffer(command).toString('base64') + 
            '&runasdefaultaccount=' + new Buffer('false').toString('base64') +
            '&timeout='  + new Buffer('300000').toString('base64');
        console.log ('url=' + url)

        const param = {'auth': {
            'user': this.user,
            'pass': this.password
        }};

        const req = request.post(url, param, function (err, resp, body) {
            if (err){
                console.log(err.message);
                reject(err.message);
            }
            else if (resp.statusCode != 200)
            {
                let message = `command=${command}\nstatusMessage=${resp.statusMessage}\nstatusCode=${resp.statusCode}\n`;
                console.error(message);
                resolve(message);
            } 
            else {
                const info = JSON.parse(body);
                if (!quiet)
                {
                    resolve(info.output);
                }
                else
                {
                    resolve(null);
                }
            }
        });
    }

    public RunCommandFromPrompt()
    {
        return new Promise<any> ((resolve,reject) => {
            vscode.window.showInputBox({"placeHolder":"command to run", "prompt":"Enter Command to Run"})
            .then((command) =>{
                this.RunCommandInternal(command, resolve, reject, false);
            });
        });
    }

    public RunCommandFromSettings()
    {
        return new Promise<any> ((resolve,reject) => {
            const config = vscode.workspace.getConfiguration('iot');
            let commands :any = config.get('RunCommands', '');
            if (!commands)
            {
                commands = 
                [
                    "tlist", 
                    "deployappx getpackages"
                ];
            }
            vscode.window.showQuickPick(commands)
            .then((command) =>{
                this.RunCommandInternal(command, resolve, reject, false);
            });
        });
    }
    
    public RunCommand(command :string, quiet :boolean) :Promise<string>
    {
        return new Promise<any> ((resolve, reject) => {
            this.RunCommandInternal(command, resolve, reject, quiet);
        });
    }

    public static IsInstalled(info:any, PackageRelativeId: string) : boolean
    {
        let installed = false;
        info.InstalledPackages.some(appx => {
            if (PackageRelativeId == appx.PackageRelativeId)
            {
                installed = true;
                return installed;
            }
        });
        return installed;
    }

    public static IsRunning(info :any, PackageFullName :string) :boolean
    {
        let running = false;
        info.Processes.some(proc => {
            if (PackageFullName == proc.PackageFullName)
            {
                running = true;
                return running;
            }
        });
        return running;
    }

    public RunRemoteScript()
    {
        let architecture: string;
        let iotAppxDetail :any;
        let hostInstalled = false;
        let hostRunning = false;

        iotOutputChannel.show();
        iotOutputChannel.appendLine('Run Remote Script:');

        return this.GetDeviceInfo().then((info) => {
            architecture = this.ArchitectureFromDeviceInfo(info);
            return this.GetAppxInfo(architecture);
        })
        .then ((appxDetail) => {
            iotAppxDetail = appxDetail;
            return this.GetPackages();
        })
        .then ((info: any) => {
            hostInstalled = IotDevice.IsInstalled(info, iotAppxDetail.id);
            return this.InstallPackage(iotAppxDetail, architecture, hostInstalled);
        })
        .then((resp: any) => {
            return this.WaitForAppxInstall(iotAppxDetail.id, hostInstalled);
        })
        .then((info: any) => {
            return this.GetProcessInfo();
        })
        .then((info :any) => {
            hostRunning = IotDevice.IsRunning(info, iotAppxDetail.packageFullName);
            iotOutputChannel.appendLine(hostRunning?'Stopping NodeScriptHost...':'NodeScriptHost is not running.');
            return this.StopAppx(iotAppxDetail.packageFullName, hostRunning)
        })
        .then((resp :any) => {
            return this.WaitForAppxStop(iotAppxDetail.packageFullName, hostRunning);
        })
        .then((message: string) => {
            if (message)
            {
                iotOutputChannel.appendLine(message);
            }
            return this.FindFilesToUpload();
        })
        .then((uri :vscode.Uri[]) => {
            return Promise.all(uri.map(iotFile => {
                iotOutputChannel.appendLine(`Uploading file ${iotFile.fsPath} ...`);
                return this.UploadFileToPackage(iotAppxDetail.packageFullName, iotFile.fsPath);
            }));
        }).then((messages) => {
            messages.map(message =>{
                iotOutputChannel.appendLine(`Successfully uploaded ${message}`)
            })
            iotOutputChannel.appendLine('Starting NodeScriptHost...');
            return this.ActivateApplication(iotAppxDetail.packageFullName);
        })
        .then((b: boolean) => {
            const config = vscode.workspace.getConfiguration('iot');
            let launchBrowserPage = config.get('Deployment.LaunchBrowserPage', '');
            if (launchBrowserPage)
            {
                iotOutputChannel.appendLine(`Navigate to ${launchBrowserPage} in a browser\n`); // TODO: this uses a hardcoded port so it's a hack

                // launch browser (probably only works on windows)
                const browser = spawn('cmd.exe', ['/C', 'start', launchBrowserPage]);
            }
            else
            {
                iotOutputChannel.appendLine('Done.');
            }
        });
    }

    public ActivateApplication(packageFullName: string) : Thenable<any>
    {
        return new Promise ((resolve, reject) => {
            const url = 'http://' + this.host + ':8080/api/iot/appx/app?appid=' + new Buffer(packageFullName).toString('base64');
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            const req = request.post(url, param, function (err, resp, body) {
                if (err){
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
    }
    
    public StartNodeScriptHost()
    {
        let iotAppxDetail :any;
        let architecture: string;

        iotOutputChannel.show();
        iotOutputChannel.appendLine('Start Node Script Host:');

        return this.GetDeviceInfo().then((info) => {
            architecture = this.ArchitectureFromDeviceInfo(info);
            return this.GetAppxInfo(architecture);
        }).then ((appxDetail) => {
            iotAppxDetail = appxDetail;
            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Activating ${iotAppxDetail.packageFullName}`);
            return this.ActivateApplication(iotAppxDetail.packageFullName);
        }).then ((resp: any) => {
            iotOutputChannel.appendLine('Application Started');
            iotOutputChannel.appendLine( '' );
        }, function(err){
            console.log(err.message);
            iotOutputChannel.appendLine(err.message);
            iotOutputChannel.appendLine( '' );
        });
    }

    public StopAppx(packageFullName :string, hostRunning :boolean) : Thenable<any>
    {
        return new Promise<any> ((resolve, reject) =>{
            if (!hostRunning)
            {
                resolve(null);
                return;
            }

            // TODO: is this correct for headless apps?
            const url = 'http://' + this.host + ':8080/api/taskmanager/app?package=' + new Buffer(packageFullName).toString('base64');
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            const req = request.delete(url, param, function (err, resp, body) {
                if (err){
                    reject(err);
                } else {
                    resolve(resp);
                }
            });
        });
    }

    public WaitForAppxInstall(PackageRelativeId: string, hostInstalled :boolean) : Promise<string>
    {
        return new Promise<any>((resolve, reject) => {
            if (hostInstalled)
            {
                resolve(null);
                return;
            }
            
            const config = vscode.workspace.getConfiguration('iot');               
            const url = 'http://' + this.host + ':8080/api/appx/packagemanager/packages';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            (function WaitForAppxInstallCallback(){
                const req = request.get(url, param, function (err, resp, body) {
                    if (err){
                        console.log(err.message);
                        iotOutputChannel.appendLine(err.message);
                        reject(err);
                    } else {
                        const info = JSON.parse(body);
                        if (IotDevice.IsInstalled(info, PackageRelativeId))
                        {
                            let message = `Done waiting for ${PackageRelativeId} to install`;
                            //delay(10000);
                            resolve(info);
                        }
                        else
                        {
                            setTimeout(WaitForAppxInstallCallback, 1000);
                        }
                    }
                });
            })();
        });
    }

    public WaitForAppxStop(packageFullName :string, hostRunning :boolean) : Promise<string>
    {
        return new Promise<any>((resolve, reject) => {
            if (!hostRunning)
            {
                resolve(null);
                return;
            }

            const url = 'http://' + this.host + ':8080/api/resourcemanager/processes';
            console.log ('url=' + url)

            const param = {'auth': {
                'user': this.user,
                'pass': this.password
            }};

            (function WaitForAppxStopCallback(){
                const req = request.get(url, param, function (err, resp, body) {
                    if (err){
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        const info = JSON.parse(body);                      
                        if (IotDevice.IsRunning(info, packageFullName))
                        {
                            setTimeout(WaitForAppxStopCallback, 1000);
                        }
                        else
                        {
                            let message = `Done waiting for ${packageFullName}  to stop`;
                            resolve(message);
                        }
                    }
                });
            })();
        });
    }

    public StopNodeScriptHost() 
    {
        let architecture: string;

        return this.GetDeviceInfo().then((info) => {
            architecture = this.ArchitectureFromDeviceInfo(info);
            return this.GetAppxInfo(architecture);
        }).then ((appxDetail) => {
            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Stopping ${appxDetail.packageFullName}`);
            return this.StopAppx(appxDetail.packageFullName, true);
        }).then ((resp: any) => {
            iotOutputChannel.appendLine('Application Stopped');
            iotOutputChannel.appendLine( '' );
        },function(err) {  // why no .catch?
            console.log(err.message);
            iotOutputChannel.appendLine(err.message);
            iotOutputChannel.appendLine( '' );
        });
    }
}
