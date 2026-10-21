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
	it('Opens navigation menus added after page load', () => {
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
