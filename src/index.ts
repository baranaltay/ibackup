
import { sleep, sleepUntilTomorrowMidnight } from './utils/sleep';
import { notify_and_log } from './utils/notification';
import { NetmuxdDaemon } from './daemons';
import { ensureDirectories } from './operations/ensureDirectories';
import { getAllPairedUids } from './libimobiledevice/idevicepair';
import { distinct, removeItemFromArray } from './utils/arrayUtils';
import { Device } from './models/device';
import { tryGetDeviceNameFor } from './utils/getNameForUids';
import { promiseAllDynamicAsync } from './utils/promiseAllDynamic';
import { PROCESS_TIMEOUT_SECONDS } from './config';

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
    let backedUpNames: string[] = [];
    let notBackedUpNames: string[] = [];

    for (let key in dictionary) {
        const device = dictionary[key];
        if (device.isBackedUp) {
            backedUpNames.push(`${device.name} (${device.batteryDifference})`);
        }

        if (!device.isBackedUp) {
            notBackedUpNames.push(device.name);
        }
    }

    let report = `success: ${backedUpNames}
failed: ${notBackedUpNames}`;

    notify_and_log(report);
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
    let netmuxdDaemon = new NetmuxdDaemon();
    let deviceDictionary: DeviceDictionary = {};

    while (!killFlag) {
        ensureDirectories();
        startTimeout();
        shouldWait = true;
        netmuxdDaemon.activate();

        let remainingUids = await getAllPairedUids();
        console.log(`paired device(s): ${remainingUids.map(x => tryGetDeviceNameFor(x))}`);

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
        sendReportNotification(deviceDictionary);
        stopTimeout();
        netmuxdDaemon.deactivate();
        resetAllDevices(deviceDictionary);
        await sleepUntilTomorrowMidnight();
    }
})();

