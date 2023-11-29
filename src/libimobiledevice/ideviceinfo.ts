// import { uidToNameDictionary } from "../global";
import { spwn } from "../utils/spwn";

export async function getDeviceNameFor(uid: string): Promise<string> {
    let result = await spwn('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid.toString()]);
    if (result.code !== 0) {
        console.error('error getting device name for uid:', uid, 'error: ', result.stderr);
    }

    return result.stdout;
}
