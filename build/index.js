"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const config_1 = require("./config");
const sleep_1 = require("./utils/sleep");
const process_1 = require("./utils/process");
const uidProcesser_1 = require("./utils/uidProcesser");
const notification_1 = require("./utils/notification");
const sleep_2 = require("./utils/sleep");
const libimobiledevice_1 = require("./libimobiledevice");
const daemons_1 = require("./daemons");
const distinct_1 = require("./utils/distinct");
const recursiveAll_1 = require("./utils/recursiveAll");
const types_1 = require("./types");
const idevicediagnostics_1 = require("./libimobiledevice/idevicediagnostics");
const idevicebackup2_1 = require("./libimobiledevice/idevicebackup2");
const global_1 = require("./global");
let killFlag = false;
var toBeBackedUpUids = [];
var connectedUids = [];
const inProgressUids = [];
const promises = [];
const sigterm = () => {
    killFlag = true;
    (0, process_1.killAll)();
    process.exit(0);
};
process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);
function ensureDirectories() {
    fs.rmSync(config_1.PIDS_FOLDER, { recursive: true, force: true });
    fs.mkdirSync(config_1.PIDS_FOLDER, { recursive: true });
    fs.rmSync(config_1.LOGS_FOLDER, { recursive: true, force: true });
    fs.mkdirSync(config_1.LOGS_FOLDER, { recursive: true });
    if (!fs.existsSync(config_1.BACKUP_FOLDER)) {
        fs.mkdirSync(config_1.BACKUP_FOLDER, { recursive: true });
    }
    if (!fs.existsSync(config_1.BACKUP_FLAG_FOLDER)) {
        fs.mkdirSync(config_1.BACKUP_FLAG_FOLDER, { recursive: true });
    }
    if (!fs.existsSync(config_1.KNOWN_UIDS_FOLDER)) {
        fs.mkdirSync(config_1.KNOWN_UIDS_FOLDER, { recursive: true });
    }
}
function removeFromInProgress(uid) {
    let index = inProgressUids.indexOf(uid);
    inProgressUids.splice(index, 1);
}
function populateUidsDictionary(uids) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < uids.length; i++) {
            const uid = uids[i];
            yield populateUidDictionary(uid);
        }
    });
}
function populateUidDictionary(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (uid in global_1.uidToNameDictionary) {
            return;
        }
        let file = (0, uidProcesser_1.getKnownUidPathFor)(uid);
        let name = uid;
        if (fs.existsSync(file)) {
            name = `"${fs.readFileSync(file, 'utf-8')}"`;
        }
        else {
            name = `"${yield (0, libimobiledevice_1.getDeviceNameFor)(uid)}"`;
        }
        global_1.uidToNameDictionary[uid] = name;
    });
}
function backupDevice(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        let name = global_1.uidToNameDictionary[uid];
        let batteryLevel = yield (0, idevicediagnostics_1.tryGetBatteryLevel)(uid);
        if (batteryLevel == -1 || isNaN(batteryLevel)) {
            console.log('could not read battery level. Aborting backup for: ' + name);
            removeFromInProgress(uid);
            return;
        }
        if (batteryLevel < 50) {
            (0, uidProcesser_1.createBackupFlagFor)(uid);
            (0, notification_1.notify_and_log)(`skipping ${name} because batter is lower than 50 (${batteryLevel})`);
            return;
        }
        (0, notification_1.notify_and_log)(`starting backup for ${name}! (Battery level: ${batteryLevel})`);
        if (!(0, uidProcesser_1.isBackupExistsFor)(uid)) {
            console.log(`no previous backup for: ${name}. Proceeding with full backup`);
            let backupFolder = (0, uidProcesser_1.getBackupFolderFor)(uid);
            fs.mkdirSync(backupFolder, { recursive: true });
        }
        let { stdout, stderr, code } = yield (0, idevicebackup2_1.startBackupFor)(uid);
        batteryLevel = yield (0, idevicediagnostics_1.tryGetBatteryLevel)(uid);
        if (code == 0) {
            (0, uidProcesser_1.createBackupFlagFor)(uid);
            (0, notification_1.notify_and_log)(`backup success for ${name}! (Battery level: ${batteryLevel})`);
        }
        else {
            (0, notification_1.notify_and_log)(`backup failed for ${name}! (Battery level: ${batteryLevel}) \n${stderr}`);
        }
        removeFromInProgress(uid);
    });
}
function startBackupForUids(uids) {
    for (let i = 0; i < uids.length; i++) {
        promises.push(backupDevice(uids[i]));
    }
}
function printStatus() {
    let backedupUids = (0, uidProcesser_1.getBackupedUpDeviceUids)();
    let status = `Paired devices: ${toBeBackedUpUids.map(x => global_1.uidToNameDictionary[x])}\nConnected devices: ${connectedUids.map(x => global_1.uidToNameDictionary[x])}\nBackedup devices: ${backedupUids.map(x => global_1.uidToNameDictionary[x])}`;
    console.log(status);
}
function tryGetAllUids() {
    return __awaiter(this, void 0, void 0, function* () {
        let tryCounter = 0;
        while (!killFlag && tryCounter++ < config_1.TRY_GET_DEVICE_COUNT) {
            let uids = yield (0, libimobiledevice_1.getAllUids)();
            if (uids.length > 0) {
                yield populateUidsDictionary(uids);
                console.log('device(s) found!: ', uids.map(x => global_1.uidToNameDictionary[x]));
                return uids;
            }
            console.log(`No device is present. Sleeping for ${config_1.SLEEP_SECONDS}... (try count is ${tryCounter})`);
            yield (0, sleep_1.sleep)(config_1.SLEEP_SECONDS);
        }
        return [];
    });
}
function removeFromArrayIfBackupPresent(uids) {
    for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];
        if ((0, uidProcesser_1.isBackupFlagPresentFor)(uid)) {
            console.log('backup present today for ' + global_1.uidToNameDictionary[uid]);
            uids.splice(i, 1);
        }
    }
}
function getUids() {
    return __awaiter(this, void 0, void 0, function* () {
        connectedUids = yield tryGetAllUids();
        if (connectedUids.length === 0) {
            console.log('no connected device found. sleeping for 10s...');
            yield (0, sleep_1.sleep)(10);
            return types_1.ReturnLoop.continue;
        }
        if ((0, distinct_1.distinct)(connectedUids, inProgressUids).length === 0) {
            console.log('all connected devices are in progress...');
            if ((0, distinct_1.distinct)(toBeBackedUpUids, inProgressUids).length == 0) {
                console.log('there is no more device left to backup, waiting for them to finish...');
                return types_1.ReturnLoop.break;
            }
            return types_1.ReturnLoop.continue;
        }
        // if backup is present for uid for today, remove from array
        removeFromArrayIfBackupPresent(connectedUids);
        if (connectedUids.length === 0 && toBeBackedUpUids.length === 0) {
            (0, notification_1.notify_and_log)('we already backed up for today, sleeping until tomorrow');
            return types_1.ReturnLoop.break;
        }
        toBeBackedUpUids = (0, distinct_1.distinct)(toBeBackedUpUids, connectedUids);
        for (let i = 0; i < connectedUids.length; i++) {
            const uid = connectedUids[i];
            if (!inProgressUids.includes(uid)) {
                inProgressUids.push(uid);
            }
        }
        return connectedUids;
    });
}
setInterval(printStatus, 10000);
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        ensureDirectories();
        dailyLoop: do {
            yield (0, daemons_1.activateMuxdDaemons)();
            toBeBackedUpUids = yield (0, libimobiledevice_1.getAllPairedUids)();
            removeFromArrayIfBackupPresent(toBeBackedUpUids);
            if (toBeBackedUpUids.length > 0) {
                let backupLoopTryCounter = 0;
                backupLoop: while (toBeBackedUpUids.length > 0 || ++backupLoopTryCounter < 10) {
                    let uids = yield getUids();
                    let returnLoop = uids;
                    if (returnLoop == types_1.ReturnLoop.break) {
                        break backupLoop;
                    }
                    else if (returnLoop == types_1.ReturnLoop.continue) {
                        yield (0, sleep_1.sleep)(10);
                        continue backupLoop;
                    }
                    (0, uidProcesser_1.deleteBackupFlagsForUids)(connectedUids);
                    startBackupForUids(connectedUids);
                    yield (0, sleep_1.sleep)(10);
                }
            }
            else {
                (0, notification_1.notify_and_log)('we already backed up today, sleeping until tomorrow');
            }
            if (toBeBackedUpUids.length > 0) {
                (0, notification_1.notify_and_log)('we could not back these up today, sleeping until tomorrow: ', toBeBackedUpUids.map(x => global_1.uidToNameDictionary[x]));
            }
            yield (0, recursiveAll_1.PromiseAllDynamic)(promises);
            yield (0, daemons_1.deactivateMuxdDaemons)();
            yield (0, sleep_2.sleepUntilTomorrowMidnight)();
        } while (!killFlag);
    });
})();
