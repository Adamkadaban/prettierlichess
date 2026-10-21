describe('Optional desktop sidebar', () => {
	let settings;
	let changeSettings;

	function startSidebar(values = {}) {
		settings = {...values};
		cy.readFile('src/sidebar.js').then((source) => {
			cy.window().then((win) => {
				let onChanged;
				changeSettings = (changes) => {
					Object.assign(settings, changes);
					onChanged(
						Object.fromEntries(
							Object.entries(changes).map(([key, newValue]) => [
								key,
								{newValue},
							])
						),
						'sync'
					);
				};
				// Exercise the content script without changing extension storage.
				win.Function(
					'chrome',
					source
				)({
					storage: {
						sync: {
							get: (_, callback) => callback(settings),
							set: (values) => changeSettings(values),
						},
						onChanged: {
							addListener: (callback) => (onChanged = callback),
						},
					},
				});
			});
		});
	}

	beforeEach(() => {
		cy.viewport(1600, 1000);
		cy.visit('https://lichess.org/analysis');
		cy.window().its('site.analysis').should('exist');
	});

	it('Leaves the default layout untouched and restores it after toggling', () => {
		let columns;
		let side;
		cy.get('main.analyse').then(($main) => {
			columns = $main.css('grid-template-columns');
		});
		cy.get('.analyse__side').then(($side) => {
			side = $side[0];
		});
		startSidebar();
		cy.get('.pl-sidebar-toggle').should('not.exist');
		cy.get('html').should('not.have.attr', 'data-pl-sidebar-collapsed');
		cy.then(() => changeSettings({collapsibleSidebar: true}));
		cy.get('.pl-sidebar-toggle')
			.should('have.attr', 'aria-expanded', 'true')
			.click()
			.should('have.attr', 'aria-expanded', 'false')
			.should('have.text', 'Show sidebar');
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.analyse__board, .analyse__controls, .analyse__tools').should(
			'be.visible'
		);
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(true));
		cy.get('.pl-sidebar-toggle').click();
		cy.get('.analyse__side')
			.should('be.visible')
			.then(($side) => expect($side[0]).to.equal(side));
		cy.get('main.analyse').should(($main) => {
			expect($main.css('grid-template-columns')).to.equal(columns);
		});
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(false));
	});

	it('Restores stacked layouts without overwriting the desktop choice', () => {
		startSidebar({
			collapsibleSidebar: true,
			sidebarCollapsed: true,
		});
		cy.get('.analyse__side').should('not.be.visible');
		cy.viewport(1000, 900);
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.be.visible');
		cy.viewport(390, 844);
		cy.get('.analyse__side').should('be.visible');
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(true));
		cy.viewport(1600, 1000);
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').should('be.visible');
		cy.then(() => changeSettings({collapsibleSidebar: false}));
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.exist');
		cy.then(() => changeSettings({collapsibleSidebar: true}));
		cy.get('.analyse__side').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').should('be.visible');
	});

	it('Keeps the saved collapse through reload and native class reconstruction', () => {
		cy.visit('https://lichess.org/analysis/pgn/1.e4_e5_2.Nf3_Nc6_3.Bb5_a6');
		cy.window().its('site.analysis').should('exist');
		startSidebar({collapsibleSidebar: true});
		cy.get('.pl-sidebar-toggle').click();
		cy.get('.analyse__side').should('not.be.visible');
		cy.then(() => expect(settings.sidebarCollapsed).to.equal(true));
		cy.reload();
		cy.window().its('site.analysis').should('exist');
		let nativeRootClasses;
		let side;
		cy.document().then((doc) => {
			nativeRootClasses = doc.documentElement.className;
			side = doc.querySelector('.analyse__side');
		});
		// Reuse the saved mock settings in the new page, not extension storage.
		cy.then(() => startSidebar(settings));
		cy.get('.analyse__side').should('not.be.visible');
		cy.document().then((doc) => {
			doc.querySelector('main.analyse').className =
				'analyse variant-standard analyse--wiki';
			doc.documentElement.className = nativeRootClasses;
		});
		cy.get('.pl-sidebar-toggle')
			.should('have.text', 'Show sidebar')
			.should('have.attr', 'aria-expanded', 'false');
		cy.get('.analyse__side')
			.should('not.be.visible')
			.then(($side) => expect($side[0]).to.equal(side));
		cy.get('html').should('have.attr', 'data-pl-sidebar-collapsed');
		cy.then(() => changeSettings({collapsibleSidebar: false}));
		cy.get('html').should('not.have.attr', 'data-pl-sidebar-collapsed');
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.exist');
	});

	it('Preserves focus when another page collapses a focused sidebar', () => {
		startSidebar({collapsibleSidebar: true});
		cy.get('.analyse__side a').first().focus();
		cy.then(() => changeSettings({sidebarCollapsed: true}));
		cy.get('.pl-sidebar-toggle').should('be.focused');
		cy.get('.analyse__side').should('not.be.visible');
		cy.then(() =>
			changeSettings({
				collapsibleSidebar: undefined,
				sidebarCollapsed: undefined,
			})
		);
		cy.get('.analyse__side').should('be.visible');
		cy.get('.pl-sidebar-toggle').should('not.exist');
	});

	it('Isolates activation keys from document shortcuts without cancelling defaults', () => {
		startSidebar({collapsibleSidebar: true});
		cy.get('.pl-sidebar-toggle').then(($button) => {
			const button = $button[0];
			const KeyboardEvent =
				button.ownerDocument.defaultView.KeyboardEvent;
			// Use a separate document so a regression cannot run live engine shortcuts.
			const doc =
				button.ownerDocument.implementation.createHTMLDocument();
			doc.body.append(button);
			const shortcuts = [];
			const phases = ['keydown', 'keypress', 'keyup'];
			for (const type of phases) {
				doc.addEventListener(type, (event) => {
					shortcuts.push(event.key);
					if (event.key === ' ' || event.key === 'Enter')
						event.preventDefault();
				});
			}
			for (const key of [' ', 'Enter']) {
				for (const type of phases) {
					const event = new KeyboardEvent(type, {
						key,
						bubbles: true,
						cancelable: true,
					});
					expect(button.dispatchEvent(event)).to.equal(true);
					expect(event.defaultPrevented).to.equal(false);
				}
			}
			expect(shortcuts).to.deep.equal([]);
			expect(button.getAttribute('aria-expanded')).to.equal('true');

			for (const type of phases) {
				button.dispatchEvent(
					new KeyboardEvent(type, {key: 'Tab', bubbles: true})
				);
			}
			expect(shortcuts).to.deep.equal(['Tab', 'Tab', 'Tab']);

			shortcuts.length = 0;
			const otherButton = doc.createElement('button');
			doc.body.append(otherButton);
			for (const key of [' ', 'Enter']) {
				for (const type of phases) {
					const event = new KeyboardEvent(type, {
						key,
						bubbles: true,
						cancelable: true,
					});
					expect(otherButton.dispatchEvent(event)).to.equal(false);
				}
			}
			expect(shortcuts).to.deep.equal([
				' ',
				' ',
				' ',
				'Enter',
				'Enter',
				'Enter',
			]);
		});
	});

	it('Keeps nested study chapters and chat intact while hidden', () => {
		cy.get('.analyse__side').then(($side) => {
			$side.append(
				'<div class="study__side" id="sidebar-study-fixture">' +
					'<div class="study__chapters"><button>Chapter one</button></div>' +
					'<div class="mchat"><input aria-label="Chat draft" value="Unsent message"></div>' +
					'</div>'
			);
		});
		startSidebar({collapsibleSidebar: true});
		cy.get('.pl-sidebar-toggle').click();
		cy.get('#sidebar-study-fixture').should('not.be.visible');
		cy.get('.pl-sidebar-toggle').click();
		cy.get('#sidebar-study-fixture .study__chapters').should('be.visible');
		cy.get('#sidebar-study-fixture input')
			.should('be.visible')
			.should('have.value', 'Unsent message');
	});

	it('Leaves game controls and the vertical layout button available', () => {
		cy.visit('https://lichess.org/tv');
		cy.get('.round__app').should('be.visible');
		startSidebar({
			collapsibleSidebar: true,
			sidebarCollapsed: true,
		});
		cy.get('.round__side').should('not.be.visible');
		cy.get('.round__app, .rcontrols, .streamerButton').should('be.visible');
		cy.get('.pl-sidebar-toggle').click();
		cy.get('.round__side').should('be.visible');
	});
});

