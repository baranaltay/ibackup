import EventEmitter from 'node:events';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { IDaemon } from '.';

export class Usbmuxd2Daemon extends EventEmitter implements IDaemon {
    private readonly USBMUXD_CMD_NAME = 'usbmuxd';
    private readonly USBMUXD_CMD_ARGS = ['-z', '-f'];
    private _cmd: ChildProcessWithoutNullStreams | null = null;

    isActivated: boolean = false;

    constructor() {
        super();
    }

    activate(): void {
        if (this.isActivated) {
            return;
        }

        console.log('activating netmuxd');
        this._cmd = spawn(this.USBMUXD_CMD_NAME, this.USBMUXD_CMD_ARGS);
        this._cmd.stdout.on('data', (data) => {
            let stdout: string = data.toString();

            if (stdout.toLowerCase().startsWith('adding')) {
                let uid = stdout.split(' ')[2];
                this.emit('connect', uid.trim());
            } else if (stdout.toLocaleLowerCase().startsWith('removing')) {
                let uid = stdout.split(' ')[1];
                this.emit('disconnect', uid.trim());
            }
        });
        this.isActivated = true;
    }
    deactivate(): void {
        console.log('deactivating netmuxd');
        this.removeAllListeners();
        this._cmd?.kill();
        this._cmd = null;
        this.isActivated = false;
    }
}
