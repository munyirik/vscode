'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import http = require('http');
var request = require('request');
import {IotDevice} from './iotDevice';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Windows Iot Core Extension for VS Code is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposableGetDeviceInfo = vscode.commands.registerCommand('extension.getDeviceInfo', () => {       
        let iotDevice = new IotDevice();
        iotDevice.GetDeviceInfo();       
    });
    context.subscriptions.push(disposableGetDeviceInfo);

    let disposableGetPackages = vscode.commands.registerCommand('extension.getPackages', () => {       
        let iotDevice = new IotDevice();
        iotDevice.GetPackages();       
    });
    context.subscriptions.push(disposableGetPackages);

    let disposableInstallPackage = vscode.commands.registerCommand('extension.installPackage', () => {       
        let iotDevice = new IotDevice();
        iotDevice.InstallPackage();       
    });
    context.subscriptions.push(disposableInstallPackage);
    
    let disposableListIotCommands =  vscode.commands.registerCommand('extension.listIotCommands', () => {
        let iotDevice = new IotDevice();
        iotDevice.ListIotCommands();       
    });
    context.subscriptions.push(disposableListIotCommands);

    let disposableUploadFile = vscode.commands.registerCommand('extension.uploadFile', () => {       
        let iotDevice = new IotDevice();
        iotDevice.UploadFile();
    });
    context.subscriptions.push(disposableUploadFile);
    
    let disposableGetDeviceName = vscode.commands.registerCommand('extension.getDeviceName', () => {       
        let iotDevice = new IotDevice();
        iotDevice.GetDeviceName();       
    });
    context.subscriptions.push(disposableGetDeviceName);

    let disposableSetDeviceName = vscode.commands.registerCommand('extension.setDeviceName', () => {
        let iotDevice = new IotDevice();
        iotDevice.SetDeviceName();       
    });
    context.subscriptions.push(disposableSetDeviceName);

    let disposableRunCommand = vscode.commands.registerCommand('extension.runCommand', () => {
        let iotDevice = new IotDevice();
        iotDevice.RunCommandFromSettings();       
    });
    context.subscriptions.push(disposableRunCommand);
    
    let disposableStartApp = vscode.commands.registerCommand('extension.startApp', () => {
        let iotDevice = new IotDevice();
        iotDevice.StartApp();       
    });
    context.subscriptions.push(disposableStartApp);

    let disposableStopApp = vscode.commands.registerCommand('extension.stopApp', () => {
        let iotDevice = new IotDevice();
        iotDevice.StopApp();       
    });
    context.subscriptions.push(disposableStopApp);   
}

// this method is called when your extension is deactivated
export function deactivate() {
}