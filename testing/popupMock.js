// All Chrome-API functions are replaced.
// This code is added to the beginning of popup.js when an http server is started.

const storageListeners = [];

function mockStorage(area) {
	const prefix = area === 'local' ? 'local:' : '';
	function keys() {
		return Object.keys(localStorage).filter((key) =>
			area === 'local'
				? key.startsWith('local:')
				: !key.startsWith('local:')
		);
	}
	function read(key) {
		const value = localStorage.getItem(prefix + key);
		if (value === null) return undefined;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}
	async function complete(action, caller, changes) {
		let result;
		let failure;
		try {
			result = action();
		} catch (error) {
			failure = error;
		}
		await Promise.resolve();
		try {
			if (failure) {
				chrome.runtime.lastError = {message: failure.message};
			}
			caller?.(result);
		} finally {
			delete chrome.runtime.lastError;
		}
		if (!failure && changes) {
			storageListeners.forEach((listener) => listener(changes, area));
		}
	}
	return {
		get: function (request, caller) {
			complete(() => {
				const result = {};
				const requested =
					request === null
						? keys().map((key) => key.slice(prefix.length))
						: typeof request === 'string'
						? [request]
						: Array.isArray(request)
						? request
						: Object.keys(request);
				for (const key of requested) {
					const value = read(key);
					if (value !== undefined) {
						result[key] = value;
					} else if (
						request &&
						typeof request === 'object' &&
						!Array.isArray(request)
					) {
						result[key] = request[key];
					}
				}
				return result;
			}, caller);
		},
		set: function (items, caller) {
			const changes = {};
			return complete(
				() => {
					if (area === 'local' && window.pieceStorageError) {
						throw new Error('Mock storage failure');
					}
					for (const key in items) {
						const oldValue = read(key);
						localStorage.setItem(
							prefix + key,
							JSON.stringify(items[key])
						);
						changes[key] = {oldValue, newValue: items[key]};
					}
				},
				caller,
				changes
			);
		},
		clear: function (caller) {
			return complete(() => {
				for (const key of keys()) localStorage.removeItem(key);
			}, caller);
		},
	};
}

const chrome = {
	runtime: {
		getURL: (path) => new URL(path, location.href).href,
	},
	storage: {
		onChanged: {
			addListener: (listener) => storageListeners.push(listener),
		},
		sync: mockStorage('sync'),
		local: mockStorage('local'),
	},
	// The downloads-API is simulated with a HTML element
	downloads: {
		download: function (options) {
			let link = document.createElement('a');
			link.setAttribute('download', options['filename']);
			link.href = options['url'];
			link.click();
		},
	},
	// The tab functions are not simulated but still replaced to avoid errors
	tabs: {
		query: function (properties, caller) {
			caller([
				{id: 0, url: 'https://www.lichess.org'},
				{id: 1, url: 'https://www.lichess.org'},
				{id: 2, url: undefined},
			]);
			console.log(
				`[Mock] chrome.tabs.query(${JSON.stringify(properties)})`
			);
		},
		executeScript: function (id, properties) {
			console.log(
				`[Mock] chrome.tabs.executeScript(${JSON.stringify(
					id
				)}, ${JSON.stringify(properties)})`
			);
		},
	},
};

window.chrome = chrome;
