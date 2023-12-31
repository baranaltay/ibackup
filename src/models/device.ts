import { startBackupForAsync } from '../libimobiledevice/idevicebackup2';
import { getBatteryLevelFor, tryGetBatteryLevelAsync } from '../libimobiledevice/idevicediagnostics';
import { getDeviceNameFor } from '../libimobiledevice/ideviceinfo';
import { IBattery, IDevice } from '../types';
import { createBackupFlagFor, createKnownUidFor, getKnownUidPathFor, isBackupFlagPresentFor } from '../utils/uidProcessor';
import * as fs from 'node:fs';

export class Device implements IDevice {
    public uid: string = '';
    public isBackedUp: boolean = false;
    public alreadyBackedUp: boolean = false;
    public isInProgress: boolean = false;
    public batteryDifference: number = -1;
    public reason: string = '';

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
        this.reason = '';
        this.alreadyBackedUp = false;
        this.isBackedUp = false;
        this.isInProgress = false;
        this._battery = { isCharging: false, level: -1 };
    }

    async startBackupAsync(): Promise<void> {

        if (this.isInProgress) {
            return;
        }

        if (this.alreadyBackedUp || isBackupFlagPresentFor(this.uid)) {
            this.alreadyBackedUp = true;
            this.log(`already backed up`);
            this.reason = 'already backed up';
            return;
        }

        let battery = this.battery;
        if (battery == null) {
            this.log(`skipping because could not read battery level`);
            this.reason = 'could not read battery level';
            return;
        }

        if (battery.level < 50) {
            this.log(`skipping because battery is lower than 50% (${battery.level}%)`);
            this.reason = `battery is lower than 50% (${battery.level}%)`;
            return;
        }

        this.isInProgress = true;
        this.log('requesting backup');
        let { code, stderr } = await startBackupForAsync(this.uid);
        let endBatteryLevel = await tryGetBatteryLevelAsync(this);
        this.batteryDifference = (endBatteryLevel?.level || 0) - (battery.level || 0);
        if (code === 0) {
            createBackupFlagFor(this.uid);
            this.isBackedUp = true;
        }

        // cancelled by user
        if (code === 48) {
            stderr += 'cancelled by user';
            this.reason = 'cancelled by user';
        }

        this.isInProgress = false;
        this.log(`backup ${code == 0 ? 'success' : 'failed'} for ${this.name}! (Battery level: ${battery.level}% -> ${endBatteryLevel?.level}%) ${stderr}`);
    }

    private log(str: any) {
        console.log(`[${this.name}] ${str}`);
    }
}