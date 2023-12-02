export function distinct(arr1: string[], arr2: string[]) {
    return arr1.filter(x => arr2.indexOf(x) === -1);
}

export function removeItemFromArray<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}