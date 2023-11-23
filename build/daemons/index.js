"use strict";
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
exports.deactivateMuxdDaemons = exports.activateMuxdDaemons = void 0;
const sleep_1 = require("../utils/sleep");
const process_1 = require("../utils/process");
const spwn_1 = require("../utils/spwn");
const generateCommandName_1 = require("../utils/generateCommandName");
const uidProcesser_1 = require("../utils/uidProcesser");
const node_fs_1 = require("node:fs");
const node_process_1 = require("node:process");
const NETMUXD_CMD_NAME = 'aarch64-linux-netmuxd';
const NETMUXD_CMD_ARGS = ['--disable-unix', '--host', '127.0.0.1'];
const USBMUXD_CMD_NAME = 'usbmuxd';
const USBMUXD_CMD_ARGS = ['-z', '-f'];
function activateNetmuxd() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, spwn_1.spwn)(NETMUXD_CMD_NAME, NETMUXD_CMD_ARGS, true, true);
        yield (0, sleep_1.sleep)(1);
    });
}
function activateUsbmuxd() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, spwn_1.spwn)(USBMUXD_CMD_NAME, USBMUXD_CMD_ARGS, true, true);
        yield (0, sleep_1.sleep)(1);
    });
}
function deactivateNetmuxd() {
    let cmdName = (0, generateCommandName_1.generateCommandName)(NETMUXD_CMD_NAME, NETMUXD_CMD_ARGS);
    deactivate(cmdName);
}
function deactivateUsbmuxd() {
    let cmdName = (0, generateCommandName_1.generateCommandName)(USBMUXD_CMD_NAME, USBMUXD_CMD_ARGS);
    deactivate(cmdName);
}
function deactivate(cmdName) {
    if (cmdName in process_1.child_processes) {
        process_1.child_processes[cmdName].kill();
        return;
    }
    let pidFile = (0, uidProcesser_1.getPidFileNameFor)(cmdName);
    if ((0, node_fs_1.existsSync)(pidFile)) {
        let pid = (0, node_fs_1.readFileSync)(pidFile, 'utf-8');
        (0, node_process_1.kill)(parseInt(pid), 'SIGTERM');
    }
}
function activateMuxdDaemons() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('activating muxd daemons');
        yield activateUsbmuxd();
        yield activateNetmuxd();
    });
}
exports.activateMuxdDaemons = activateMuxdDaemons;
function deactivateMuxdDaemons() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('deactivating muxd daemons');
        yield deactivateUsbmuxd();
        yield deactivateNetmuxd();
    });
}
exports.deactivateMuxdDaemons = deactivateMuxdDaemons;
