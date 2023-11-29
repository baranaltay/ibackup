import { activateMuxdDaemons, deactivateMuxdDaemons } from "../daemons";
import { globals, backupPromises } from "../global";
import { stopAllIntervals } from "../intervals";
import { ensureDirectories } from "./ensureDirectories";


export function clearAllVariables() {

    // empty all uids
    globals.connected = [];
    globals.inProgress = [];
    globals.toBeBackedUp = [];
    globals.backedUp = [];
    globals.shouldWait = true;

    // empty all backup promises
    backupPromises.splice(0, backupPromises.length);

    // stop all intervals
    stopAllIntervals();
}