describe('Test whole extension', () => {
	beforeEach(() => {
		cy.visit('https://lichess.org');
		// Send extension message to clear synced storage
		window.postMessage({type: 'cypress', command: 'sync.clear'}, '*');
		cy.reload();
		cy.on('uncaught:exception', (err, runnable) => {
			return false;
		});
	});

	it('Test injection', () => {
		cy.get('body').should(
			'have.css',
			'background-color',
			'rgb(39, 42, 44)'
		);
	});
	it('Test destination hit testing while dragging', () => {
		cy.visit(
			'https://lichess.org/analysis/standard/4k3/8/8/3p4/4P3/8/8/4K3_w_-_-_0_1'
		);
		cy.window().its('lichess.chessground').should('be.a', 'function');
		cy.window().then((win) => {
			const ground = win.lichess.chessground();
			const board = ground.state.dom.elements.board;
			const bounds = board.getBoundingClientRect();
			const from = {
				clientX: bounds.left + (bounds.width * 4.5) / 8,
				clientY: bounds.top + (bounds.height * 4.5) / 8,
			};
			const trustAllEvents = ground.state.trustAllEvents;
			ground.state.trustAllEvents = true;
			board.dispatchEvent(
				new win.MouseEvent('mousedown', {
					bubbles: true,
					buttons: 1,
					...from,
				})
			);
			ground.state.trustAllEvents = trustAllEvents;

			for (const file of [4.5, 3.5]) {
				const to = {
					clientX: bounds.left + (bounds.width * file) / 8,
					clientY: bounds.top + (bounds.height * 3.5) / 8,
				};
				cy.document().trigger('mousemove', {buttons: 1, ...to});
				cy.get('.main-board cg-board').should(() => {
					expect(ground.state.draggable.current.started).to.be.true;
					const destination = win.document.elementFromPoint(
						to.clientX,
						to.clientY
					);
					expect(destination.tagName).to.equal('SQUARE');
					expect(destination.classList.contains('move-dest')).to.be
						.true;
					expect(destination.classList.contains('oc')).to.equal(
						file === 3.5
					);
					expect(win.getComputedStyle(destination).cursor).to.equal(
						'grabbing'
					);
				});
			}
			cy.then(() => ground.cancelMove());
		});
	});
	it('Opens navigation menus added after page load', () => {
		cy.viewport(1280, 800);
		cy.document().then((doc) => {
			const section = doc.createElement('section');
			section.id = 'prettier-test-menu';
			section.innerHTML =
				'<a href="#menu">Extra menu</a> \n' +
				'<div role="group"><a href="/analysis">Analysis</a></div>';
			doc.querySelector('#topnav').appendChild(section);
		});
		cy.get('#prettier-test-menu > a').focus();
		cy.get('#prettier-test-menu > div')
			.should('be.visible')
			.should('have.css', 'opacity', '1');
		cy.get('#prettier-test-menu > div > a').focus();
		cy.get('#prettier-test-menu > div').should('be.visible');
		cy.get('#prettier-test-menu > div > a').blur();
		cy.get('#prettier-test-menu > div').should('have.css', 'opacity', '0');
	});
	it('Test vertical layout button', () => {
		cy.visit('https://lichess.org/tv');
		cy.get('.ruser.ruser-top')
			.first()
			.should('not.have.css', 'padding', '0px');
		cy.get('.button.streamerButton')
			.should('exist')
			.should('contain.text', 'Enable Vertical Layout')
			.click();
		cy.get('.ruser.ruser-top').first().should('have.css', 'padding', '0px');
		cy.get('.button.streamerButton')
			.should('exist')
			.should('contain.text', 'Disable Vertical Layout')
			.click();
	});

	[390, 768, 1000].forEach((width) => {
		it(`Test mobile navigation scrolling at ${width}px`, () => {
			cy.viewport(width, 600);
			cy.get('#topnav').should(($nav) => {
				expect($nav[0].getBoundingClientRect().right).to.be.at.most(1);
			});
			cy.get('.hbg').click();
			cy.get('.topnav-toggle').should('be.checked');
			cy.get('#topnav')
				.should(($nav) => {
					const nav = $nav[0];
					const bounds = nav.getBoundingClientRect();
					const header = nav.ownerDocument.getElementById('top');
					expect(bounds.top).to.be.closeTo(
						header.getBoundingClientRect().bottom,
						1
					);
					expect(bounds.left).to.be.closeTo(0, 1);
					expect(bounds.bottom).to.be.at.most(600);
					expect(nav.scrollHeight).to.be.greaterThan(
						nav.clientHeight
					);
				})
				.scrollTo('bottom')
				.should(($nav) => {
					expect($nav[0].scrollTop).to.be.greaterThan(0);
				});
			cy.get('#topnav section:last-child div a')
				.last()
				.should('be.visible')
				.should(($link) => {
					const link = $link[0];
					const nav = link.closest('#topnav').getBoundingClientRect();
					const bounds = link.getBoundingClientRect();
					expect(bounds.top).to.be.at.least(nav.top);
					expect(bounds.bottom).to.be.at.most(nav.bottom);
				});
			cy.get('.hbg').click();
			cy.get('.topnav-toggle').should('not.be.checked');
			cy.get('#topnav').should(($nav) => {
				expect($nav[0].getBoundingClientRect().right).to.be.at.most(1);
			});
		});
	});

	it('Test desktop navigation above the mobile breakpoint', () => {
		cy.viewport(1020, 600);
		cy.get('.hbg').should('not.be.visible');
		cy.get('#topnav')
			.should('be.visible')
			.and('have.css', 'position', 'absolute')
			.and('have.css', 'transform', 'none');
	});

	it('Shows both sides of the evaluation gauge', () => {
		cy.visit('https://lichess.org/analysis');
		cy.window().its('site.analysis').should('exist');
		cy.window().then((win) => {
			win.site.analysis.node.eval = {cp: 400};
			win.site.analysis.redraw();
		});
		cy.get('.eval-gauge').should(($gauge) => {
			const background = $gauge.css('background-image');
			expect(background).to.include('rgb(26, 26, 26)');
			expect(background).to.include('rgb(225, 225, 225)');
		});
		cy.get('.eval-gauge').then(($gauge) => {
			for (const percent of [0, 25, 50, 75, 100]) {
				$gauge.css({
					transition: 'none',
					'--eval-percent': `${percent}%`,
				});
				expect($gauge.css('background-image')).to.include(
					`rgb(26, 26, 26) ${percent}%`
				);
				expect($gauge.css('background-image')).to.include(
					`rgb(225, 225, 225) ${percent}%`
				);
			}
		});
	});
});
