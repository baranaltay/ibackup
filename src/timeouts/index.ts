import { PROCESS_TIMEOUT_SECONDS } from "../config";
import { globals } from "../global";
import { clearAllVariables } from "../operations/initiateStart";

export async function startProcessTimeout() {
    setTimeout(() => {
        clearAllVariables();
        globals.shouldWait = false;
    }, PROCESS_TIMEOUT_SECONDS);
}