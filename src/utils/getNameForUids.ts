import * as fs from "node:fs";
import { createKnownUidFor, getKnownUidPathFor } from "./uidProcessor";
import { getDeviceNameFor } from "../libimobiledevice/ideviceinfo";

const dictionary: { [key: string]: string } = {};

export function tryGetDeviceNameFor(uid: string): string {
    let file = getKnownUidPathFor(uid);

    if (uid in dictionary) {
        return dictionary[uid];
    }

    if (fs.existsSync(file)) {
        return dictionary[uid] = fs.readFileSync(file, 'utf-8').trim();
    }

    let name = getDeviceNameFor(uid);
    if (name !== '') {
        dictionary[uid] = name;
        createKnownUidFor(uid, name);
        return name;
    }

    return uid;
}