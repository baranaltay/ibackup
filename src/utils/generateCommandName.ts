export function generateCommandName(name: string, args: string[]) {
    return name + '_' + args.map(x => x.replaceAll(' ', '_').replaceAll('/', '#') + '_').join('_').slice(0, -1);
}
