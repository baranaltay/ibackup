import { spwn } from "../utils/spwn";

export async function getDeviceNameFor(uid: string): Promise<string> {
    let result = await spwn('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid.toString()]);
    return result.stdout;
}
