"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommandName = void 0;
function generateCommandName(name, args) {
    return name + '_' + args.map(x => x.replaceAll(' ', '_').replaceAll('/', '#') + '_').join('_').slice(0, -1);
}
exports.generateCommandName = generateCommandName;
