
import * as fs from 'node:fs';
import { PIDS_FOLDER, BACKUP_FLAG_PATH, BACKUP_FOLDER, LOGS_FOLDER, SLEEP_SECONDS, TRY_GET_DEVICE_COUNT } from './config';
import { sleep } from './utils/sleep';
import { killAll } from './utils/process';
import { createBackupFlagFor, isBackupFlagPresentFor, deleteBackupFlagsForUids, isBackupExistsFor, getBackupFolderFor } from './utils/uidProcesser';
import { notify_and_log } from './utils/notification';
import { sleepUntilTomorrowMidnight } from './utils/sleep';
import { getDeviceNameFor, getAllUids, getAllPairedUids } from './libimobiledevice';
import { activateMuxdDaemons, deactivateMuxdDaemons } from './daemons';
import { distinct } from './utils/distinct';
import { PromiseAllDynamic } from './utils/recursiveAll';
import { ReturnLoop } from './types';
import { tryGetBatteryLevel } from './libimobiledevice/idevicediagnostics';
import { startBackupFor } from './libimobiledevice/idevicebackup2';

let killFlag = false;
var toBeBackedUpUids: string[] = [];
const inProgressUids: string[] = [];
const promises: Promise<void>[] = [];

const sigterm = () => {
    killFlag = true;
    killAll();
    process.exit(0);
};

process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);

fs.rmSync(PIDS_FOLDER, { recursive: true, force: true });
fs.mkdirSync(PIDS_FOLDER, { recursive: true });

fs.rmSync(LOGS_FOLDER, { recursive: true, force: true });
fs.mkdirSync(LOGS_FOLDER, { recursive: true });

if (!fs.existsSync(BACKUP_FOLDER)) {
    fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
}

if (!fs.existsSync(BACKUP_FLAG_PATH)) {
    fs.mkdirSync(BACKUP_FLAG_PATH, { recursive: true });
}

function removeFromInProgress(uid: string): void {
    let index = inProgressUids.indexOf(uid);
    inProgressUids.splice(index, 1);
}

async function backupDevice(uid: string): Promise<void> {
    // TODO: implement battery health > 50
    let name = await getDeviceNameFor(uid);
    let batteryLevel = await tryGetBatteryLevel(uid);

    if (batteryLevel == -1 || isNaN(batteryLevel)) {
        console.log('could not read battery level. Aborting backup for: ' + name);
        removeFromInProgress(uid);
        return;
    }

    if (batteryLevel < 50) {
        createBackupFlagFor(uid);
        notify_and_log(`skipping ${name} because batter is lower than 50 (${batteryLevel})`);
        return;
    }

    notify_and_log(`starting backup for ${name}! (Battery level: ${batteryLevel})`);

    if (!isBackupExistsFor(uid)) {
        console.log(`no previous backup for uid: ${uid}. Proceeding with full backup`);
        let backupFolder = getBackupFolderFor(uid);
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    let { stdout, stderr, code } = await startBackupFor(uid);
    batteryLevel = await tryGetBatteryLevel(uid);
    if (code == 0) {
        createBackupFlagFor(uid);
        notify_and_log(`backup success for ${name}! (Battery level: ${batteryLevel})`);
    } else {
        notify_and_log(`backup failed for ${name}! (Battery level: ${batteryLevel}) \n${stderr}`);
    }
    removeFromInProgress(uid);
}

function startBackupForUids(uids: string[]) {
    for (let i = 0; i < uids.length; i++) {
        promises.push(backupDevice(uids[i]));
    }
}

async function tryGetAllUids(): Promise<string[]> {
    let tryCounter = 0;
    while (!killFlag && tryCounter++ < TRY_GET_DEVICE_COUNT) {
        let uids = await getAllUids();
        if (uids.length > 0) {
            console.log('device(s) found!: ', uids);
            return uids;
        }
        console.log(`No device is present. Sleeping for ${SLEEP_SECONDS}... (try count is ${tryCounter})`);
        await sleep(SLEEP_SECONDS);
    }

    return [];
}

function removeFromArrayIfBackupPresent(uids: string[]) {
    for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];

        if (isBackupFlagPresentFor(uid)) {
            console.log('backup present today for uid: ' + uid)
            uids.splice(i, 1);
        }
    }
}

async function getUids(): Promise<string[] | ReturnLoop> {
    const connectedUids = await tryGetAllUids();
    if (connectedUids.length === 0) {
        console.log('no connected device found. sleeping for 10s...');
        await sleep(10);
        return ReturnLoop.continue;
    }

    if (distinct(connectedUids, inProgressUids).length === 0) {
        console.log('all connected devices are in progress...');

        if (distinct(toBeBackedUpUids, inProgressUids).length == 0) {
            console.log('there is no more device left to backup, waiting for them to finish...')
            return ReturnLoop.break;
        }

        return ReturnLoop.continue;
    }

    // if backup is present for uid for today, remove from array
    removeFromArrayIfBackupPresent(connectedUids);

    if (connectedUids.length === 0 && toBeBackedUpUids.length === 0) {
        notify_and_log('we already backed up for today, sleeping until tomorrow');
        return ReturnLoop.break;
    }

    console.log('starting backup procedure for uids: ', connectedUids);
    toBeBackedUpUids = distinct(toBeBackedUpUids, connectedUids);
    for (let i = 0; i < connectedUids.length; i++) {
        const uid = connectedUids[i];
        if (!inProgressUids.includes(uid)) {
            inProgressUids.push(uid);
        }
    }

    return connectedUids;
}

(async function main() {

    dailyLoop:
    do {
        await activateMuxdDaemons();

        toBeBackedUpUids = await getAllPairedUids();
        removeFromArrayIfBackupPresent(toBeBackedUpUids);

        if (toBeBackedUpUids.length > 0) {
            let backupLoopTryCounter = 0;
            backupLoop:
            while (toBeBackedUpUids.length > 0 || ++backupLoopTryCounter < 10) {

                let uids = await getUids();
                let returnLoop = (uids as ReturnLoop);
                if (returnLoop == ReturnLoop.break) {
                    break backupLoop;
                } else if (returnLoop == ReturnLoop.continue) {
                    await sleep(10);
                    continue backupLoop;
                }
                deleteBackupFlagsForUids(uids as string[]);
                startBackupForUids(uids as string[]);
                await sleep(10);
            }
        } else {
            notify_and_log('we already backed up for today, sleeping until tomorrow');
        }

        if (toBeBackedUpUids.length > 0) {
            notify_and_log('we could not backed up these uids for today, sleeping until tomorrow: ', toBeBackedUpUids)
        }

        await PromiseAllDynamic(promises);
        await deactivateMuxdDaemons();
        await sleepUntilTomorrowMidnight();

    } while (!killFlag)
})();
