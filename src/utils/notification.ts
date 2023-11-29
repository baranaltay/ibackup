export async function notify_and_log(...params: any[]) {
    let args = Object.values(params).join(',');
    if (args.startsWith(',')) {
        args = args.substring(1);
    }

    fetch('https://ntfy.baltay.dev/ibackup', {
        method: "POST",
        body: args,
    });

    console.log(args);
}