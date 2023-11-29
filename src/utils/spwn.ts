import * as fs from 'node:fs';
import { spawn } from "child_process";
import { SpawnResult } from "../types";
import { child_processes, killProcess } from "./process";
import { getPidFileNameFor, getLogFileFor } from "./uidProcessor";
import { generateCommandName } from './generateCommandName';

export async function spwn(name: string, args: string[], logToFile: boolean = false, isUsbmuxd: boolean = false): Promise<SpawnResult> {
    let cmdName = generateCommandName(name, args);
    if (cmdName in child_processes) {
        killProcess(cmdName);
    }

    return new Promise(async (resolve, reject) => {
        const environment = process.env;
        // if (!isUsbmuxd) {
        //     environment.USBMUXD_SOCKET_ADDRESS = '127.0.0.1:27015';
        // }
        const cmd = spawn(name, args, { env: environment });
        child_processes[cmdName] = cmd;
        // console.log('spawning ', name);

        let pidFileName = getPidFileNameFor(cmdName);
        fs.writeFileSync(pidFileName, cmd.pid?.toString() || 'no-pid');

        const result: SpawnResult = {
            stdout: '',
            stderr: '',
            code: -1
        };

        let logStream: fs.WriteStream;
        if (logToFile) {
            let logFile = getLogFileFor(cmdName);
            logStream = fs.createWriteStream(logFile, { flags: 'a' });
            cmd.stdout.pipe(logStream);
            cmd.stderr.pipe(logStream);
        } else {
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
            // console.log(`${cmdName} exited with code: ${code}`);
            let pidFileName = getPidFileNameFor(cmdName);
            if (fs.existsSync(pidFileName)) {
                fs.unlinkSync(pidFileName);
            }
            delete child_processes[cmdName];
            result.code = code;
            if (logStream != null) {
                logStream.end();
            }

            if (code !== 0 && result.stderr != '') {
                console.warn(`${name} error: ${result.stderr}`);
            }

            resolve(result);
        });
    });
}


