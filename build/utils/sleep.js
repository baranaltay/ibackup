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
exports.sleepUntilTomorrowMidnight = exports.sleep = void 0;
function sleep(seconds) { return new Promise(r => setTimeout(r, seconds * 1000)); }
exports.sleep = sleep;
function sleepUntilTomorrowMidnight() {
    return __awaiter(this, void 0, void 0, function* () {
        const date = new Date(); // gives now
        date.setDate(date.getDate() + 1);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        const now = new Date();
        const untilMidnight = Math.abs(now.getTime() - date.getTime()) / 1000;
        console.log('sleeping until ' + date);
        yield sleep(untilMidnight);
    });
}
exports.sleepUntilTomorrowMidnight = sleepUntilTomorrowMidnight;
