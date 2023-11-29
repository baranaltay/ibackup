
import { sleep } from './utils/sleep';
import { killAll } from './utils/process';
import { sleepUntilTomorrowMidnight } from './utils/sleep';
import { getAllPairedUids } from './libimobiledevice';
import { PromiseAllDynamic } from './utils/recursiveAll';
import { globals, backupPromises } from './global';
import { startGetUidInterval, startPrintStatusInterval, startProcessInterval } from "./intervals";
import { removeFromArrayIfBackupPresent } from './operations/removeFromArrayIfBackupPresent';
import { clearAllVariables } from './operations/initiateStart';
import { getNameForUids } from './utils/getNameFromUid';
import { distinct } from './utils/distinct';
import { notify_and_log } from './utils/notification';
import { startProcessTimeout } from './timeouts';
import { activateMuxdDaemons, deactivateMuxdDaemons } from './daemons';
import { ensureDirectories } from './operations/ensureDirectories';
// import { global.uidToNameDictionary } from './global';

let killFlag = false;

function sigterm() {
    killFlag = true;
    killAll();
    process.exit(0);
};

process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);

async function dynamicWait(): Promise<void> {
    while (globals.shouldWait) {
        await sleep(1);
    }
}

function sendReportNotification() {
    let report = `
Successfull: ${getNameForUids(globals.backedUp)}\n
Unsuccessfull: ${getNameForUids(distinct(globals.toBeBackedUp, globals.backedUp))}
`;
    notify_and_log(report);
}

(async function main() {
    while (!killFlag) {
        startProcessTimeout();

        clearAllVariables();
        ensureDirectories();

        await activateMuxdDaemons();

        let pariedUids = await getAllPairedUids();
        removeFromArrayIfBackupPresent(pariedUids);
        globals.toBeBackedUp = pariedUids;

        startPrintStatusInterval();
        startGetUidInterval();
        startProcessInterval();

        backupPromises.push(dynamicWait());
        await PromiseAllDynamic(backupPromises);

        clearAllVariables();
        await deactivateMuxdDaemons();
        await sleepUntilTomorrowMidnight();
    }
})();

