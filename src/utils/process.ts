import * as fs from 'node:fs';
import { execSync } from "child_process";
import path from "path";
import { PIDS_FOLDER } from "../config";
import { child_process } from "../types";
import { getPidFileNameFor } from "./uidProcessor";

export const child_processes: child_process = {};

export function killProcess(name: string) {
    console.log('killing process', name);
    if (name in child_processes) {
        child_processes[name].kill();
        delete child_processes[name];
    }

    let pidFileName = getPidFileNameFor(name);
    if (fs.existsSync(pidFileName)) {
        console.log('removing pid file', pidFileName);
        fs.unlinkSync(pidFileName);
    }
}

export function killAll() {
    console.log('kill all invoked. Begin cleaning up..');
    // console.log('pids to kill: ', child_processes);
    for (let name in child_processes) {
        killProcess(name);
    }

    const files = fs.readdirSync(PIDS_FOLDER);
    console.log('pid files to kill: ', files);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(PIDS_FOLDER, file);
        let pid = fs.readFileSync(filePath, 'utf-8');
        kill(pid);
        fs.unlinkSync(filePath);
    }
}

export function kill(pid: string, signal: string = '-9') {
    execSync(`kill ${signal} ${pid}`);
}
