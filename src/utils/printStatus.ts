import { globals } from '../global';
import { getNameForUids } from './getNameFromUid';
import { distinct } from './distinct';
import { stopGetUidInterval, stopProcessInterval } from '../intervals';

export function printStatus() {
    let uids = distinct(globals.toBeBackedUp, globals.inProgress);
    uids = distinct(uids, globals.connected);
    uids = distinct(uids, globals.backedUp);
    if (uids.length === 0) {
        stopGetUidInterval();
        stopProcessInterval();
        globals.shouldWait = false;
    }

    let status = `
#################\n
Connected devices: ${getNameForUids(globals.connected)}\n
In Progress devices: ${getNameForUids(globals.inProgress)}
Backedup devices: ${getNameForUids(globals.backedUp)}\n
Remaining devices: ${getNameForUids(globals.toBeBackedUp)}\n
`;
    console.log(status);
}
