(() => {
	let style;
	let changed = false;
	let revision = 0;

	async function apply(state) {
		const current = ++revision;
		if (style) style.remove();
		style = null;
		try {
			const css = await pieceSets.styles(state || pieceSets.empty());
			if (current !== revision || !css) return;
			style = document.createElement('style');
			style.id = 'prettierlichess-pieces';
			style.textContent = css;
			(document.head || document.documentElement).appendChild(style);
		} catch (error) {
			if (current === revision)
				console.warn('Prettier Lichess:', error.message);
		}
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
