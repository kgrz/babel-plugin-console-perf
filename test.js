const babel = require('babel-core');
const plugin = require('./index');

console.profile = jest.fn();
console.profileEnd = jest.fn();

it('wraps a function in profile block', () => {
	const example = `
	const b = () => {
		// profile
		return 42;
	}

	const a = () => {
		// profile
		return b();
	}
	`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('caters to the case of multiple returns', () => {
	const example = `
	const a = () => {
		// profile
		if (true) {
			return Math.random(12);
		}

		return Math.sqrt(10000000000000000000);
	}`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('does not add profile statement if one is already present', () => {
	const example = `
	const b = () => {
		// profile

		console.profile('some name');
		return 42;
		console.profileEnd();
	}`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('has multiple returns, one of them invalid', () => {
	const example = `
	const b = () => {
		// profile

		return 42;
		return 42;
		return 42;
	}`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});


it('has multiple comments', () => {
	let example = `
	const b = () => {
		// profile
		// profile
		// profile
		// profile
		// profile

		return 42;
	}`;

	let code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();

	example = `
	const b = () => {
		// profile
		//
		// profile
		//
		return 42;
		// profile
		//
		// profile

	}`;

	code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('maintains indentation with nested functions', () => {
	let example = `
	const b = () => {
		const a = () => {
			return Math.sqrt(1000000000000);
		}

		// profile
		return 42;
	}`;

	let code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();

	example = `
	const b = () => {
		const a = () => {
			// profile
			return Math.sqrt(1000000000000);
		}

		// profile
		return a();
	}`;

	code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('maintains indentation when used with iterators', () => {
	const example = `
	const b = () => {
		[1, 3, 5].map(item => {
			return item;
		})

		// profile
		return 42;
	}`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});

it('maintains indentation when for if blocks', () => {
	const example = `
	const b = () => {
		// profile
		
		if (true) {
			return 12;
		}

		switch (true) {
			case 'case1':
				return 'what';
			case 'case 2': {
				return 'where';
			}
			case 'case 3':
				return 'who';
			default:
				return 'default'
		}

		return 42;
	};
	`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});


describe('usage inside classes', () => {
	it('works inside function properties', () => {
		const example = `
		class A {
			changeVisualState (id) {
				// profile
				return item => {
					this.setState({
						newState: {}
					});
					callSomeMethod();
				};
			}
		}
		`;

		const code = babel.transform(example, { plugins: [ plugin ] }).code;
		expect(code).toMatchSnapshot();
	});
});

