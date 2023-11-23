export function generateCommandName(name: string, args: string[]) {
    let cmdName = name + '_' + args.map(x => x.toString().replaceAll(' ', '_').replaceAll(',', '_') + '_');
    return cmdName;
}
