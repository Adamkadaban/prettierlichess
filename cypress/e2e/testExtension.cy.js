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
	[390, 1280].forEach((width) => {
		it(`Styles current and legacy round markup fixtures at ${width}px`, () => {
			cy.viewport(width, 800);
			cy.document().then((doc) => {
				const fixture = doc.createElement('div');
				fixture.id = 'round-markup-fixture';
				fixture.innerHTML =
					'<rm6><rb1></rb1><l4x><i5z>1</i5z>' +
					'<u8t>e4</u8t><u8t class="a1t">e5</u8t></l4x></rm6>' +
					'<i5d><bo3></bo3><app><qzm>1</qzm>' +
					'<z7yx>e4</z7yx><z7yx class="a1t">e5</z7yx></app></i5d>';
				doc.body.appendChild(fixture);
			});
			cy.get('#round-markup-fixture').should(($fixture) => {
				const fixture = $fixture[0];
				const style = (selector) =>
					fixture.ownerDocument.defaultView.getComputedStyle(
						fixture.querySelector(selector)
					);
				for (const [legacy, current, properties] of [
					[
						'rm6',
						'i5d',
						['backgroundColor', 'border', 'borderRadius'],
					],
					['rb1', 'bo3', ['backgroundColor', 'boxShadow']],
					['l4x', 'app', ['borderLeft', 'flexBasis', 'lineHeight']],
					['i5z', 'qzm', ['backgroundColor', 'color']],
					[
						'u8t.a1t',
						'z7yx.a1t',
						['backgroundColor', 'color', 'boxShadow'],
					],
				]) {
					for (const property of properties) {
						expect(
							style(current)[property],
							`${current} ${property}`
						).to.equal(style(legacy)[property]);
					}
				}
				expect(style('z7yx.a1t').backgroundColor).not.to.equal(
					style('z7yx:not(.a1t)').backgroundColor
				);
				expect(style('z7yx.a1t').boxShadow).not.to.equal('none');
			});
		});
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
