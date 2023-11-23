// import { uidToNameDictionary } from "../global";
import { spwn } from "../utils/spwn";
import { createKnownUidFor } from "../utils/uidProcesser";

export async function getDeviceNameFor(uid: string): Promise<string> {
    let result = await spwn('ideviceinfo', ['-n', '-k', 'DeviceName', '-u', uid.toString()]);
    if (result.code !== 0) {
        console.error('error getting device name for uid:', uid, 'error: ', result.stderr);
    }

    if (!(uid in globalThis.uidToNameDictionary) || globalThis.uidToNameDictionary[uid] == uid) {
        createKnownUidFor(uid, result.stdout);
    }

    return result.stdout;
}
