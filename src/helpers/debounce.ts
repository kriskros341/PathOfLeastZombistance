export function debounce(func: Function, timeout = 300) {
	let timer = 0;
	return (...args: any[]) => {
		clearTimeout(timer);
		timer = setTimeout(() => { func(...args) }, timeout);
	};
}