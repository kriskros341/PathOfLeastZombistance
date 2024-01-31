class DefaultMap<K, V> extends Map<K, V> {
	defaultValue: V;
	constructor(defaultValue: V) {
		super();
		this.defaultValue = defaultValue;
	}

	get(key: K): V {
		return super.get(key) ?? this.defaultValue;
	}

	getOrDefault(key: K, other: V): V {
		return super.get(key) ?? other;
	}
}

export default DefaultMap;