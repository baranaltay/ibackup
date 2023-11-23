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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kill = exports.killAll = exports.killProcess = exports.child_processes = void 0;
const fs = __importStar(require("node:fs"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const uidProcesser_1 = require("./uidProcesser");
exports.child_processes = {};
function killProcess(name) {
    console.log('killing process', name);
    if (name in exports.child_processes) {
        exports.child_processes[name].kill();
        delete exports.child_processes[name];
    }
    let pidFileName = (0, uidProcesser_1.getPidFileNameFor)(name);
    if (fs.existsSync(pidFileName)) {
        console.log('removing pid file', pidFileName);
        fs.unlinkSync(pidFileName);
    }
}
exports.killProcess = killProcess;
function killAll() {
    console.log('kill all invoked. Begin cleaning up..');
    // console.log('pids to kill: ', child_processes);
    for (let name in exports.child_processes) {
        killProcess(name);
    }
    const files = fs.readdirSync(config_1.PIDS_FOLDER);
    console.log('pid files to kill: ', files);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path_1.default.join(config_1.PIDS_FOLDER, file);
        let pid = fs.readFileSync(filePath, 'utf-8');
        kill(pid);
        fs.unlinkSync(filePath);
    }
}
exports.killAll = killAll;
function kill(pid, signal = '-9') {
    (0, child_process_1.execSync)(`kill ${signal} ${pid}`);
}
exports.kill = kill;
