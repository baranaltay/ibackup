import { getNameForUid } from "../utils/getNameFromUid";
import { isBackupFlagPresentFor } from "../utils/uidProcessor";

export function removeFromArrayIfBackupPresent(uids: string[]) {
    for (let i = uids.length - 1; i >= 0; i--) {
        const uid = uids[i];

        if (isBackupFlagPresentFor(uid)) {
            console.log('backup present today for ' + getNameForUid(uid))
            uids.splice(i, 1);
        }
    }
}