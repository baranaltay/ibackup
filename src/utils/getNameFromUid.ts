import * as fs from "node:fs";
import { getDeviceNameFor } from "../libimobiledevice";
import { createKnownUidFor, getKnownUidPathFor } from "./uidProcessor";

const uidToNameDictionary: { [key: string]: string } = {};

interface GetDeviceNameResult {
    isSuccess: boolean,
    name: string
}

function tryGetDeviceNameFor(uid: string): GetDeviceNameResult {
    let file = getKnownUidPathFor(uid);
    let name = uid;

    if (fs.existsSync(file)) {
        name = `"${fs.readFileSync(file, 'utf-8')}"`;
    } else {
        getDeviceNameFor(uid).then((res) => {
            uidToNameDictionary[uid] = res;
            createKnownUidFor(file, res);
        });
    }

    return { isSuccess: name !== uid, name };
}

export function getNameForUid(uid: string): string {
    if (uid in uidToNameDictionary) {
        return uidToNameDictionary[uid];
    }

    let { isSuccess, name } = tryGetDeviceNameFor(uid);
    if (isSuccess) {
        uidToNameDictionary[uid] = name;
    }

    return name;
}

export function getNameForUids(uids: string[]): string[] {
    let names: string[] = [];
    for (let i = 0; i < uids.length; i++) {
        const uid = uids[i];
        names.push(getNameForUid(uid));
    }
    return names;
}