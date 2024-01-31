export function throttle(func: Function, delay: number) {
    let timerFlag: number | undefined = undefined;
    let nextArgs: unknown[] = [];

    return (...args: unknown[]) => {
        nextArgs = args
        if (!timerFlag) {
            func(...nextArgs); 
            timerFlag = setTimeout(() => {
                timerFlag = undefined;
            }, delay);
        }
    };
}

