import * as fs from 'node:fs';
import { PIDS_FOLDER, LOGS_FOLDER, BACKUP_FOLDER, BACKUP_FLAG_FOLDER, KNOWN_UIDS_FOLDER } from '../config';

export function ensureDirectories() {
    fs.rmSync(PIDS_FOLDER, { recursive: true, force: true });
    fs.mkdirSync(PIDS_FOLDER, { recursive: true });

    fs.rmSync(LOGS_FOLDER, { recursive: true, force: true });
    fs.mkdirSync(LOGS_FOLDER, { recursive: true });

    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(BACKUP_FLAG_FOLDER)) {
        fs.mkdirSync(BACKUP_FLAG_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(KNOWN_UIDS_FOLDER)) {
        fs.mkdirSync(KNOWN_UIDS_FOLDER, { recursive: true });
    }
}