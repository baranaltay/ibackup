import { ChildProcessWithoutNullStreams } from "node:child_process"

export interface child_process {
    [key: string]: ChildProcessWithoutNullStreams
}

export interface SpawnResult {
    stdout: string,
    stderr: string,
    code: number | null
}

export interface IDevice {
    name: string,
    uid: string,
    battery: IBattery | null,
    isBackedUp: boolean,
    isInProgress: boolean
}

export interface IBattery {
    level: number,
    isCharging: boolean
}