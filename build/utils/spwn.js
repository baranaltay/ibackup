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
exports.spwn = void 0;
const fs = __importStar(require("node:fs"));
const child_process_1 = require("child_process");
const process_1 = require("./process");
const uidProcesser_1 = require("./uidProcesser");
const generateCommandName_1 = require("./generateCommandName");
function spwn(name, args, logToFile = false, isUsbmuxd = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let cmdName = (0, generateCommandName_1.generateCommandName)(name, args);
        if (cmdName in process_1.child_processes) {
            (0, process_1.killProcess)(cmdName);
        }
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const environment = process.env;
            if (!isUsbmuxd) {
                environment.USBMUXD_SOCKET_ADDRESS = '127.0.0.1:27015';
            }
            const cmd = (0, child_process_1.spawn)(name, args, { env: environment });
            process_1.child_processes[cmdName] = cmd;
            console.log('spawning ', name, args, 'with pid: ', cmd.pid);
            let pidFileName = (0, uidProcesser_1.getPidFileNameFor)(cmdName);
            fs.writeFileSync(pidFileName, ((_a = cmd.pid) === null || _a === void 0 ? void 0 : _a.toString()) || 'no-pid');
            // console.log('creating pid file ', pidFileName);
            const result = {
                stdout: '',
                stderr: '',
                code: -1
            };
            let logStream;
            if (logToFile) {
                let logFile = (0, uidProcesser_1.getLogFileFor)(cmdName);
                logStream = fs.createWriteStream(logFile, { flags: 'a' });
                cmd.stdout.pipe(logStream);
                cmd.stderr.pipe(logStream);
            }
            else {
                cmd.stdout.on('data', (data) => {
                    let content = (data.toString() + '\n').trim();
                    result.stdout += content;
                });
                cmd.stderr.on('data', (data) => {
                    let content = (data.toString() + '\n').trim();
                    result.stderr += content;
                });
            }
            cmd.on('exit', (code) => {
                console.log(`${cmdName} exited with code: ${code}`);
                // console.log('cleaning up pid files...');
                let pidFileName = (0, uidProcesser_1.getPidFileNameFor)(cmdName);
                if (fs.existsSync(pidFileName)) {
                    fs.unlinkSync(pidFileName);
                }
                delete process_1.child_processes[cmdName];
                result.code = code;
                if (logStream != null) {
                    logStream.end();
                }
                resolve(result);
            });
        }));
    });
}
exports.spwn = spwn;
