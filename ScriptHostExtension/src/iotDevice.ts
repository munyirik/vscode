'use strict';

import * as vscode from 'vscode';
import fs = require('fs');

const delay = require('delay');
const dgram = require('dgram');
const fileHelper = require('./fileHelper').FileHelper;
const httpHelper = require('./httpHelper').HttpHelper;
const nodeDebugHelper = require('./nodeDebugHelper').NodeDebugHelper;
const request = require('request');
const sftpHelper = require('./sftpHelper');
const spawn = require('child_process').spawn;
const urlx = require('url');
const path = require('path');
const stripJsonComments = require('strip-json-comments');

const MAX_PATH = 260;
const iotOutputChannel = vscode.window.createOutputChannel('IoT');
const nodeVersion = "7.0.0-pre10"

const nodeSource = {
    'arm' : {
        'blobs': [
            `https://iottools.blob.core.windows.net/scripthostextension/arm/${nodeVersion}/chakracore.dll`,
            `https://iottools.blob.core.windows.net/scripthostextension/arm/${nodeVersion}/node.exe`
        ]
    },
    'x86' : {
        'blobs': [
            `https://iottools.blob.core.windows.net/scripthostextension/x86/${nodeVersion}/chakracore.dll`,
            `https://iottools.blob.core.windows.net/scripthostextension/x86/${nodeVersion}/node.exe`
        ]
    },
    'x64' : {
        'blobs': [
            `https://iottools.blob.core.windows.net/scripthostextension/x64/${nodeVersion}/chakracore.dll`,
            `https://iottools.blob.core.windows.net/scripthostextension/x64/${nodeVersion}/node.exe`
        ]
    }
};

const defaultSettings = {
    'iot' : {
        'Device' : {
            'IpAddress': null,
            'DeviceName': null,
            'UserName': null,
            'Password': null,
            'ListFilter': null,
        },
        'Deployment': {
            'Workspace': {
                'Files': [
                '**',
                ],
                'Destination': null,
            },
            'Nodejs': {
                'Source': null,
                'Destination': 'C:\\nodejschakracore',
            }
        },
        'RunCommands': null,
    },
};

const hostLen = 33;
const ipv4Len = 4 * 4 + 1;
const macLen = 3 * 8 + 1;
const idLen = 40;
const modelLen = 50;
const versionLen = 50;
const archLen = 8;

const hostOffset    = 0;
const ipv4Offset    = hostLen;
const macOffset     = hostLen + ipv4Len;
const idOffset      = macOffset + macLen;
const modeOffset   = idOffset + idLen;
const versionOffset = modeOffset + modelLen;
const archOffset    = versionOffset + versionLen;

class HostInfo {

    public host: string;
    public seen: number;
    public mac: string;
    public id: string;
    public model: string;
    public version: string;
    public arch: string;

    constructor(
        hostName: string,
        lastSeen: number,
        mac: string,
        id: string,
        model: string,
        version: string,
        arch: string) {

        this.host = hostName;
        this.seen = lastSeen;
        this.mac = mac;
        this.id = id;
        this.model = model;
        this.version = version;
        this.arch = arch;
    }
}

export class IotDevice {

    private static listeningForEboot = false;
    private static iotDeviceList: Map<string, HostInfo>;
    private static fileMap: Map<string, any>;

    private host: string;
    private devName: string;
    private user: string;
    private password: string;

    // constructor() { }

