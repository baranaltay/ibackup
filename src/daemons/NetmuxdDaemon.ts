import EventEmitter from 'node:events';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { IDaemon } from '.';

export class NetmuxdDaemon extends EventEmitter implements IDaemon {
    private readonly NETMUXD_CMD_NAME = 'netmuxd';
    private readonly NETMUXD_CMD_ARGS = [/*'--disable-unix', '--host', '127.0.0.1'*/];
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
        this._cmd = spawn(this.NETMUXD_CMD_NAME, this.NETMUXD_CMD_ARGS);
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
