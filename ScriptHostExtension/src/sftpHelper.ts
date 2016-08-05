'use strict';

// sftpHelper.ts is based on sftp-upload 
// see: https://www.npmjs.com/package/sftp-upload

const fs = require('fs');
const path = require('path');
const scp2Client = require('scp2').Client;
const async = require('async');
const events = require('events');
const util = require('util');
const extend = require('node.extend');

/* tslint:disable:only-arrow-functions */
function SftpHelper (options){
    'use strict';

    let defaultOptions = {
        port: 22,
        username: '',
        host: '',
        privateKey: '',
        path: '/',
        remoteDir: '/C/data/users/Administrator/documents',
    };

    this.uploads = [];

    events.EventEmitter.call(this);

    let self = this;
    this.defaults = extend(defaultOptions, options);
       if (!fs.existsSync(self.defaults.path)){
           let e = new Error(self.defaults.path + ' does not exist');
        self.emit('error', e);
    }

    return this;
};

util.inherits(SftpHelper, events.EventEmitter);

SftpHelper.prototype.addFiles = function(files, baseDir, uploads, fileMap){
    let self = this;
    files.forEach(function(file){
        let currentFile = path.resolve(baseDir, file);
        let stats = fs.statSync(currentFile);

        if (stats.isFile()){
            let mapHasFile = fileMap.has(currentFile);
            let timediff = -1;
            if (mapHasFile)
            {
                 timediff = stats.ctime - fileMap.get(currentFile);
            }
            if (!mapHasFile || (timediff !== 0))
            {
                fileMap.set(currentFile, stats.ctime);
                uploads.push(currentFile);
            }
        }

        if (stats.isDirectory()){
            let workingFolder = path.resolve(baseDir, currentFile);
            self.addFiles(fs.readdirSync(workingFolder), workingFolder, uploads, fileMap);
        }
    });
};

SftpHelper.prototype.addFilesFromList = function(uploads, fileList, fileMap){
    fileList.forEach(function(currentFile){
        let stats = fs.statSync(currentFile);

        if (stats.isFile()){
            let mapHasFile = fileMap.has(currentFile);
            let timediff = -1;
            if (mapHasFile)
            {
                 timediff = stats.ctime - fileMap.get(currentFile);
            }
            if (!mapHasFile || (timediff !== 0))
            {
                fileMap.set(currentFile, stats.ctime);
                uploads.push(currentFile);
            }
        }
    });
};

SftpHelper.prototype.uploadFiles = function(files, opt){
    let fns = [];
    let client = new scp2Client(opt);
    let totalFiles = files.length;
    let pendingFiles = 0;
    let self = this;

    client.on('connect', function(){
        self.emit('connect');
    });

    files.forEach(function(file){
        fns.push(
            function(cb){
                let localFile = path.relative(opt.path, file);
                let remoteFile = path.join(opt.remoteDir, localFile);
                client.upload(file, remoteFile, function(err){
                    pendingFiles += 1;
                    self.emit('uploading', {
                        file: file,
                        percent: Math.round((pendingFiles * 100) / totalFiles),
                    });
                    cb(err);
                });
            }
        );
    });

    async.series(fns, function(err, cb){
        if (err){
            self.emit('error', err);
        }
        self.emit('completed');
        client.close();
    });
};

SftpHelper.prototype.uploadWorkspaceFiles = function(fileList, fileMap){
    let self = this;
    let opt = self.defaults;
    this.addFilesFromList(self.uploads, fileList, fileMap);
    this.uploadFiles(self.uploads, opt);
    return this;
};

module.exports = SftpHelper;
