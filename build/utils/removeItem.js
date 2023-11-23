"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItemFromArray = void 0;
function removeItemFromArray(arr, value) {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}
exports.removeItemFromArray = removeItemFromArray;
