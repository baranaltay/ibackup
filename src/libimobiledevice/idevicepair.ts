import { execAsync } from '../utils/execAsync';


export async function getAllPairedUids(): Promise<string[]> {
    let { stdout, stderr, code } = await execAsync('idevicepair', ['-n', 'list']);
    if (code == 0) {
        return stdout.split('\n').map(x => x.trim()).filter(x => x !== '');
    }

    console.warn('get paired uids failed with exit code: ', code, stderr);
    return [];
}
