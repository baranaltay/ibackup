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
exports.getDeviceNameFor = void 0;
const spwn_1 = require("../utils/spwn");
function getDeviceNameFor(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield (0, spwn_1.spwn)('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid.toString()]);
        return result.stdout;
    });
}
exports.getDeviceNameFor = getDeviceNameFor;