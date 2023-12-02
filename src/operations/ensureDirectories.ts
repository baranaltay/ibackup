import * as fs from 'node:fs';
import { BACKUP_FOLDER, BACKUP_FLAG_FOLDER, KNOWN_UIDS_FOLDER, LOG_FOLDER } from '../config';

export function ensureDirectories() {
    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(BACKUP_FLAG_FOLDER)) {
        fs.mkdirSync(BACKUP_FLAG_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(KNOWN_UIDS_FOLDER)) {
        fs.mkdirSync(KNOWN_UIDS_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(LOG_FOLDER)) {
        fs.mkdirSync(LOG_FOLDER, { recursive: true });
    }
}