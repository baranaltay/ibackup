import { spwn } from '../utils/spwn';

export async function getAllUids(): Promise<string[]> {
    let { stdout, stderr, code } = await spwn('idevice_id', ['-n']);
    if (code == 0) {
        return stdout.split('\n').map(x => x.trim()).filter(x => x !== '');
    }

    return [];
}


