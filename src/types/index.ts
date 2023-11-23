import { ChildProcessWithoutNullStreams } from "node:child_process"

export interface child_process {
    [key: string]: ChildProcessWithoutNullStreams
}
export interface SpawnResult {
    stdout: string,
    stderr: string,
    code: number | null
}

export enum ReturnLoop {
    continue,
    break
}