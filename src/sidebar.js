(() => {
	let enabled = false;
	let collapsed = false;
	let button;
	const desktop = window.matchMedia('(min-width: 1261px)');
	const root = document.documentElement;

	function supportedMain() {
		if (/^\/(broadcast|practice|embed)(\/|$)/.test(location.pathname))
			return;
		const main = document.querySelector(
			'#main-wrap > main.analyse:not(.is-relay):not(.has-relay-tour), #main-wrap > main.round'
		);
		if (!main || !desktop.matches) return;
		const layout = getComputedStyle(main);
		const firstRow = layout.gridTemplateAreas.match(/"([^"]+)"/)?.[1];
		// Only the native three-column layout has the sidebar to the left.
		if (
			layout.display === 'grid' &&
			(firstRow?.startsWith('side . board ') ||
				firstRow === 'side app app')
		)
			return main;
	}

	function render() {
		const main = enabled && supportedMain();
		const header = document.querySelector('#top .site-buttons');
		const active = !!(main && header);
		if (active && !button) {
			button = document.createElement('button');
			button.type = 'button';
			button.className = 'pl-sidebar-toggle';
			// Keep native button activation without invoking page shortcuts.
			for (const type of ['keydown', 'keypress', 'keyup']) {
				button.addEventListener(type, (event) => {
					if (event.key === ' ' || event.key === 'Enter')
						event.stopPropagation();
				});
			}
			button.addEventListener('click', () => {
				collapsed = !collapsed;
				render();
				chrome.storage.sync.set({sidebarCollapsed: collapsed});
			});
			header.prepend(button);
		}
		if (button) {
			button.hidden = !active;
			button.textContent = collapsed ? 'Show sidebar' : 'Hide sidebar';
			button.setAttribute('aria-expanded', String(!collapsed));
			button.title = collapsed
				? 'Show left sidebar and chat'
				: 'Hide left sidebar and chat';
		}
		if (active && collapsed && main.contains(document.activeElement)) {
			const focusedSide = document.activeElement.closest(
				'.analyse__side, .round__side, .round__underchat, .mchat, .chat__members'
			);
			if (focusedSide) button.focus();
		}
		root.classList.toggle('pl-sidebar-collapsed', active && collapsed);
		if (!enabled && button) {
			button.remove();
			button = undefined;
		}
	}

	function ready() {
		chrome.storage.sync.get(
			['collapsibleSidebar', 'sidebarCollapsed'],
			(result) => {
				enabled = result.collapsibleSidebar === true;
				collapsed = result.sidebarCollapsed === true;
				render();
			}
		);
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area !== 'sync') return;
			if ('collapsibleSidebar' in changes)
				enabled = changes.collapsibleSidebar.newValue === true;
			if ('sidebarCollapsed' in changes)
				collapsed = changes.sidebarCollapsed.newValue === true;
			if (
				'collapsibleSidebar' in changes ||
				'sidebarCollapsed' in changes
			)
				render();
		});
		window.addEventListener('resize', render);
		window.addEventListener('pageshow', render);
	}

	if (document.readyState === 'complete') ready();
	else window.addEventListener('load', ready, {once: true});
})();
