import { SpawnResult } from "../types";
import { exec } from "node:child_process";

export async function execAsync(name: string, args: string[]): Promise<SpawnResult> {
    return new Promise(function (resolve, reject) {
        exec(`${name} ${args.join(' ')}`, function (err, stdout, stderr) {

            if (err) {
                console.error(err);
            }

            resolve({
                code: err == null ? 0 : 1,
                stderr,
                stdout
            });
        });
    });
}