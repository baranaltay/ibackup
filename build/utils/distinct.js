"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinct = void 0;
function distinct(arr1, arr2) {
    return arr1.filter(x => arr2.indexOf(x) === -1);
}
exports.distinct = distinct;
