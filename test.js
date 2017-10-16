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
		return b();
	}
	`;

	const code = babel.transform(example, { plugins: [ plugin ] }).code;
	expect(code).toMatchSnapshot();
});
