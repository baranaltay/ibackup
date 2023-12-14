
// class Globals {

//     public shouldWait: boolean = true;

//     constructor() {
//         this.reset();
//     }

//     reset() {
//         this.shouldWait = true;
//     }
// }

// export const globals = new Globals();

export const env = { ...process.env, USBMUXD_SOCKET_ADDRESS: '127.0.0.1:27015' };