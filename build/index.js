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
let killFlag = false;
var toBeBackedUpUids = [];
const inProgressUids = [];
const promises = [];
const sigterm = () => {
    killFlag = true;
    (0, process_1.killAll)();
    process.exit(0);
};
process.on('SIGTERM', sigterm);
process.on('SIGINT', sigterm);
fs.rmSync(config_1.PIDS_FOLDER, { recursive: true, force: true });
fs.mkdirSync(config_1.PIDS_FOLDER, { recursive: true });
fs.rmSync(config_1.LOGS_FOLDER, { recursive: true, force: true });
fs.mkdirSync(config_1.LOGS_FOLDER, { recursive: true });
if (!fs.existsSync(config_1.BACKUP_FOLDER)) {
    fs.mkdirSync(config_1.BACKUP_FOLDER, { recursive: true });
}
if (!fs.existsSync(config_1.BACKUP_FLAG_PATH)) {
    fs.mkdirSync(config_1.BACKUP_FLAG_PATH, { recursive: true });
}
function removeFromInProgress(uid) {
    let index = inProgressUids.indexOf(uid);
    inProgressUids.splice(index, 1);
}
function backupDevice(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: implement battery health > 50
        let name = yield (0, libimobiledevice_1.getDeviceNameFor)(uid);
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
            console.log(`no previous backup for uid: ${uid}. Proceeding with full backup`);
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
function tryGetAllUids() {
    return __awaiter(this, void 0, void 0, function* () {
        let tryCounter = 0;
        toBeBackedUpUids = yield (0, libimobiledevice_1.getAllPairedUids)();
        while (!killFlag && tryCounter++ < config_1.TRY_GET_DEVICE_COUNT) {
            let uids = yield (0, libimobiledevice_1.getAllUids)();
            if (uids.length > 0) {
                console.log('device(s) found!: ', uids);
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
            console.log('backup present today for uid: ' + uid);
            uids.splice(i, 1);
        }
    }
}
function getUids() {
    return __awaiter(this, void 0, void 0, function* () {
        const connectedUids = yield tryGetAllUids();
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
        console.log('starting backup procedure for uids: ', connectedUids);
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
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
                    (0, uidProcesser_1.deleteBackupFlagsForUids)(uids);
                    startBackupForUids(uids);
                    yield (0, sleep_1.sleep)(10);
                }
            }
            else {
                (0, notification_1.notify_and_log)('we already backed up for today, sleeping until tomorrow');
            }
            if (toBeBackedUpUids.length > 0) {
                (0, notification_1.notify_and_log)('we could not backed up these uids for today, sleeping until tomorrow: ', toBeBackedUpUids);
            }
            yield (0, recursiveAll_1.PromiseAllDynamic)(promises);
            yield (0, daemons_1.deactivateMuxdDaemons)();
            yield (0, sleep_2.sleepUntilTomorrowMidnight)();
        } while (!killFlag);
    });
})();
