'use strict';

import * as vscode from 'vscode';

const fs = require('fs-extra');
const path = require('path');
const fileHelper = require('./fileHelper').FileHelper;

export class NodeDebugHelper
{
    public static CopyRemoteDebugScriptToWorkspace(): Promise<string>
    {
        return new Promise((resolve, reject) => {
            const ext: any  = vscode.extensions.getExtension('ms-iot.windowsiot');
            // todo - is there a way not to hardcode 'out\src'?
            const source: string = path.join(ext.extensionPath, '\\out\\src\\nodeRemoteDebug.js');

            try
            {
                const dest = path.join(vscode.workspace.rootPath, 'nodeRemoteDebug.js')
                if (!fileHelper.FileExists(dest))
                {
                    fs.copySync(source, dest);
                    resolve('nodeRemoteDebug.js copied to workspace\n');
                }
                else
                {
                    resolve('nodeRemoteDebug.js already exists in the workspace\n');
                }
            }
            catch (err)
            {
                reject(err);
            }
        });
    }
}
