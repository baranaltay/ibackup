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
exports.tryGetBatteryLevel = exports.getBatteryLevelFor = void 0;
const sleep_1 = require("../utils/sleep");
const spwn_1 = require("../utils/spwn");
function getIsCharging(arr) {
    let index = arr.findIndex(x => x.includes('IsCharging'));
    let xml = arr[index + 1];
    return xml.toLowerCase().includes('true');
}
function getCurrentCapacity(arr) {
    let index = arr.findIndex(x => x.trim() == '<key>CurrentCapacity</key>');
    let xml = arr[index + 1];
    let capacityStr = xml.trim().slice('<integer>'.length).slice(0, '</integer>'.length * -1);
    console.log('capacityStr', capacityStr);
    return parseInt(capacityStr);
}
function getBatteryLevelFor(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield (0, spwn_1.spwn)('idevicediagnostics', ['-n', 'ioregentry', 'AppleSmartBattery', '-u', uid.toString()]);
        if (result.code !== 0) {
            console.log('idevicediagnostics: ', result.stderr);
            return -1;
        }
        let arr = result.stdout.split('\n');
        let batteryLevel = getCurrentCapacity(arr);
        let IsCharging = getIsCharging(arr);
        console.log(`current battery level is ${batteryLevel}. Device ${IsCharging ? 'is' : 'is not'} charging`);
        return getCurrentCapacity(arr);
    });
}
exports.getBatteryLevelFor = getBatteryLevelFor;
function tryGetBatteryLevel(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_TRY_COUNT = 10;
        let tryCounter = 0;
        let result = -1;
        while (++tryCounter < MAX_TRY_COUNT && (result = yield getBatteryLevelFor(uid)) === -1) {
            console.log(`could not read battery level... will try again (try count: ${tryCounter}/${MAX_TRY_COUNT})`);
            yield (0, sleep_1.sleep)(1);
        }
        return result;
    });
}
exports.tryGetBatteryLevel = tryGetBatteryLevel;
