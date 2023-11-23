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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackupedUpDeviceUids = exports.createKnownUidFor = exports.deleteBackupFlagsForUids = exports.createBackupFlagFor = exports.isBackupFlagPresentFor = exports.isBackupExistsFor = exports.getLogFileFor = exports.getBackupFolderFor = exports.getKnownUidPathFor = exports.getBackupFlagPathFor = exports.getPidFileNameFor = void 0;
const fs = __importStar(require("node:fs"));
const config_1 = require("../config");
const global_1 = require("../global");
function getPidFileNameFor(cmdName) {
    return `${config_1.PIDS_FOLDER}/${cmdName}.pid`;
}
exports.getPidFileNameFor = getPidFileNameFor;
function getBackupFlagPathFor(uid) {
    return `${config_1.BACKUP_FLAG_FOLDER}/${uid}`;
}
exports.getBackupFlagPathFor = getBackupFlagPathFor;
function getKnownUidPathFor(uid) {
    return `${config_1.KNOWN_UIDS_FOLDER}/${uid}`;
}
exports.getKnownUidPathFor = getKnownUidPathFor;
function getBackupFolderFor(uid) {
    return `${config_1.BACKUP_FOLDER}/${uid}`;
}
exports.getBackupFolderFor = getBackupFolderFor;
function getLogFileFor(cmdName) {
    const date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return `${config_1.LOGS_FOLDER}/${today}__${cmdName}.log`;
}
exports.getLogFileFor = getLogFileFor;
function isBackupExistsFor(uid) {
    const backupFolder = getBackupFolderFor(uid);
    return fs.existsSync(backupFolder);
}
exports.isBackupExistsFor = isBackupExistsFor;
function isBackupFlagPresentFor(uid) {
    const path = getBackupFlagPathFor(uid);
    if (fs.existsSync(path)) {
        let ticks = fs.readFileSync(path, 'utf-8');
        const lastBackupDate = new Date(parseInt(ticks));
        const today = new Date();
        return lastBackupDate.getDate() == today.getDate();
    }
    return false;
}
exports.isBackupFlagPresentFor = isBackupFlagPresentFor;
function createBackupFlagFor(uid) {
    let path = getBackupFlagPathFor(uid);
    fs.writeFileSync(path, Date.now().toString());
}
exports.createBackupFlagFor = createBackupFlagFor;
function deleteBackupFlagsForUids(uids) {
    for (let i = 0; i < uids.length; i++) {
        const uid = uids[i];
        const backupFlag = getBackupFlagPathFor(uid);
        if (fs.existsSync(backupFlag)) {
            console.log(`backup flag found for ${global_1.uidToNameDictionary[uid]}, removing...`);
            fs.unlinkSync(backupFlag);
        }
    }
}
exports.deleteBackupFlagsForUids = deleteBackupFlagsForUids;
function createKnownUidFor(uid, name) {
    const path = getKnownUidPathFor(uid);
    console.log(`updating known name for ${uid} to ${name}`);
    if (!fs.existsSync(path)) {
        fs.closeSync(fs.openSync(path, 'w'));
        fs.writeFileSync(path, name);
    }
}
exports.createKnownUidFor = createKnownUidFor;
function getBackupedUpDeviceUids() {
    return fs.readdirSync(config_1.BACKUP_FLAG_FOLDER);
}
exports.getBackupedUpDeviceUids = getBackupedUpDeviceUids;
