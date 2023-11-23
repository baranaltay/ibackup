import { sleep } from '../utils/sleep';
import { child_processes, killAll } from '../utils/process';
import { spwn } from '../utils/spwn';
import { generateCommandName } from '../utils/generateCommandName';
import { getPidFileNameFor } from '../utils/uidProcesser';
import { existsSync, readFileSync } from 'node:fs';
import { kill } from 'node:process';

const NETMUXD_CMD_NAME = 'aarch64-linux-netmuxd';
const NETMUXD_CMD_ARGS = ['--disable-unix', '--host', '127.0.0.1'];

const USBMUXD_CMD_NAME = 'usbmuxd';
const USBMUXD_CMD_ARGS = ['-z', '-f'];

async function activateNetmuxd(): Promise<void> {
    spwn(NETMUXD_CMD_NAME, NETMUXD_CMD_ARGS, true, true);
    await sleep(1);
}

async function activateUsbmuxd(): Promise<void> {
    spwn(USBMUXD_CMD_NAME, USBMUXD_CMD_ARGS, true, true);
    await sleep(1);
}

function deactivateNetmuxd() {
    let cmdName = generateCommandName(NETMUXD_CMD_NAME, NETMUXD_CMD_ARGS);
    deactivate(cmdName);
}

function deactivateUsbmuxd() {
    let cmdName = generateCommandName(USBMUXD_CMD_NAME, USBMUXD_CMD_ARGS);
    deactivate(cmdName);
}

function deactivate(cmdName: string) {
    if (cmdName in child_processes) {
        child_processes[cmdName].kill();
        return;
    }

    let pidFile = getPidFileNameFor(cmdName);
    if (existsSync(pidFile)) {
        let pid = readFileSync(pidFile, 'utf-8');
        kill(parseInt(pid), 'SIGTERM');
    }
}

export async function activateMuxdDaemons(): Promise<void> {
    console.log('activating muxd daemons');
    await activateUsbmuxd();
    await activateNetmuxd();
}

export async function deactivateMuxdDaemons(): Promise<void> {
    console.log('deactivating muxd daemons');
    await deactivateUsbmuxd();
    await deactivateNetmuxd();
}