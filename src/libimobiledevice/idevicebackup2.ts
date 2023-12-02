import * as fs from 'node:fs';
import { spawn } from "node:child_process";
import { BACKUP_FOLDER } from "../config";
import { sanitizeFileName } from "../utils/filenameSanitizer";
import { getFileNameFromCmd, getLogFileFor } from "../utils/uidProcessor";

const CMD = 'idevicebackup2';
function getCmdArgs(uid: string): string[] {
    return ['-u', uid.toString(), '-n', 'backup', '--full', BACKUP_FOLDER];
}

interface BackupResult {
    code: number,
    stderr: string
}

export async function startBackupForAsync(uid: string): Promise<BackupResult> {
    let args = getCmdArgs(uid);
    let fileName = getFileNameFromCmd(CMD, args);
    fileName = sanitizeFileName(fileName, '_');
    let logFile = getLogFileFor(fileName);

    let logStream = fs.createWriteStream(logFile, { flags: 'a' });

    return new Promise(function (resolve, reject) {
        let stderr = '';

        let cmd = spawn(CMD, args);
        cmd.stdout.pipe(logStream);
        cmd.stderr.on('data', function (chunk) {
            let log = chunk.toString();
            stderr += log + '\n';
            logStream.write(log);
        });

        cmd.on('exit', function (code) {
            logStream.end();
            resolve({code: code || -1, stderr});
        });
    });
}