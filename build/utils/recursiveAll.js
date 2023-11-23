"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseAllDynamic = void 0;
function PromiseAllDynamic(promises) {
    return new Promise(resolve => {
        const wait = () => {
            const length = promises.length;
            Promise.all(promises).then(data => {
                if (length == promises.length)
                    resolve(data);
                else
                    wait();
            });
        };
        wait();
    });
}
exports.PromiseAllDynamic = PromiseAllDynamic;
;
