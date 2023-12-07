import EventEmitter from 'node:events';
import { NetmuxdDaemon } from './NetmuxdDaemon';

export interface IDaemon {
    activate(): void;
    deactivate(): void;
    isActivated: boolean;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
}

export class Daemon extends EventEmitter implements IDaemon {

    private readonly _netmuxd: IDaemon;

    public get isActivated(): boolean {
        return this._netmuxd.isActivated;
    }

    constructor() {
        super();
        this._netmuxd = new NetmuxdDaemon();
    }

    public async activate() {
        this._netmuxd.on('connect', (e) => this.emit('connect', e));
        this._netmuxd.on('disconnect', (e) => this.emit('disconnect', e));
        this._netmuxd.activate();
    }

    public deactivate() {
        this.removeAllListeners();
        this._netmuxd.deactivate();
    }
}