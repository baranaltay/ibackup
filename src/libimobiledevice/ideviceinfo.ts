import { execFileSync } from "child_process";
import { execAsync } from "../utils/execAsync";

export async function getDeviceNameForAsync(uid: string): Promise<string> {
    let result = await execAsync('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid.toString()]);
    if (result.code !== 0) {
        console.error('error getting device name for uid:', uid, 'error: ', result.stderr);
    }

    return result.stdout.trim();
}
export function getDeviceNameFor(uid: string): string {
    try {
        return execFileSync('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid]).toString().trim();
    } catch (error) {
        console.error('error getting device name for uid:', uid, 'error: ', error);
    }

    return '';
}
