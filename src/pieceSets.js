const pieceSets = (() => {
	const key = 'pieceSet';
	const roles = {
		K: 'king',
		Q: 'queen',
		R: 'rook',
		B: 'bishop',
		N: 'knight',
		P: 'pawn',
	};
	const names = ['w', 'b'].flatMap((color) =>
		Object.keys(roles).map((role) => color + role)
	);
	const maxBytes = 128 * 1024;
	const maxDataLength = Math.ceil(maxBytes / 3) * 4 + 22;
	const empty = () => ({version: 1, selection: 'native', uploaded: null});

	function pngSize(bytes) {
		const header = [
			137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
		];
		if (
			bytes.length < 24 ||
			!header.every((value, index) => bytes[index] === value)
		) {
			throw new Error(
				'Only PNG images are supported (not SVG or renamed files).'
			);
		}
		const view = new DataView(
			bytes.buffer,
			bytes.byteOffset,
			bytes.byteLength
		);
		const width = view.getUint32(16);
		const height = view.getUint32(20);
		if (width !== height || width < 16 || width > 512) {
			throw new Error(
				'Each PNG must be square, from 16 × 16 to 512 × 512 pixels.'
			);
		}
		return width;
	}

	function valid(state) {
		if (
			!state ||
			state.version !== 1 ||
			!['native', 'uploaded', 'eyes'].includes(state.selection) ||
			(state.selection === 'uploaded' && !state.uploaded)
		) {
			return false;
		}
		if (state.uploaded === null) return true;
		if (
			!state.uploaded ||
			Object.keys(state.uploaded).length !== names.length
		) {
			return false;
		}
		return names.every((name) => {
			const data = state.uploaded[name];
			if (
				typeof data !== 'string' ||
				data.length > maxDataLength ||
				!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data)
			) {
				return false;
			}
			try {
				pngSize(
					Uint8Array.from(atob(data.slice(22, 54)), (c) =>
						c.charCodeAt(0)
					)
				);
				return true;
			} catch {
				return false;
			}
		});
	}

	function images(state, getURL) {
		if (state.selection !== 'eyes') return state.uploaded;
		return Object.fromEntries(
			names.map((name) => [
				name,
				getURL(`pieces/eyes/${name.toLowerCase()}.svg`),
			])
		);
	}

	function styles(state, getURL) {
		if (!valid(state) || state.selection === 'native') return '';
		const urls = images(state, getURL);
		return names
			.map((name) => {
				const color = name[0] === 'w' ? 'white' : 'black';
				return `body.is2d piece.${color}.${roles[name[1]]} {
	background-image: url("${urls[name]}") !important;
}`;
			})
			.join('\n');
	}

	function readFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(new Uint8Array(reader.result));
			reader.onerror = reader.onabort = () =>
				reject(
					new Error(`Could not read ${file.name}. Please try again.`)
				);
			reader.readAsArrayBuffer(file);
		});
	}

	async function importFiles(files) {
		const selected = Array.from(files);
		if (selected.length !== names.length) {
			throw new Error(
				'Choose all 12 PNG files together, one for each piece.'
			);
		}
		const found = new Set();
		for (const file of selected) {
			const name = file.name.replace(/\.png$/i, '');
			if (
				!/\.png$/i.test(file.name) ||
				!names.includes(name) ||
				found.has(name)
			) {
				throw new Error(
					'Use each documented filename exactly once (for example, wK.png).'
				);
			}
			if (!file.size || file.size > maxBytes) {
				throw new Error(
					`${file.name} must be nonempty and no larger than 128 KiB.`
				);
			}
			found.add(name);
		}
		const uploaded = {};
		for (const file of selected) {
			const bytes = await readFile(file);
			const size = pngSize(bytes);
			const view = new DataView(bytes.buffer);
			for (let offset = 8; offset + 12 <= bytes.length; ) {
				const length = view.getUint32(offset);
				if (offset + length + 12 > bytes.length) {
					throw new Error(`Invalid PNG data in ${file.name}.`);
				}
				if (view.getUint32(offset + 4) === 0x6163544c) {
					throw new Error(
						'Animated PNGs are not supported. Export static PNGs instead.'
					);
				}
				offset += length + 12;
			}
			const url = URL.createObjectURL(
				new Blob([bytes], {type: 'image/png'})
			);
			try {
				const image = await new Promise((resolve, reject) => {
					const image = new Image();
					image.onload = () => resolve(image);
					image.onerror = () =>
						reject(new Error(`Could not decode ${file.name}.`));
					image.src = url;
				});
				if (
					image.naturalWidth !== size ||
					image.naturalHeight !== size
				) {
					throw new Error(`Invalid PNG dimensions in ${file.name}.`);
				}
				const canvas = document.createElement('canvas');
				canvas.width = canvas.height = size;
				const context = canvas.getContext('2d');
				if (!context)
					throw new Error('This browser cannot process PNG images.');
				context.drawImage(image, 0, 0);
				const data = canvas.toDataURL('image/png');
				if (data.length > maxDataLength) {
					throw new Error(
						`${file.name} is too large after decoding. Try a smaller image.`
					);
				}
				uploaded[file.name.replace(/\.png$/i, '')] = data;
			} finally {
				URL.revokeObjectURL(url);
			}
		}
		const state = {...empty(), uploaded};
		if (!valid(state)) throw new Error('Could not prepare the PNG images.');
		return state;
	}

	return {key, names, empty, valid, images, styles, importFiles};
})();
