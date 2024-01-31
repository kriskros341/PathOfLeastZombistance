class PriorityQueue<T> {
	_list: [T, number][] = [];
	enqueue(newItem: T, newValue: number) {
		let idx = 0
		if (!this._list.length) {
			this._list.push([newItem, newValue])
		}
		for (; idx < this._list.length; idx++) {
			if (newValue > this._list[idx][1]) {
				break;
			}
		}
		this._list.splice(idx, 0, [newItem, newValue])
	}

	dequeue() {
		return this._list.pop()
	}
}

export default PriorityQueue;