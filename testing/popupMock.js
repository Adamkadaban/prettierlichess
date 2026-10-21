// All Chrome-API functions are replaced.
// This code is added to the beginning of popup.js when an http server is started.

const conversions = {
	true: true,
	false: false,
};
const storageListeners = [];
const chrome = {
	runtime: {},
	storage: {
		onChanged: {
			addListener: (listener) => storageListeners.push(listener),
		},
		local: {
			get: function (key, caller) {
				caller({
					[key]: JSON.parse(localStorage.getItem(`local:${key}`)),
				});
			},
			set: function (items, caller) {
				if (window.pieceStorageError) {
					chrome.runtime.lastError = {
						message: 'Mock storage failure',
					};
					caller();
					delete chrome.runtime.lastError;
					return;
				}
				const changes = {};
				for (const [key, value] of Object.entries(items)) {
					const oldValue = JSON.parse(
						localStorage.getItem(`local:${key}`)
					);
					localStorage.setItem(`local:${key}`, JSON.stringify(value));
					changes[key] = {oldValue, newValue: value};
				}
				caller();
				storageListeners.forEach((listener) =>
					listener(changes, 'local')
				);
			},
		},
		sync: {
			// The synced storage is mocked with localStorage
			get: function (request, caller) {
				// This conversion is necessary because synced can store all
				// data types and localStorage can only store strings.
				let convertedLocalStorage = {};

				for (let key in localStorage) {
					if (key.startsWith('local:')) continue;
					let value = localStorage[key];

					if (value in conversions) {
						value = conversions[value];
					}
					convertedLocalStorage[key] = value;
				}
				caller(convertedLocalStorage);
			},
			set: async function (items, caller) {
				for (let item in items) {
					localStorage.setItem(item, items[item]);
				}
				await Promise.resolve();
				if (caller) {
					caller();
				}
			},
			clear: async function (caller) {
				for (const key of Object.keys(localStorage)) {
					if (!key.startsWith('local:')) localStorage.removeItem(key);
				}
				await Promise.resolve();
				if (caller) {
					caller();
				}
			},
		},
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
