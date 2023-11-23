import * as fs from 'node:fs';
import { PIDS_FOLDER, BACKUP_FLAG_PATH, BACKUP_FOLDER, LOGS_FOLDER } from "../config";
import { spwn } from "./spwn";

export function getPidFileNameFor(cmdName: string): string {
    return `${PIDS_FOLDER}/${cmdName}.pid`;
}

export function getBackupFlagPathFor(uid: string): string {
    return `${BACKUP_FLAG_PATH}/${uid}`;
}

export function getBackupFolderFor(uid: string): string {
    return `${BACKUP_FOLDER}/${uid}`;
}

export function getLogFileFor(cmdName: string): string {
    const date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return `${LOGS_FOLDER}/${today}__${cmdName}.log`;
}

export function isBackupExistsFor(uid: string): boolean {
    const backupFolder = getBackupFolderFor(uid);
    return fs.existsSync(backupFolder);
}

export function isBackupFlagPresentFor(uid: string): boolean {
    const path = getBackupFlagPathFor(uid);
    if (fs.existsSync(path)) {
        let ticks = fs.readFileSync(path, 'utf-8');
        const lastBackupDate = new Date(parseInt(ticks));
        const today = new Date();
        return lastBackupDate.getDate() == today.getDate();
    }

    return false;
}

export function createBackupFlagFor(uid: string) {
    let path = getBackupFlagPathFor(uid);
    fs.writeFileSync(path, Date.now().toString());
}


export function deleteBackupFlagsForUids(uids: string[]) {
    for (let i = 0; i < uids.length; i++) {
        const uid = uids[i];
        const backupFlag = getBackupFlagPathFor(uid);
        if (fs.existsSync(backupFlag)) {
            console.log(`backup flag found for ${uid}, removing...`);
            fs.unlinkSync(backupFlag);
        }
    }
}