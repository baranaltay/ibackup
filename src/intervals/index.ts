import { GET_UID_INTERVAL, PROCESS_INTERVAL, STATUS_INTERVAL } from "../constants";
import { globals } from "../global";
import { getAllUids } from "../libimobiledevice";
import { startBackupForUids } from "../operations/backupDevice";
import { removeFromArrayIfBackupPresent } from "../operations/removeFromArrayIfBackupPresent";
import { distinct } from "../utils/distinct";
import { printStatus } from "../utils/printStatus";

const intervals: { [key: string]: NodeJS.Timeout; } = {};

function processInterval() {
    let uids: string[] = JSON.parse(JSON.stringify(globals.connected));
    uids = distinct(uids, globals.inProgress);
    removeFromArrayIfBackupPresent(uids);
    if (uids.length === 0) {
        return;
    }

    startBackupForUids(uids);
    globals.inProgress = uids;
}

async function getUidInterval() {
    let connectedUids = await getAllUids();
    if (connectedUids.length === 0) {
        return;
    }

    globals.connected = connectedUids;
}

export function stopAllIntervals() {
    for (let key in intervals) {
        clearInterval(intervals[key]);
    }
}

export function startPrintStatusInterval() {
    intervals[STATUS_INTERVAL] = setInterval(printStatus, 10000);
}

export function startGetUidInterval() {
    intervals[GET_UID_INTERVAL] = setInterval(getUidInterval, 5000);
}

export function startProcessInterval() {
    intervals[PROCESS_INTERVAL] = setInterval(processInterval, 5000);
}

export function stopPrintStatusInterval() {
    clearInterval(intervals[STATUS_INTERVAL]);
}

export function stopGetUidInterval() {
    clearInterval(intervals[GET_UID_INTERVAL]);
}

export function stopProcessInterval() {
    clearInterval(intervals[PROCESS_INTERVAL]);
}