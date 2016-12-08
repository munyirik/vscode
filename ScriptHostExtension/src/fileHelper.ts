'use strict';

const fs = require('fs');
const path = require('path');
var fse = require('fs-extra')

export class FileHelper
{
    public static FileExists(filename: string): boolean
    {
        try{
            if (fs.statSync(filename).isFile())
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        catch (ex)
        {
            return false;
        }
    }

    public static DirectoryExists(dir: string): boolean
    {
        try{
            if (fs.statSync(dir).isDirectory())
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        catch (ex)
        {
            return false;
        }
    }

    public static FileFromPath(filePath: string): string
    {
        const filename = filePath.replace(/^.*[\\\/]/, '');
        return filename;
    }

    public static GetFilesInDirectory(dir: string): any
    {
        if(FileHelper.DirectoryExists(dir))
        {
            return fse.walkSync(dir);
        }
    }
}
