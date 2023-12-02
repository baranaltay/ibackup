import { execAsync } from "../utils/execAsync";

export async function getAllUids(): Promise<string[]> {
    let { stdout, stderr, code } = await execAsync('idevice_id', ['-n']);
    if (code == 0) {
        return stdout.split('\n').map(x => x.trim()).filter(x => x !== '');
    }

    return [];
}


