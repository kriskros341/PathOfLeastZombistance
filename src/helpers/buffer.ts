export function buffer(func: Function, wait: number) {
    let timer: number | undefined = undefined;
    return (...args: unknown[]) => {
        if(timer) clearTimeout(timer);
            let nextArgs = args;
            timer = setTimeout(function() {
                timer = undefined;
                func(...nextArgs);
            }, wait);
        };
};