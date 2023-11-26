
import * as fs from 'node:fs';
import { PIDS_FOLDER, BACKUP_FLAG_FOLDER, BACKUP_FOLDER, LOGS_FOLDER, SLEEP_SECONDS, TRY_GET_DEVICE_COUNT, KNOWN_UIDS_FOLDER } from './config';
import { sleep } from './utils/sleep';
import { killAll } from './utils/process';
import { createBackupFlagFor, isBackupFlagPresentFor, deleteBackupFlagsForUids, isBackupExistsFor, getBackupFolderFor, getKnownUidPathFor, getBackupedUpDeviceUids } from './utils/uidProcesser';
import { notify_and_log } from './utils/notification';
import { sleepUntilTomorrowMidnight } from './utils/sleep';
import { getDeviceNameFor as getDeviceNameFor, getAllUids, getAllPairedUids } from './libimobiledevice';
import { activateMuxdDaemons, deactivateMuxdDaemons } from './daemons';
import { distinct } from './utils/distinct';
import { PromiseAllDynamic } from './utils/recursiveAll';
import { ReturnLoop } from './types';
import { tryGetBatteryLevel } from './libimobiledevice/idevicediagnostics';
import { startBackupFor } from './libimobiledevice/idevicebackup2';
// import { uidToNameDictionary } from './global';

declare global {
    var killFlag: boolean
    var toBeBackedUpUids: string[];
    var connectedUids: string[];
    var inProgressUids: string[];
    var promises: Promise<void>[];
    var uidToNameDictionary: { [key: string]: string };
}

globalThis.killFlag = false;
globalThis.toBeBackedUpUids = [];
globalThis.connectedUids = [];
globalThis.inProgressUids = [];
globalThis.promises = [];
globalThis.uidToNameDictionary = {};

const sigterm = () => {
    globalThis.killFlag = true;
    killAll();
    process.exit(0);
};

process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);

function ensureDirectories() {
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



function removeFromInProgress(uid: string): void {
    let index = globalThis.inProgressUids.indexOf(uid);
    globalThis.inProgressUids.splice(index, 1);
}

async function populateUidsDictionary(uids: string[]): Promise<void> {
    for (let i = 0; i < uids.length; i++) {
        const uid = uids[i];
        await populateUidDictionary(uid);
    }
}

async function populateUidDictionary(uid: string): Promise<void> {
    if (uid in uidToNameDictionary) {
        return;
    }

    let file = getKnownUidPathFor(uid);
    let name = uid;

    if (fs.existsSync(file)) {
        name = `"${fs.readFileSync(file, 'utf-8')}"`;
    } else {
        name = `"${await getDeviceNameFor(uid)}"`;
    }

    uidToNameDictionary[uid] = name;
}

async function backupDevice(uid: string): Promise<void> {
    let name = uidToNameDictionary[uid];
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
        console.log(`no previous backup for: ${name}. Proceeding with full backup`);
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
        globalThis.promises.push(backupDevice(uids[i]));
    }
}

function printStatus(): void {
    let backedupUids = getBackupedUpDeviceUids();
    let status = `Remaining devices: ${globalThis.toBeBackedUpUids.map(x => uidToNameDictionary[x] ?? x)}\nConnected devices: ${globalThis.connectedUids.map(x => uidToNameDictionary[x] ?? x)}\nBackedup devices: ${backedupUids.map(x => uidToNameDictionary[x] ?? x)}\nIn Progress devices: ${globalThis.inProgressUids.map(x => uidToNameDictionary[x] ?? x)}`;
    console.log(status);
}

let tryCounter = 0;
async function tryGetAllUids(): Promise<string[]> {
    while (!globalThis.killFlag && tryCounter++ < TRY_GET_DEVICE_COUNT) {
        let uids = await getAllUids();
        if (uids.length > 0) {
            await populateUidsDictionary(uids);
            console.log('device(s) found!: ', uids.map(x => uidToNameDictionary[x]));
            return uids;
        }
        console.log(`No device is present. Sleeping for ${SLEEP_SECONDS}... (try ${tryCounter}/${TRY_GET_DEVICE_COUNT})`);
        await sleep(SLEEP_SECONDS);
    }

    return [];
}

function removeFromArrayIfBackupPresent(uids: string[]) {
    for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];

        if (isBackupFlagPresentFor(uid)) {
            console.log('backup present today for ' + uidToNameDictionary[uid])
            uids.splice(i, 1);
        }
    }
}

async function getUids(): Promise<string[] | ReturnLoop> {
    globalThis.connectedUids = await tryGetAllUids();
    if (globalThis.connectedUids.length === 0) {
        console.log('no connected device found. sleeping for 10s...');
        await sleep(10);
        return ReturnLoop.continue;
    }

    if (distinct(globalThis.connectedUids, globalThis.inProgressUids).length === 0) {
        console.log('all connected devices are in progress...');

        if (distinct(globalThis.toBeBackedUpUids, globalThis.inProgressUids).length == 0) {
            console.log('there is no more device left to backup, waiting for them to finish...')
            return ReturnLoop.break;
        }

        return ReturnLoop.continue;
    }

    // if backup is present for uid for today, remove from array
    removeFromArrayIfBackupPresent(globalThis.connectedUids);

    if (globalThis.connectedUids.length === 0 && globalThis.toBeBackedUpUids.length === 0) {
        notify_and_log('we already backed up for today, sleeping until tomorrow');
        return ReturnLoop.break;
    }

    globalThis.toBeBackedUpUids = distinct(globalThis.toBeBackedUpUids, globalThis.connectedUids);
    for (let i = 0; i < globalThis.connectedUids.length; i++) {
        const uid = globalThis.connectedUids[i];
        if (!globalThis.inProgressUids.includes(uid)) {
            globalThis.inProgressUids.push(uid);
        }
    }

    return globalThis.connectedUids;
}

(async function main() {
    var statusInterval = setInterval(() => {
        printStatus();
    }, 20000);
    ensureDirectories();
    dailyLoop:
    do {
        await activateMuxdDaemons();

        globalThis.toBeBackedUpUids = await getAllPairedUids();
        removeFromArrayIfBackupPresent(globalThis.toBeBackedUpUids);

        if (globalThis.toBeBackedUpUids.length > 0) {
            let backupLoopTryCounter = 0;
            backupLoop:
            while (globalThis.toBeBackedUpUids.length > 0 && ++backupLoopTryCounter < 10) {
                let uids = await getUids();
                let returnLoop = (uids as ReturnLoop);
                if (returnLoop == ReturnLoop.break) {
                    break backupLoop;
                } else if (returnLoop == ReturnLoop.continue) {
                    await sleep(10);
                    continue backupLoop;
                }

                deleteBackupFlagsForUids(globalThis.connectedUids);
                startBackupForUids(globalThis.connectedUids);
                await sleep(10);
            }
        } else {
            notify_and_log('we already backed up today, sleeping until tomorrow');
        }

        if (globalThis.toBeBackedUpUids.length > 0) {
            notify_and_log('we could not back these up today, sleeping until tomorrow: ', globalThis.toBeBackedUpUids.map(x => uidToNameDictionary[x]))
        }

        clearInterval(statusInterval);
        await PromiseAllDynamic(globalThis.promises);
        await deactivateMuxdDaemons();
        await sleepUntilTomorrowMidnight();

    } while (!globalThis.killFlag)
})();
