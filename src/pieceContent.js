(() => {
	let style;
	let changed = false;

	function apply(state) {
		const css = pieceSets.styles(state);
		if (!css) {
			if (style) style.remove();
			style = null;
			return;
		}
		if (!style) {
			style = document.createElement('style');
			style.id = 'prettierlichess-pieces';
			(document.head || document.documentElement).appendChild(style);
		}
		style.textContent = css;
	}

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === 'local' && changes[pieceSets.key]) {
			changed = true;
			apply(changes[pieceSets.key].newValue);
		}
	});
	chrome.storage.local.get(pieceSets.key, (result) => {
		if (chrome.runtime.lastError || changed) return;
		apply(result[pieceSets.key]);
	});
})();
