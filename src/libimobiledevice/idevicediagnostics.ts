import { sleep } from "../utils/sleep";
import { spwn } from "../utils/spwn";

function getIsCharging(arr: string[]): boolean {
    let index = arr.findIndex(x => x.includes('IsCharging'));
    let xml = arr[index + 1];
    return xml.toLowerCase().includes('true');
}

function getCurrentCapacity(arr: string[]): number {
    let index = arr.findIndex(x => x.includes('CurrentCapacity'));
    let xml = arr[index + 1];
    let capacityStr = xml.substring('<integer>'.length, xml.length);
    capacityStr = capacityStr.slice('</integer>'.length * -1);
    return parseInt(capacityStr);
}


export async function getBatteryLevelFor(uid: string): Promise<number> {
    let result = await spwn('idevicediagnostics', ['-n', 'ioregentry', 'AppleSmartBattery', '-u', uid.toString()]);
    if (result.code !== 0) {
        return -1;
    }

    let arr = result.stdout.split('\n');
    let batteryLevel = getCurrentCapacity(arr);
    let IsCharging = getIsCharging(arr);
    console.log(`current battery level is ${batteryLevel}. Device ${IsCharging ? 'is' : 'is not'} charging`)

    return getCurrentCapacity(arr);
    // const { XDocument } = await import('@openxmldev/linq-to-xml');
    // const doc = XDocument.parse(result.stdout);
    // var batteryLevel = doc
    //     .descendants()
    //     .singleOrDefault(x => x.value == 'CurrentBattery' && x.name.localName.toLowerCase() == 'key')
    //     ?.nextNode;
    // console.log(batteryLevel);
}

export async function tryGetBatteryLevel(uid: string): Promise<number> {
    const MAX_TRY_COUNT = 10;
    let tryCounter = 0;
    let result = -1;
    while (++tryCounter < MAX_TRY_COUNT && (result = await getBatteryLevelFor(uid)) === -1) {
        console.log(`could not read battery level... will try again (try count: ${tryCounter}/${MAX_TRY_COUNT})`);
        await sleep(1);
    }

    return result;
}