    public Init(): Thenable<boolean>
    {
        return this.GetHost().then((hostResult: string) => {
            this.host = hostResult;
            return this.GetDevName();
        }).then( (devName: string) => {
            this.devName = devName;
            return this.GetUserName();
        }).then( (userResult: string) => {
            this.user = userResult;
            return this.GetPassword();
        }).then( (passwordResult: string) => {
            this.password = passwordResult;
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            });
        });
    }

    public ArchitectureFromDeviceInfo(info: any): string
    {
        const osVersionTokens = info.OsVersion.split('.');
        const token2 = osVersionTokens[2];
        let architecture = token2.substr(0, token2.length - 3);
        if (architecture === 'woa')
        {
            architecture = 'arm';
        }
        if (architecture === 'amd64')
        {
            architecture = 'x64';
        }
        return architecture;
    }

    public GetDevName(): Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const deviceName: string = config.get('Device.DeviceName', '');
        if (deviceName)
        {
            return new Promise<string> ( (resolve, reject) => {
                resolve(deviceName);
            });
        }
        else
        {
            return vscode.window.showInputBox({'placeHolder': 'device name', 'prompt': 'Enter Device Name'});
        }
    }

    public GetHost(): Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const host: string = config.get('Device.IpAddress', '');
        if (host)
        {
            return new Promise<string> ((resolve, reject) => {
                resolve(host);
            });
        }
        else
        {
            return vscode.window.showInputBox({'placeHolder': 'device ip address', 'prompt': 'Enter IP Address'});
        }
    }

    public GetUserName(): Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const userName: string = config.get('Device.UserName', '');
        if (userName)
        {
            return new Promise<string> ((resolve, reject) => {
                resolve(userName);
            });
        }
        else
        {
            return vscode.window.showInputBox({'placeHolder': 'user name', 'prompt': 'Enter Device User Name'});
        }
    }

    public GetPassword(): Thenable<string>
    {
        const config = vscode.workspace.getConfiguration('iot');
        const password: string = config.get('Device.Password', '');
        if (password)
        {
            return new Promise<string> ((resolve, reject) => {
                resolve(password);
            });
        }
        else
        {
            return vscode.window.showInputBox({'placeHolder': 'password', 'prompt': 'Enter Device Password'});
        }
    }

    public GetExtensionInfo()
    {
        const ext = vscode.extensions.getExtension('ms-iot.windowsiot');
        iotOutputChannel.show();
        iotOutputChannel.appendLine('ext.extensionPath=' + ext.extensionPath);
        // iotOutputChannel.appendLine('ext.exports=' + ext.exports);
        iotOutputChannel.appendLine('ext.id=' + ext.id);
        iotOutputChannel.appendLine('version=' + ext.packageJSON.version);
        iotOutputChannel.appendLine('');
        this.ListIotCommands();
    }

    public GetDeviceInfo(): Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/os/info';
            console.log ('url=' + url);

            const param = {'auth': {
                'user': this.user,
                'pass': this.password,
            }};

            request.get(url, param, (err, resp, body) => {
                if (!err && resp.statusCode === 200)
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
                    else if (resp && resp.statusCode !== 200)
                    {
                        const info = JSON.parse(body);
                        iotOutputChannel.appendLine(info.Reason + ' status=' + resp.statusCode);
                        iotOutputChannel.appendLine( '' );
                    }
                }
            });
        });
    }

    public GetNodeSourceInfo(architecture: string): Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            let nodeSourceInfo: any;
            if (architecture === 'x86')
            {
                nodeSourceInfo = nodeSource.x86;
            }
            else if (architecture === 'x64')
            {
                nodeSourceInfo = nodeSource.x64;
            }
            else if (architecture === 'arm')
            {
                nodeSourceInfo = nodeSource.arm;
            }

            if (nodeSourceInfo !== null)
            {
                console.log( 'architecture=' + architecture );
                resolve(nodeSourceInfo);
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

    public PrintMessage(message: string)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine(message);
    }

    public GetDeviceName(maxRetries: number): Promise<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/os/machinename';
            console.log ('url=' + url);

            const param = {'auth': {
                'user': this.user,
                'pass': this.password,
            }};

            let retries = maxRetries;
            let host = this.host;

            /* tslint:disable:only-arrow-functions */
            (function GetDeviceNameCallback(){
                /* tslint:enable:only-arrow-functions */
                request.get(url, param, (err, resp, body) => {
                    if (!err && resp.statusCode === 200)
                    {
                        const info = JSON.parse(body);
                        let message = `Get Device Name:\nDevice=${host}\nComputerName=${info.ComputerName}\n`;
                        resolve(message);
                    }
                    else
                    {
                        --retries;
                        if (retries < 0)
                        {
                            if (err){
                                console.log(err.message);
                                reject(err.message);
                            }
                            else if (resp && resp.statusCode !== 200)
                            {
                                const info = JSON.parse(body);
                                const message = info.Reason + ' status=' + resp.statusCode;
                                reject(message);
                            }
                        }
                        setTimeout(GetDeviceNameCallback, 1000);
                    }
                });
            })();
        });
    }

    public static ListDevicesCallback()
    {
        iotOutputChannel.appendLine('List IoT Devices');
        const spaces = '                                                                           ';
        let col1 = 0;
        let hostWidth = 0;
        let modelWidth = 0;

        // remove devices which haven't been seen recently
        const maxAge = 10 * 1000;
        let ageThreshold = Number(new Date()) - maxAge;
        IotDevice.iotDeviceList.forEach( (info: HostInfo, index: string, map: Map<string, HostInfo>) =>
        {
            if (info.seen < ageThreshold)
            {
                map.delete(index);
            }
        });

        // adjust col1 width
        IotDevice.iotDeviceList.forEach( (info, index, map) =>
        {
            col1 = (col1 > index.length) ? col1 : index.length;
        });
        col1 = (spaces.length < col1 + 2) ? spaces.length : (col1 + 2);

        // adjust host width
        IotDevice.iotDeviceList.forEach( (info, index, map) =>
        {
            hostWidth = (hostWidth > info.host.length) ? hostWidth : info.host.length;
        });
        hostWidth = (spaces.length < hostWidth + 2) ? spaces.length : (hostWidth + 2);

        // adjust model width
        IotDevice.iotDeviceList.forEach( (info, index, map) =>
        {
            modelWidth = (modelWidth > info.model.length) ? modelWidth : info.model.length;
        });
        modelWidth = (spaces.length < modelWidth + 2) ? spaces.length : (modelWidth + 2);

        IotDevice.iotDeviceList.forEach( (info, index, map) =>
        {
            col1 = (col1 > index.length) ? col1 : index.length;
        });
        col1 = (spaces.length < col1 + 2) ? spaces.length : (col1 + 2);

        const config = vscode.workspace.getConfiguration('iot');
        let deviceFilter: string = config.get('Device.ListFilter', '');
        iotOutputChannel.show();
        IotDevice.iotDeviceList.forEach( (info, index, map) =>
        {
            if (!deviceFilter ||
                ((index.indexOf(deviceFilter) >= 0) ||
                (IotDevice.iotDeviceList.get(index).host.indexOf(deviceFilter) >= 0)))
            {
                iotOutputChannel.append(index);
                iotOutputChannel.append(spaces.substr(0, col1 - index.length));
                iotOutputChannel.append(map.get(index).host);
                iotOutputChannel.append(spaces.substr(0, hostWidth - map.get(index).host.length));
                iotOutputChannel.append(map.get(index).model);
                iotOutputChannel.append(spaces.substr(0, modelWidth - map.get(index).model.length));
                iotOutputChannel.append(map.get(index).arch);
                iotOutputChannel.append(spaces.substr(0, archLen - map.get(index).arch.length));
                iotOutputChannel.append(map.get(index).mac);
                iotOutputChannel.append(spaces.substr(0, macLen - map.get(index).mac.length));
                // iotOutputChannel.append(map.get(index).id);
                // iotOutputChannel.append(spaces.substr(0, idLen-map.get(index).id.length));
                // iotOutputChannel.append(map.get(index).version);
                // iotOutputChannel.append(spaces.substr(0, versionLen-map.get(index).version.length));
                iotOutputChannel.appendLine('');
            }
        });
        iotOutputChannel.appendLine('');
    }

    public static ListDevices()
    {
        // if the list is empty wait 3 seconds,
        // otherwise this doesn't work if it's the first command
        if (IotDevice.iotDeviceList.size === 0)
        {
            iotOutputChannel.show();
            iotOutputChannel.appendLine('Initializing device list...\n');
        }
        setTimeout(IotDevice.ListDevicesCallback, (IotDevice.iotDeviceList.size > 0) ? 0 : 10 * 1000);
    }

    private static UnpackEbootBuffer (buffer: Uint8Array)
    {
        let data = new Buffer(buffer);
        let s = data.toString( 'ucs2');

        let host = s.substr(hostOffset, hostLen);
        let i = host.indexOf('\0');
        host = host.substr(0, i);

        let ipv4 = s.substr(ipv4Offset, ipv4Len);
        i = ipv4.indexOf('\0');
        ipv4 = ipv4.substr(0, i);

        let mac = s.substr(macOffset, macLen);
        i = mac.indexOf('\0');
        mac = mac.substr(0, i);

        let id = s.substr(idOffset, idLen);
        i = id.indexOf('\0');
        id = id.substr(0, i);

        let model = s.substr(modeOffset, modelLen);
        i = model.indexOf('\0');
        model = model.substr(0, i);

        let version = s.substr(versionOffset, versionLen);
        i = version.indexOf('\0');
        version = version.substr(0, i);

        let arch = s.substr(archOffset, archLen);
        i = arch.indexOf('\0');
        arch = arch.substr(0, i);

        IotDevice.iotDeviceList.set(ipv4, new HostInfo(host, Number(new Date()), mac, id, model, version, arch));
    }

    public static ListenEbootPinger()
    {
        if (!IotDevice.listeningForEboot)
        {
            IotDevice.listeningForEboot = true;
            IotDevice.iotDeviceList = new Map<string, HostInfo>();

            /* tslint:disable:only-arrow-functions */
            const s = dgram.createSocket('udp4');
            s.on('listening', () => {
                let address = s.address();
                console.log('UDP Client listening on ' + address.address + ':' + address.port);
            });

            s.on('message', (message, remote) => {
                IotDevice.UnpackEbootBuffer(message);
            });

            s.bind(6, () => {
                s.setBroadcast(true);
                s.setMulticastTTL(128);
                s.addMembership('239.0.0.222');
            });
            /* tslint:enable:only-arrow-functions */
        };
    }

    public SetDeviceName(): Thenable<any>
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/iot/device/name?newdevicename=' +
                new Buffer(this.devName).toString('base64');

            console.log ('url=' + url);

            const param = {'auth': {
                'user': this.user,
                'pass': this.password,
            }};

            iotOutputChannel.show();
            request.post(url, param, (err, resp, body) => {
                if (!err && resp.statusCode === 200)
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

                    if (resp.statusCode !== 200)
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
                'pass': this.password,
            }};

            iotOutputChannel.show();
            iotOutputChannel.appendLine(`Restarting device...`);
            iotOutputChannel.appendLine( '' );
            const restarturl = 'http://' + this.host + ':8080/api/control/restart';
            request.post(restarturl, param, (err, resp, body) => {
                if (!err && resp.statusCode === 200)
                {
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

    public FindFilesToUpload(): Promise<any>
    {
        return new Promise<any> ((resolve, reject) => {
            iotOutputChannel.appendLine('Locating files to upload in workspace.');

            const config = vscode.workspace.getConfiguration('iot');
            let files: any = config.get('Deployment.Workspace.Files', '');
            if (!files)
            {
                // todo - get "main" from package.json?
                reject('Please specify files to upload in settings.json - iot.Deployment.Files');
            }

            let foundFiles: any = [];
            Promise.all(files.map((item) => {
                return vscode.workspace.findFiles(`${item}`, '');
            }))
            .then((result: vscode.Uri[][]) => {
                for (let i = 0; i < result.length; i++)
                {
                    for (let j = 0; j < result[i].length; j++)
                    {
                        foundFiles.push(result[i][j]);
                    }
                }

                resolve(foundFiles);
            }, (err) => {
                iotOutputChannel.appendLine('ERROR: err');
            });
        });
    }

    public FindNodeFilesToUpload(architecture : string): Promise<any>
    {
        return new Promise<any> ((resolve, reject) => {
            iotOutputChannel.appendLine('Locating node files to upload.');

            let files: any;
            const config = vscode.workspace.getConfiguration('iot');
            const source = config.get('Deployment.Nodejs.Source');

            if (!source)
            {
                // Use node-chakracore from Azure. 
                const ext: any = vscode.extensions.getExtension('ms-iot.windowsiot');
                const nodeFolder: string  = `${ext.extensionPath}\\${architecture}\\`;
                files = fileHelper.GetFilesInDirectory(nodeFolder).map(vscode.Uri.file);
                resolve(files);
            }
            else
            {
                files = fileHelper.GetFilesInDirectory(source).map(vscode.Uri.file);
                resolve(files);
            }
        });
    }


    public sftpUpload(uriList: vscode.Uri[], ow: boolean, src: any, dest: string, callback: any): Promise<string>
    {
        return new Promise<string> ((resolve, reject) => {
            let options = {
                // debug: (msg) => { console.log(msg); },
                host: this.host,
                username: this.user,
                password: this.password,
                path: src,
                remoteDir: dest,
                overwrite: ow,
            };

            let fileList = [];
            uriList.forEach((iotFile) => {
                if (iotFile.fsPath.length > MAX_PATH)
                {
                    reject(`ERROR: Filename too long ${iotFile.fsPath} (${iotFile.fsPath.length})`);
                }
                fileList.push(iotFile.fsPath);
            });

            if (!IotDevice.fileMap)
            {
                IotDevice.fileMap = new Map<string, any>();
            }

            let sftp = new sftpHelper(options);
            sftp.on('error', (err) => {
                reject(err);
            })
            .on('uploading', (pgs) => {
                callback(`[${pgs.percent}%] Uploading ${pgs.file}`);
                let stats = fs.statSync(pgs.file);
                IotDevice.fileMap.set(pgs.file, stats.ctime);
            })
            .on('completed', () => {
                resolve('Upload Completed\n');
                console.log(`tracking ${IotDevice.fileMap.size} files`);
            })
            .uploadWorkspaceFiles(fileList, IotDevice.fileMap);
        });
    }

    private GetNodeFilesFromAzure(architecture: string, nodeSourceInfo: any): Promise<string>
    {
        const ext = vscode.extensions.getExtension('ms-iot.windowsiot');
        const nodeFolder = `${ext.extensionPath}\\${architecture}\\${nodeVersion}\\`;
        let downloadRequired: boolean = false;

        nodeSourceInfo.blobs.forEach( (uri) => {
            let filename = nodeFolder + urlx.parse(uri).pathname.split('/').pop();
            if (!fileHelper.FileExists(filename))
            {
                downloadRequired = true;
            }
        });

        if (downloadRequired)
        {
            let chain: any = new Promise<string>( (res, rej) => {res('Downloading resources:'); });
            nodeSourceInfo.blobs.forEach( (uri) => {
                chain = chain.then((message) => {
                    iotOutputChannel.appendLine(message);
                    let filename: string = nodeFolder + urlx.parse(uri).pathname.split('/').pop();
                    return httpHelper.GetFileIfNotFound(uri, filename);
                }, (err) => {
                    iotOutputChannel.appendLine('ERROR: ' + err);
                });
            });
            return chain;
        }
        else
        {
            return new Promise<string> ((resolve, reject) => {
                resolve(null);
            });
        }
    }

    public UploadWorkspaceFiles(callback: any)
    { 
        return this.FindFilesToUpload().then((uri: vscode.Uri[]) => {
            const config = vscode.workspace.getConfiguration('iot');
            const destination = config.get('Deployment.Workspace.Destination') as string;
            return this.sftpUpload(uri, false, vscode.workspace.rootPath, destination, callback);
        });
    }

    public UploadNode(callback: any)
    {
        let architecture: string;

        return this.GetDeviceInfo().then((info) => {
            architecture = this.ArchitectureFromDeviceInfo(info);
            return this.GetNodeSourceInfo(architecture);
        })
        .then ((nodeSourceInfo: any) => {
            return this.GetNodeFilesFromAzure(architecture, nodeSourceInfo);
        })
        .then((message) => {
            if (message)
            {
                iotOutputChannel.appendLine(message);
                iotOutputChannel.appendLine('Download complete');
            }
            return this.FindNodeFilesToUpload(architecture);
        })
        .then((uri: vscode.Uri[]) => {
            const ext  = vscode.extensions.getExtension('ms-iot.windowsiot');
            const config = vscode.workspace.getConfiguration('iot');
            const destination = config.get('Deployment.Nodejs.Destination') as string;
            let source: string = config.get('Deployment.Nodejs.Source') as string;

            if (!source)
            {
                source = `${ext.extensionPath}\\${architecture}\\`;
            }        
            
            return this.sftpUpload(uri, true, source, destination, callback);
        });
    }

    public GetProcessInfo()
    {
        return new Promise<any>( (resolve, reject) =>
        {
            const url = 'http://' + this.host + ':8080/api/resourcemanager/processes';
            console.log ('url=' + url);

            const param = {'auth': {
                'user': this.user,
                'pass': this.password,
            }};

            request.get(url, param, (err, resp, body) => {
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

    private OpenWorkspaceFile(fileName: string): Promise<vscode.TextEditor>
    {
        return new Promise<vscode.TextEditor> ((resolve, reject) => {
            vscode.workspace.findFiles(`.vscode/${fileName}`, '', 1)
            .then((results) => {
                results.forEach( (r) => {
                    vscode.workspace.openTextDocument(r)
                    .then((doc: any) => {
                        vscode.window.showTextDocument(doc).then((editor: vscode.TextEditor) => {
                            resolve(editor);
                        });
                    });
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    public InitWorkspace(): Promise<string>
    {
        this.InitSettingsJson()
        .then((resolve) => {
            return this.InitLaunchJson();
        })
        .then((resolve) => {
            return this.InitNodeRemoteDebug();
        })
        .then((resolve) => {
            this.PrintMessage(resolve);
        });
    }

    private InitSettingsJson(): Promise<string>
    {
        return new Promise((resolve, reject) => {
            let vscodeDir = vscode.workspace.rootPath + '/.vscode';
            let settingsJson = vscodeDir + '/settings.json';

            if (!fileHelper.DirectoryExists(vscodeDir))
            {
                fs.mkdirSync(vscodeDir);
            }

            // Update settings.json file
            if (fileHelper.FileExists(settingsJson))
            {
                this.PrintMessage('WARNING: settings.json found.\nTo generate the template settings.json delete your current settings.json before running this command.\n');
                resolve();
            }
            else
            {
                let newSettings: any = defaultSettings;
                newSettings.iot.Device.IpAddress = this.host;
                newSettings.iot.Device.DeviceName = this.devName;
                newSettings.iot.Device.UserName = this.user;
                newSettings.iot.Device.Password = this.password;
                const destination = `c${vscode.workspace.rootPath.substr(1, vscode.workspace.rootPath.length)}`;
                newSettings.iot.Deployment.Workspace.Destination = destination;
                const nodeDestination = defaultSettings.iot.Deployment.Nodejs.Destination;

                // todo: try to get 'app.js' name from package.json either from main or start.
                newSettings.iot.RunCommands = [`${nodeDestination}\\${nodeVersion}\\node.exe ${destination}\\nodeRemoteDebug.js -breakatentrypoint ${destination}\\app.js`]

                fs.writeFile(settingsJson, JSON.stringify(defaultSettings, null, 2), (writeFileErr) => {
                    if (writeFileErr)
                    {
                        this.PrintMessage(writeFileErr.message);
                        reject();
                    }
                    else
                    {
                        this.OpenWorkspaceFile('settings.json')
                        .then((editor: vscode.TextEditor) => {
                            this.PrintMessage('settings.json created\n');
                            resolve();
                        }, (openSettingsErr) => {
                            this.PrintMessage(openSettingsErr.message);
                            reject();
                        });
                    }
                });
            }
        });
    }

    private InitNodeRemoteDebug(): Promise<string>
    {
        return nodeDebugHelper.CopyRemoteDebugScriptToWorkspace();
    }

    private InitLaunchJson(): Promise<string>
    {
        return new Promise((resolve, reject) => {
            const vscodeDir = vscode.workspace.rootPath + '/.vscode';
            const launchJson = path.join(vscodeDir, 'launch.json');

            if (!fileHelper.DirectoryExists(vscodeDir))
            {
                fs.mkdirSync(vscodeDir);
            }

            // Update launch.json file. User needs to have ran the 'Debug: Open launch.json' command.
            if (fileHelper.FileExists(launchJson))
            {
                let launchJsonContent: any = stripJsonComments(fs.readFileSync(launchJson).toString());
                let makeupdate: boolean = true;
                launchJsonContent = JSON.parse(launchJsonContent);

                for (let i = 0; i < launchJsonContent.configurations.length; i++)
                {
                    if (launchJsonContent.configurations[i].name === 'Attach to Process (IoT)')
                    {
                        makeupdate = false;
                        break;
                    }
                }

                if(makeupdate)
                {
                    let iotLaunchConfig = {
                        "type": "node",
                        "request": "attach",
                        "name": "Attach to Process (IoT)",
                        "port": 5858,
                        "address": `${this.devName}`,
                        "localRoot": `${vscode.workspace.rootPath}`,
                        "remoteRoot": `c${vscode.workspace.rootPath.substr(1, vscode.workspace.rootPath.length)}`
                    };

                    launchJsonContent.configurations.push(iotLaunchConfig);

                    fs.writeFile(launchJson, JSON.stringify(launchJsonContent, null, 2), (writeFileErr) => {
                        if (writeFileErr)
                        {
                            this.PrintMessage('writeFileErr.message\n');
                            reject();
                        }
                        else
                        {
                            this.OpenWorkspaceFile('launch.json')
                            .then((editor: vscode.TextEditor) => {
                                this.PrintMessage('launch.json updated\n');
                                resolve();
                            }, (openSettingsErr) => {
                                this.PrintMessage(openSettingsErr.message);
                                reject();
                            });
                        }
                    });
                }
                else
                {
                    this.PrintMessage('launch.json has already been updated\n');
                    resolve();
                }
            }
            else
            {
                this.PrintMessage('ERROR: launch.json found. Run the Debug:Open launch.json command for Node.js first.\n');
                reject();
            }
        });
    }

    public GetWorkspaceInfo()
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine(`rootpath=${vscode.workspace.rootPath}`);
        vscode.workspace.findFiles('**/*', '', null, null)
        .then((result: any) => {
            result.forEach( (r) => {
                iotOutputChannel.appendLine(r);
            });
            iotOutputChannel.appendLine('');
        });
    }

    public PrintProcessInfo(info: any)
    {
        iotOutputChannel.show();
        iotOutputChannel.appendLine( 'Get Process Info:');
        iotOutputChannel.appendLine( `Device=${this.host}` );

        info.Processes.forEach((proc) => {
            iotOutputChannel.appendLine( `${proc.ProcessId} ${proc.ImageName}` );
        });
    }

    public RunCommandInternal(command, resolve, reject, quiet)
    {
        const url =
            'http://' + this.host +
            ':8080/api/iot/processmanagement/runcommandwithoutput?command=' + new Buffer(command).toString('base64') +
            '&runasdefaultaccount=' + new Buffer('false').toString('base64') +
            '&timeout='  + new Buffer('300000').toString('base64');
        console.log ('url=' + url);

        const param = {'auth': {
            'user': this.user,
            'pass': this.password,
        }};

        request.post(url, param, (err, resp, body) => {
            if (err){
                console.log(err.message);
                reject(err.message);
            }
            else if (resp.statusCode !== 200)
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
        return new Promise<any> ((resolve, reject) => {
            vscode.window.showInputBox({'placeHolder': 'command to run', 'prompt': 'Enter Command to Run'})
            .then((command) => {
                iotOutputChannel.show();
                iotOutputChannel.appendLine(`Run ${command}`);
                this.RunCommandInternal(command, resolve, reject, false);
            });
        });
    }

    public RunCommandFromSettings()
    {
        return new Promise<any> ((resolve, reject) => {
            const config = vscode.workspace.getConfiguration('iot');
            let commands: any = config.get('RunCommands', '');
            if (!commands)
            {
                commands =
                [
                    'tlist'
                ];
            }
            vscode.window.showQuickPick(commands)
            .then((command) => {
                iotOutputChannel.show();
                iotOutputChannel.appendLine(`Run ${command}`);
                this.RunCommandInternal(command, resolve, reject, false);
            });
        });
    }

    public RunCommand(command: string, quiet: boolean): Promise<string>
    {
        return new Promise<any> ((resolve, reject) => {
            this.RunCommandInternal(command, resolve, reject, quiet);
        });
    }

    public ListIotCommands()
    {
        let ext = vscode.extensions.getExtension('ms-iot.windowsiot');
        iotOutputChannel.show();
        let commands = ext.packageJSON.contributes.commands;
        iotOutputChannel.appendLine('IoT Extension Commands:');
        commands.forEach((c) => {
            iotOutputChannel.appendLine(c.title);
        });
        iotOutputChannel.appendLine('');
    }
}
