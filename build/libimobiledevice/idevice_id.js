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
exports.getAllUids = void 0;
const spwn_1 = require("../utils/spwn");
function getAllUids() {
    return __awaiter(this, void 0, void 0, function* () {
        let { stdout, stderr, code } = yield (0, spwn_1.spwn)('idevice_id', ['-n']);
        if (code == 0) {
            return stdout.split('\n').map(x => x.trim()).filter(x => x !== '');
        }
        return [];
    });
}
exports.getAllUids = getAllUids;
