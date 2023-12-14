
import { sleep, sleepUntilTomorrowMidnight } from './utils/sleep';
import { notify_and_log } from './utils/notification';
import { Daemon } from './daemons';
import { ensureDirectories } from './operations/ensureDirectories';
import { getAllPairedUids } from './libimobiledevice/idevicepair';
import { distinct, removeItemFromArray } from './utils/arrayUtils';
import { Device } from './models/device';
import { tryGetDeviceNameFor } from './utils/getNameForUids';
import { promiseAllDynamicAsync } from './utils/promiseAllDynamic';
import { PROCESS_TIMEOUT_SECONDS } from './config';
import { execAsync } from './utils/execAsync';

let killFlag = false;
let shouldWait = true;

function sigterm() {
    killFlag = true;
    process.exit(0);
};

process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);

function resetAllDevices(dictionary: DeviceDictionary) {
    for (let key in dictionary)
        dictionary[key].reset();
}

interface DeviceDictionary {
    [key: string]: Device
}

function sendReportNotification(dictionary: DeviceDictionary) {
    let report: string[] = [];

    for (let key in dictionary) {
        const device = dictionary[key];
        if (device.isBackedUp) {
            report.push(`success: ${device.name} (${device.batteryDifference})`);
        } else if (device.alreadyBackedUp) {
            report.push(`${device.name} (already backed up today)`);
        } else {
            report.push(`failed: ${device.name} reason: ${device.reason}`);
        }
    }

    notify_and_log(report.join('\n'));
}

let backupTimeout: NodeJS.Timeout;
function stopTimeout() {
    clearTimeout(backupTimeout);
}

function startTimeout() {
    stopTimeout();
    backupTimeout = setTimeout(() => {
        console.log('timed out');
        shouldWait = false;
    }, PROCESS_TIMEOUT_SECONDS * 1000);
}

async function dynamicSleep() {
    while (shouldWait)
        await sleep(1);
}

(async function main() {
    let netmuxdDaemon = new Daemon();
    let deviceDictionary: DeviceDictionary = {};

    while (!killFlag) {
        ensureDirectories();
        startTimeout();
        netmuxdDaemon.activate();

        let remainingUids = await getAllPairedUids();
        console.log(`paired device(s): ${remainingUids.map(x => tryGetDeviceNameFor(x))}`);
        console.log('waiting for connections...');
        netmuxdDaemon.on('connect', async function (uid: string) {
            let device: Device;
            if (!(uid in deviceDictionary)) {
                deviceDictionary[uid] = new Device(uid);
            }

            device = deviceDictionary[uid];
            console.log(`[netmuxd] connected   : ${device.name}`);
            await device.startBackupAsync();

            removeItemFromArray(remainingUids, uid);
            if (remainingUids.length === 0) {
                console.log('all devices backed up, go to sleep');
                shouldWait = false;
            }
        });

        netmuxdDaemon.on('disconnect', function (uid: string) {
            let device = deviceDictionary[uid];

            // this might never triggered, not tested
            if (device.isInProgress) {
                notify_and_log(`${device.name} disconnected before backup being completed...`);
            }

            device.reset();
            console.log(`[netmuxd] disconnected: ${device.name}`);
        });

        await dynamicSleep();
        shouldWait = true;
        sendReportNotification(deviceDictionary);
        stopTimeout();
        netmuxdDaemon.deactivate();
        resetAllDevices(deviceDictionary);
        await sleepUntilTomorrowMidnight();
    }
})();

