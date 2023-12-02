import { startBackupForAsync } from '../libimobiledevice/idevicebackup2';
import { getBatteryLevelFor, tryGetBatteryLevelAsync } from '../libimobiledevice/idevicediagnostics';
import { getDeviceNameFor } from '../libimobiledevice/ideviceinfo';
import { IBattery, IDevice } from '../types';
import { createBackupFlagFor, createKnownUidFor, getKnownUidPathFor, isBackupFlagPresentFor } from '../utils/uidProcessor';
import * as fs from 'node:fs';

export class Device implements IDevice {
    public uid: string = '';
    public isBackedUp: boolean = false;
    public isInProgress: boolean = false;
    public batteryDifference: number = -1;

    private _name: string = '';
    public get name() {
        if (this._name !== '') {
            return this._name;
        }
        return this._name = this.getName();
    }

    private _battery: IBattery | null = null;
    public get battery() {
        if (this._battery !== null) {
            return this._battery;
        }
        return this._battery = this.getBattery();
    }

    constructor(uid: string) {
        this.uid = uid;
    }

    private getName(): string {
        let name = this.uid;
        let file = getKnownUidPathFor(this.uid);
        if (fs.existsSync(file)) {
            name = `"${fs.readFileSync(file, 'utf-8').trim()}"`;
        } else {
            name = `"${getDeviceNameFor(this.uid)}"`;
            createKnownUidFor(this.uid, name);
        }

        return name;
    }

    private getBattery(): IBattery | null {
        return getBatteryLevelFor(this.uid);
    }

    public reset() {
        this.isBackedUp = false;
        this.isInProgress = false;
        this._battery = { isCharging: false, level: -1 };
    }

    async startBackupAsync(): Promise<void> {

        if (this.isInProgress || this.isBackedUp) {
            return;
        }

        if (isBackupFlagPresentFor(this.uid)) {
            this.isBackedUp = true;
            this.log(`already backed up`);
            return;
        }

        let battery = this.battery;
        if (battery === null) {
            this.log(`skipping because could not read battery level`);
            return;
        }

        if (battery.level < 50) {
            this.log(`skipping because battery is lower than 50% (${this.battery?.level}%)`);
            return;
        }

        this.isInProgress = true;
        let { stdout, stderr, code } = await startBackupForAsync(this.uid);
        let endBatteryLevel = await tryGetBatteryLevelAsync(this);
        this.batteryDifference = (endBatteryLevel?.level || 0) - (this.battery?.level || 0);
        if (code == 0) {
            createBackupFlagFor(this.uid);
            this.isBackedUp = true;
        }

        this.isInProgress = false;
        this.log(`backup ${code == 0 ? 'success' : 'failed'} for ${this.name}! (Battery level: ${this.battery?.level}% -> ${endBatteryLevel?.level}%) ${stderr}`);
    }

    private log(str: any) {
        console.log(`[${this.name}] ${str}`);
    }
}