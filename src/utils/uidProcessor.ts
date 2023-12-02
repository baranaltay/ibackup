import * as fs from 'node:fs';
import {
    BACKUP_FLAG_FOLDER,
    KNOWN_UIDS_FOLDER,
    LOG_FOLDER
} from "../config";

export function getBackupFlagPathFor(uid: string): string {
    return `${BACKUP_FLAG_FOLDER}/${uid}`;
}

export function getKnownUidPathFor(uid: string): string {
    return `${KNOWN_UIDS_FOLDER}/${uid}`;
}

export function getLogFileFor(cmdName: string): string {
    return `${LOG_FOLDER}/${cmdName}.log`;
}

export function getFileNameFromCmd(name: string, args: string[]): string {
    return `${name}_${args.map(x => x.replaceAll('\\', '#')).join('_')}`;
}

export function isBackupFlagPresentFor(uid: string): boolean {
    const path = getBackupFlagPathFor(uid);
    if (fs.existsSync(path)) {
        let ticks = fs.readFileSync(path, 'utf-8');
        let lastBackupDate = new Date(ticks);
        let today = new Date();
        return lastBackupDate.getDate() == today.getDate() &&
            lastBackupDate.getFullYear() == today.getFullYear() &&
            lastBackupDate.getMonth() == today.getMonth();
    }

    return false;
}

export function createBackupFlagFor(uid: string) {
    let path = getBackupFlagPathFor(uid);
    fs.writeFileSync(path, new Date().toString());
}

export function createKnownUidFor(uid: string, name: string) {
    const path = getKnownUidPathFor(uid);
    console.log(`updating known name for ${uid} to ${name}`);

    if (!fs.existsSync(path)) {
        fs.closeSync(fs.openSync(path, 'w'));
        fs.writeFileSync(path, name.trim());
    }
}
