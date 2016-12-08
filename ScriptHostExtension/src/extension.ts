'use strict';

import {IotDevice} from './iotDevice';
import * as vscode from 'vscode';

const delay = require('delay');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/* tslint:disable:only-arrow-functions */
export function activate(context: vscode.ExtensionContext) {
    'use strict';
    /* tslint:enable:only-arrow-functions */

    // use the console to output diagnostic information (console.log) and errors (console.error)
    // this line of code will only be executed once when your extension is activated
    console.log('Windows Iot Core Extension for VS Code is now active!');

    // todo: conditionally contribute commands if debugger is attached?    
    // let debug = typeof global.v8debug === 'object';
    // const iotDevice = new IotDevice();
    // iotDevice.PrintMessage(`Running under the debugger = ${debug}\n`);

    IotDevice.ListenEbootPinger();

    // the commands are defined in the package.json file
    // the commandId parameter must match the command field in package.json
    const disposableGetDeviceInfo = vscode.commands.registerCommand('extension.getDeviceInfo', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetDeviceInfo();
        }).then( (info: any) => {
            iotDevice.PrintDeviceInfo(info);
        });
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
        });
    });
    context.subscriptions.push(disposableGetPackages);

    const disposableGetProcessInfo = vscode.commands.registerCommand('extension.getProcessInfo', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetProcessInfo();
        }).then( (info: any) => {
            iotDevice.PrintProcessInfo(info);
        });

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
            iotDevice.PrintMessage('Upload Workspace Files:');
            return iotDevice.UploadWorkspaceFiles( (m) => {
                iotDevice.PrintMessage(m);
            });
        })
        .then((message: string) => {
            iotDevice.PrintMessage(message);
        }, (err) => {
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableUploadFile);

    const disposableUploadNode = vscode.commands.registerCommand('extension.uploadNode', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            iotDevice.PrintMessage('Upload Node:');
            return iotDevice.UploadNode( (m) => {
                iotDevice.PrintMessage(m);
            });
        })
        .then((message: string) => {
            iotDevice.PrintMessage(message);
        }, (err) => {
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableUploadNode);

    const disposableGetDeviceName = vscode.commands.registerCommand('extension.getDeviceName', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.GetDeviceName(0);
        })
        .then((message: string) => {
            iotDevice.PrintMessage(message);
        }, (err) => {
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableGetDeviceName);

    const disposableInitWorkspace = vscode.commands.registerCommand('extension.initWorkspace', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.InitWorkspace();
        });
    });
    context.subscriptions.push(disposableInitWorkspace);

    const disposableListDevices = vscode.commands.registerCommand('extension.listDevices', () => {
        IotDevice.ListDevices();
    });
    context.subscriptions.push(disposableListDevices);

    const disposableSetDeviceName = vscode.commands.registerCommand('extension.setDeviceName', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.SetDeviceName();
        })
        .then((res: any) => {
            return iotDevice.RestartDevice();
        })
        .then(delay(5000)) // wait for device to reboot, otherwise the name is retrieved before reboot.
        .then((message: string) => {
            return iotDevice.GetDeviceName(30);
        })
        .then( (message: string) => {
            iotDevice.PrintMessage(message);
            iotDevice.PrintMessage('\nDevice is running\n');
        },  (err) => {
            iotDevice.PrintMessage(err);
            iotDevice.PrintMessage('\nDevice not found\n');
        });
    });
    context.subscriptions.push(disposableSetDeviceName);

    const disposableRestartDevice = vscode.commands.registerCommand('extension.restartDevice', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RestartDevice();
        })
        .then(delay(5000)) // wait for device to reboot, otherwise the name is retrieved before reboot.
        .then((message: string) => {
            return iotDevice.GetDeviceName(30);
        })
        .then( (message: string) => {
            iotDevice.PrintMessage(message);
            iotDevice.PrintMessage('\nDevice is running\n');
        }, (err) => {
            iotDevice.PrintMessage(err);
            iotDevice.PrintMessage('\nDevice not found\n');
        });
    });
    context.subscriptions.push(disposableRestartDevice);

    const disposableRunCommand = vscode.commands.registerCommand('extension.runCommand', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RunCommandFromPrompt();
        })
        .then((message) => {
            iotDevice.PrintMessage(message);
        }, (err) => {
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableRunCommand);

    const disposableRunCommandFromSettings = vscode.commands.registerCommand('extension.runCommandFromSettings', () => {
        const iotDevice = new IotDevice();
        iotDevice.Init().then((b: boolean) => {
            return iotDevice.RunCommandFromSettings();
        })
        .then((message) => {
            iotDevice.PrintMessage(message);
        }, (err) => {
            iotDevice.PrintMessage(err);
        });
    });
    context.subscriptions.push(disposableRunCommandFromSettings);
}

// this method is called when your extension is deactivated
/* tslint:disable:only-arrow-functions */
/* tslint:disable:no-empty */
export function deactivate() {
    'use strict';
}
/* tslint:enable:only-arrow-functions */
/* tslint:enable:no-empty */
