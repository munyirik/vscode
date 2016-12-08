'use strict';

const fileHelper = require('./fileHelper').FileHelper;
const fs = require('fs');
const fse = require('fs-extra');
const http = require('http');
const path = require('path');
const url = require('url');

export class HttpHelper
{
    public static GetFileIfNotFound(uri: string, filename: string): Promise<string>
    {
        return new Promise<string> ((resolve, reject) => {
            if (fileHelper.FileExists(filename))
            {
                resolve('File already exists: ' + filename);
                return;
            }

            const targetDir = path.dirname(filename);

            if (!fileHelper.DirectoryExists(targetDir))
            {
                fse.mkdirsSync(targetDir);
            }

            const options = {
                host: url.parse(uri).host,
                port: 80,
                path: url.parse(uri).pathname,
            };

            const file = fs.createWriteStream(filename);

            http.get(options, (res) => {
                res.on('data', (data) => {
                    file.write(data);
                }).on('end', () => {
                    file.end();
                    let result = filename;
                    resolve(result);
                }).on('error', (err) => {
                    reject(err);
                });
            });
        });
    }
}
