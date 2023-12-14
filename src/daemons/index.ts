import EventEmitter from 'node:events';
import { NetmuxdDaemon } from './NetmuxdDaemon';
import { Usbmuxd2Daemon } from './Usbmuxd2Daemon';

export interface IDaemon {
    activate(): void;
    deactivate(): void;
    isActivated: boolean;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
}

export class Daemon extends EventEmitter implements IDaemon {

    private readonly _muxd: IDaemon;

    public get isActivated(): boolean {
        return this._muxd.isActivated;
    }

    constructor() {
        super();
        this._muxd = new NetmuxdDaemon();
    }

    public async activate() {
        this._muxd.on('connect', (e) => this.emit('connect', e));
        this._muxd.on('disconnect', (e) => this.emit('disconnect', e));
        this._muxd.activate();
    }

    public deactivate() {
        this.removeAllListeners();
        this._muxd.deactivate();
    }
}