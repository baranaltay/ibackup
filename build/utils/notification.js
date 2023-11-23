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
exports.notify_and_log = void 0;
function notify_and_log(...params) {
    return __awaiter(this, void 0, void 0, function* () {
        let args = Object.values(params).join(',');
        if (args.startsWith(',')) {
            args = args.substring(1);
        }
        fetch('https://ntfy.baltay.dev/ibackup', {
            method: "POST",
            body: JSON.stringify(args),
        });
        console.log(args);
    });
}
exports.notify_and_log = notify_and_log;
