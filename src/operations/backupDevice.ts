import { globals, backupPromises } from "../global";
import { startBackupFor } from "../libimobiledevice/idevicebackup2";
import { tryGetBatteryLevel } from "../libimobiledevice/idevicediagnostics";
import { getNameForUid } from "../utils/getNameFromUid";
import { notify_and_log } from "../utils/notification";
import { removeItemFromArray } from "../utils/removeItem";
import { createBackupFlagFor } from "../utils/uidProcessor";

export async function backupDevice(uid: string): Promise<void> {
    let name = getNameForUid(uid);
    let batteryLevel = await tryGetBatteryLevel(uid);

    if (batteryLevel == -1 || isNaN(batteryLevel)) {
        console.log('could not read battery level. Aborting backup for: ' + name);
        removeItemFromArray(globals.inProgress, uid);
        globals.toBeBackedUp.push(uid); // try again
        return;
    }

    // dont try again
    createBackupFlagFor(uid);

    if (batteryLevel < 50) {
        removeItemFromArray(globals.inProgress, uid);
        notify_and_log(`skipping ${name} because batter is lower than 50 (${batteryLevel})`);
        return;
    }

    notify_and_log(`starting backup for ${name}! (Battery level: ${batteryLevel}%)`);

    let { stdout, stderr, code } = await startBackupFor(uid);
    let endBatteryLevel = await tryGetBatteryLevel(uid);
    if (code == 0) {
        globals.backedUp.push(uid);
    }
    notify_and_log(`backup ${code == 0 ? 'success' : 'failed'} for ${name}! (Battery level: ${batteryLevel}% -> ${endBatteryLevel}) \n${stderr}`);
    removeItemFromArray(globals.inProgress, uid);
}

export function startBackupForUids(uids: string[]) {
    for (let i = 0; i < uids.length; i++) {
        removeItemFromArray(globals.toBeBackedUp, uids[i]);
        backupPromises.push(backupDevice(uids[i]));
    }
}