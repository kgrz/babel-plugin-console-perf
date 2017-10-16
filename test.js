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
	
});


