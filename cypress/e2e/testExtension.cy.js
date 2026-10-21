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

	for (const mode of ['column', 'inline']) {
		it(`Focuses ${mode} comments without hiding variations`, () => {
			cy.document().then((doc) => {
				const fixture = doc.createElement('div');
				fixture.id = 'prettier-test-comments';
				fixture.className = 'analyse__moves';
				const whiteComments =
					'<comment class="white-note"><span>White note</span></comment>' +
					'<comment class="white-note"><span>Another author</span></comment>';
				const blackComments =
					'<comment class="black-note"><a href="#note">Black note</a></comment>';
				const variations =
					'<lines><line><move p="v1">d4</move><comment>Variation note</comment>' +
					'<inline><move p="v2">d5</move><comment>Nested note</comment></inline>' +
					'</line><line><move p="v3">c4</move><comment>Second variation</comment></line></lines>';
				fixture.innerHTML =
					mode === 'column'
						? `<div class="tview2 tview2-column">
							<interrupt><comment class="root-note">Starting note</comment></interrupt>
							<index>1</index><move p="w1" class="active"><san>e4</san><glyph>!</glyph></move>
							<move class="empty">...</move><interrupt>${whiteComments}${variations}</interrupt>
							<index>1</index><move class="empty">...</move><move p="b1"><san>e5</san></move>
							<interrupt>${blackComments}</interrupt>
							<index>2</index><move p="w2"><san>Nf3</san></move>
						</div>`
						: `<div class="tview2 tview2-inline">
							<comment class="root-note">Starting note</comment>
							<move p="w1" class="mainline active"><index>1</index>e4<glyph>!</glyph></move>
							${whiteComments}<interrupt>${variations}</interrupt>
							<move p="b1" class="mainline">e5</move>${blackComments}
							<move p="w2" class="mainline"><index>2</index>Nf3</move>
						</div>`;
				doc.body.appendChild(fixture);
			});
			const tree = '#prettier-test-comments';
			cy.get(`${tree} comment`).should('be.visible');
			cy.document().then((doc) =>
				doc.documentElement.setAttribute(
					'data-prettier-focused-comments',
					''
				)
			);
			cy.get(`${tree} .white-note`)
				.should('be.visible')
				.should('have.length', 2);
			cy.get(`${tree} .black-note`).should('not.be.visible');

			cy.get(`${tree} move.active`).invoke('removeClass', 'active');
			cy.get(`${tree} move[p="b1"]`).invoke('addClass', 'active');
			cy.get(`${tree} .white-note`).should('not.be.visible');
			cy.get(`${tree} .black-note`).should('be.visible');
			cy.get(`${tree} .black-note a`).focus();

			cy.get(`${tree} move.active`).invoke('removeClass', 'active');
			cy.get(`${tree} move[p="v2"]`).invoke('addClass', 'active');
			cy.get(`${tree} .black-note`).should('be.visible');
			cy.get(`${tree} .black-note a`).blur();
			cy.get(`${tree} .black-note`).should('not.be.visible');
			cy.get(`${tree} .white-note`).should('not.be.visible');
			cy.get(`${tree} lines comment`)
				.should('be.visible')
				.should('have.length', 3);
			cy.get(`${tree} move[p]`)
				.should('be.visible')
				.should('have.length', 6);
			cy.get(`${tree} glyph`)
				.should('be.visible')
				.should('have.text', '!');
			cy.get(`${tree} .root-note`).should('be.visible');

			cy.get(`${tree} move.active`).invoke('removeClass', 'active');
			cy.get(`${tree} move[p="w2"]`).invoke('addClass', 'active');
			cy.get(`${tree} .white-note`).should('not.be.visible');
			cy.get(`${tree} .black-note`).should('not.be.visible');
			cy.get(`${tree} move.active`).invoke('removeClass', 'active');
			cy.get(`${tree} .white-note`).should('not.be.visible');
			cy.get(`${tree} .root-note`).should('be.visible');
			cy.document().then((doc) =>
				doc.documentElement.removeAttribute(
					'data-prettier-focused-comments'
				)
			);
			cy.get(`${tree} comment`)
				.should('be.visible')
				.should('have.length', 7);
		});
	}
});
