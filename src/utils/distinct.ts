export function distinct(arr1: string[], arr2: string[]) {
    return arr1.filter(x => arr2.indexOf(x) === -1);
}