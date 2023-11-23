import * as fs from 'node:fs';
import { BACKUP_FOLDER } from "../config";
import { spwn } from "../utils/spwn";
import { getBackupFolderFor, isBackupExistsFor } from "../utils/uidProcesser";
import { SpawnResult } from '../types';
// import { uidToNameDictionary } from '../global';

export async function startBackupFor(uid: string): Promise<SpawnResult> {
    const ideviceBackup2Args = ['-u', uid.toString(), '-n', 'backup', '--full', BACKUP_FOLDER];

    if (!isBackupExistsFor(uid)) {
        console.log(`no previous backup for ${globalThis.uidToNameDictionary[uid]}. Proceeding with full backup`);
        let backupFolder = getBackupFolderFor(uid);
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    return await spwn('idevicebackup2', ideviceBackup2Args, true);
}