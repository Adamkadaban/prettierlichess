// All Chrome-API functions are replaced.
// This code is added to the beginning of popup.js when an http server is started.

function mockStorage(area) {
	const prefix = area === 'local' ? 'local:' : '';
	function keys() {
		return Object.keys(localStorage).filter((key) =>
			area === 'local'
				? key.startsWith('local:')
				: !key.startsWith('local:')
		);
	}
	function complete(action, caller) {
		let result;
		try {
			result = action();
		} catch (error) {
			chrome.runtime.lastError = {message: error.message};
		}
		try {
			caller?.(result);
		} finally {
			delete chrome.runtime.lastError;
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
					const value = localStorage.getItem(prefix + key);
					if (value !== null) {
						try {
							result[key] = JSON.parse(value);
						} catch {
							result[key] = value;
						}
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
			complete(() => {
				for (const key in items) {
					localStorage.setItem(
						prefix + key,
						JSON.stringify(items[key])
					);
				}
			}, caller);
		},
		clear: function (caller) {
			complete(() => {
				for (const key of keys()) localStorage.removeItem(key);
			}, caller);
		},
	};
}

const chrome = {
	runtime: {},
	storage: {
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
