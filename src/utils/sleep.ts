export function sleep(seconds: number): Promise<void> { return new Promise(r => setTimeout(r, seconds * 1000)); }

export async function sleepUntilTomorrowMidnight(): Promise<void> {
    const date = new Date(); // gives now
    date.setDate(date.getDate() + 1);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const now = new Date();
    const untilMidnight = Math.abs(now.getTime() - date.getTime()) / 1000;
    console.log('sleeping until ' + date);
    await sleep(untilMidnight);
}

