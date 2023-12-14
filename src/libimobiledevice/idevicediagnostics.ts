import { execFileSync, execSync } from "child_process";
import { IBattery, IDevice } from "../types";
import { execAsync } from "../utils/execAsync";
import { sleep } from "../utils/sleep";
import { env } from "../global";


function getIsCharging(arr: string[]): boolean {
    let index = arr.findIndex(x => x.includes('IsCharging'));
    let xml = arr[index + 1];
    return xml.toLowerCase().includes('true');
}

function getCurrentCapacity(arr: string[]): number {
    let index = arr.findIndex(x => x.trim() == '<key>CurrentCapacity</key>');
    let xml = arr[index + 1];

    let capacityStr = xml.trim().slice('<integer>'.length).slice(0, '</integer>'.length * -1);
    return parseInt(capacityStr);
}

function parseStdout(stdout: string): IBattery {
    let arr = stdout.split('\n');
    let level = getCurrentCapacity(arr);
    let isCharging = getIsCharging(arr);

    if (level === -1) {
        console.log('could not read the battery level from this stdout:')
        console.log(stdout);
    }

    return { level, isCharging };
}

export async function getBatteryLevelForAsync(uid: string): Promise<IBattery | null> {
    let result = await execAsync('idevicediagnostics', ['-n', 'ioregentry', 'AppleSmartBattery', '-u', uid.toString()]);

    if (result.code !== 0) {
        return null;
    }

    return parseStdout(result.stdout);
}

export async function tryGetBatteryLevelAsync(device: IDevice): Promise<IBattery | null> {
    const MAX_TRY_COUNT = 10;
    let tryCounter = 0;
    let result: IBattery | null = null;
    while (++tryCounter < MAX_TRY_COUNT && (result = (await getBatteryLevelForAsync(device.uid))) == null) {
        console.warn(`could not read battery level for ${device.name}... will try again (try count: ${tryCounter}/${MAX_TRY_COUNT})`);
        await sleep(1);
    }

    return result;
}

export function getBatteryLevelFor(uid: string): IBattery | null {
    try {
        let result = execSync('idevicediagnostics ' + ['-n', 'ioregentry', 'AppleSmartBattery', '-u', uid].join(' '), { env: env }).toString();
        return parseStdout(result);

    } catch (error: any) {
        let stdout = error.stdout.toString();
        if (stdout != '')
            console.error(stdout);
        console.error(error.message);
    }

    return null;
}