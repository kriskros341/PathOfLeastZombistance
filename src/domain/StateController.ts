export class StateController<T> {
	state: T = {} as T;

	constructor(defaults: Partial<T> = {}) {
		this.state = { ...this.state, ...defaults }
	}
	update(newState: Partial<T>) {
		this.state = { ...this.state, ...newState }
	}
}