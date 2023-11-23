export function PromiseAllDynamic(promises: Promise<any>[]): Promise<any> {
    return new Promise(resolve => {
        const wait = () => {
            const length = promises.length
            Promise.all(promises).then(data => {
                if (length == promises.length)
                    resolve(data)
                else
                    wait()
            })
        }
        wait()
    })
};
