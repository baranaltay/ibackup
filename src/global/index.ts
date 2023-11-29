// export const uidToNameDictionary: { [key: string]: string } = {};

export const globals: {
    toBeBackedUp: string[],
    connected: string[],
    inProgress: string[],
    backedUp: string[],
    shouldWait: boolean
} = {
    toBeBackedUp: [],
    connected: [],
    inProgress: [],
    backedUp: [],
    shouldWait: true
};

export const backupPromises: Promise<void>[] = [];