'use strict';

import * as vscode from 'vscode';
import {IotDevice} from './iotDevice';

const delay = require('delay');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Windows Iot Core Extension for VS Code is now active!');

    IotDevice.ListenEbootPinger();

    // The commands are defined in the package.json file
    // The commandId parameter must match the command field in package.json
    const disposableGetDeviceInfo = vscode.commands.registerCommand('extension.getDeviceInfo', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetDeviceInfo();
        }).then( (info: any) => {
            iotDevice.PrintDeviceInfo(info);
        })
    });
    context.subscriptions.push(disposableGetDeviceInfo);

    const disposableGetExtensionInfo = vscode.commands.registerCommand('extension.getExtensionInfo', () => {       
        const iotDevice = new IotDevice();
        iotDevice.GetExtensionInfo();
    });
    context.subscriptions.push(disposableGetExtensionInfo);

    const disposableGetPackages = vscode.commands.registerCommand('extension.getPackages', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetPackages();
        }).then( (info: any) => {
            iotDevice.PrintPackages(info);
        })       
    });
    context.subscriptions.push(disposableGetPackages);

    const disposableGetAppxProcessInfo = vscode.commands.registerCommand('extension.getAppxProcessInfo', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetProcessInfo();
        }).then( (info: any) => {
            iotDevice.PrintProcessInfo(info, true);
        })
        
    });

    context.subscriptions.push(disposableGetAppxProcessInfo);

    const disposableGetProcessInfo = vscode.commands.registerCommand('extension.getProcessInfo', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetProcessInfo();
        }).then( (info: any) => {
            iotDevice.PrintProcessInfo(info, false);
        })
        
    });
    context.subscriptions.push(disposableGetProcessInfo);

    const disposableGetWorkspaceInfo = vscode.commands.registerCommand('extension.getWorkspaceInfo', () => {       
        const iotDevice = new IotDevice();
        return iotDevice.GetWorkspaceInfo();       
    });
    context.subscriptions.push(disposableGetWorkspaceInfo);

    const disposableUploadFile = vscode.commands.registerCommand('extension.uploadWorkspaceFiles', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            iotDevice.UploadWorkspaceFiles();
        });
    });
    context.subscriptions.push(disposableUploadFile);
    
    const disposableGetDeviceName = vscode.commands.registerCommand('extension.getDeviceName', () => {       
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetDeviceName(0);
        })
        .then((message: string) =>{
            iotDevice.PrintMessage(message);
        }, function(err){
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableGetDeviceName);

    const disposableListenEbootPinger = vscode.commands.registerCommand('extension.listDevices', () => {
        IotDevice.ListDevices();
    });
    context.subscriptions.push(disposableListenEbootPinger);

    const disposableSetDeviceName = vscode.commands.registerCommand('extension.setDeviceName', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.SetDeviceName();
        })
        .then((res :any)=>{
            return iotDevice.RestartDevice();
        })
        .then(delay(5000)) // wait for device to reboot, otherwise the name is retrieved before reboot.
        .then((message:string) =>{
            return iotDevice.GetDeviceName(30);
        })
        .then( (message :string) => {
            iotDevice.PrintMessage(message);
            iotDevice.PrintMessage("\nDevice is running\n")
        }, function (err){
            iotDevice.PrintMessage(err);
            iotDevice.PrintMessage("\nDevice not found\n")
        });
    });
    context.subscriptions.push(disposableSetDeviceName);

    const disposableRestartDevice = vscode.commands.registerCommand('extension.restartDevice', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RestartDevice();
        })
        .then(delay(5000)) // wait for device to reboot, otherwise the name is retrieved before reboot.
        .then((message:string) =>{
            return iotDevice.GetDeviceName(30);
        })
        .then( (message :string) => {
            iotDevice.PrintMessage(message);
            iotDevice.PrintMessage("\nDevice is running\n")
        }, function(err){
            iotDevice.PrintMessage(err);
            iotDevice.PrintMessage("\nDevice not found\n")
        });
    });
    context.subscriptions.push(disposableRestartDevice);

    const disposableRunCommand = vscode.commands.registerCommand('extension.runCommand', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RunCommandFromPrompt();
        })
        .then((message) =>{
            iotDevice.PrintMessage(message);
        }, function(err){
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableRunCommand);

    const disposableRunCommandFromSettings = vscode.commands.registerCommand('extension.runCommandFromSettings', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RunCommandFromSettings();
        })
        .then((message) =>{
            iotDevice.PrintMessage(message);
        }, function(err){
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableRunCommandFromSettings);
    
    const disposableRunRemoteScript = vscode.commands.registerCommand('extension.runRemoteScript', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b :boolean) => {
            iotDevice.RunRemoteScript();
        })
    });
    context.subscriptions.push(disposableRunRemoteScript);

    const disposableStartNodeScriptHostopApp = vscode.commands.registerCommand('extension.startNodeScriptHost', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) =>{
            iotDevice.StartNodeScriptHost();
        })
    });
    context.subscriptions.push(disposableStartNodeScriptHostopApp);

    const disposableStopNodeScriptHost = vscode.commands.registerCommand('extension.stopNodeScriptHost', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            iotDevice.StopNodeScriptHost();
        });
    });
    context.subscriptions.push(disposableStopNodeScriptHost);
}

// this method is called when your extension is deactivated
export function deactivate() {
}