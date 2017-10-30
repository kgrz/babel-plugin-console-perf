const t = require('babel-types');

const SPACE_REGEX = /\s+/;

const BlockVisitor = function (path, args) {
	const body = path.node.body || [];

	for (let i = 0, len = body.length; i < len; i++) {
		const node = body[i];

		if (node) {
			const leadingComments = node.leadingComments || [];
			const trailingComments = node.trailingComments || [];

			const allComments = leadingComments.concat(trailingComments);

			if (allComments.length) {
				for (var j = 0, length = allComments.length; j < length; j++) {
					const cNode = allComments[j];

					if (cNode.type === 'CommentLine') {
						const value = (cNode.value || '').replace(SPACE_REGEX, '');

						if (value === 'profile') {
							args.state.gotProfileComment = true;
							args.state.path = path;
						}

						return;
					}
				}
				
			}
		}
	}
}

const generateProfileStart = functionLabel => {
	const args = functionLabel ? [ t.stringLiteral(functionLabel) ] : [];
	return t.expressionStatement(
		t.callExpression(
			t.memberExpression(t.identifier('console'), t.identifier('profile')),
			args
		)
	);
}

const generateProfileEnd = () =>
		t.expressionStatement(
				t.callExpression(
						t.memberExpression(t.identifier('console'), t.identifier('profileEnd')),
						[]
				)
		);

const generateIdentifier = () => t.identifier('_babel_temp_alias');

const assignArgument = (identifier, argument, opts) => {
	if (opts.blockDepth === 1) {
		return t.variableDeclaration(
			'let',
			[
				t.variableDeclarator(
					t.identifier('_babel_temp_alias'),
					argument
				)
			]
		);
	} else {
		return t.expressionStatement(
			t.assignmentExpression(
				"=",
				t.identifier('_babel_temp_alias'),
				argument
			)
		);
	}
}


const SkipVisitor = function (path, args) {
	path.skip();
	return;
}

const ReturnVisitor = {
	ReturnStatement: function (path, args) {
		const argument = path.node.argument;

		args.state.gotReturn = true;
		args.state.blockDepth++;

		if (args.state.gotProfileComment) {
			if (!argument || argument.type === 'Literal' || argument.type === 'NumericLiteral' || argument.type === 'StringLiteral' || argument.type === 'Identifier') {
				// This is the simplest possible case. We don't need to alias anything
				path.insertBefore(generateProfileEnd());

				return;
			} else {
				// assign the argument to some variable
				// add profile end statement
				// set the argument of return to the variable identifier

				const identifier = generateIdentifier();
				const assignment = assignArgument(identifier, argument, {
					blockDepth: args.state.blockDepth
				});
				path.insertBefore(assignment);
				path.insertBefore(generateProfileEnd());
				path.node.argument = identifier;

				return;
			}
		}
	},
	FunctionDeclaration: SkipVisitor,
	ArrowFunctionExpression: SkipVisitor,
	ClassMethod: SkipVisitor,
	FunctionExpression: SkipVisitor
}

const isPathTypeAFunction = p =>
	p.isFunctionDeclaration() ||
	p.isArrowFunctionExpression() ||
	p.isClassMethod() ||
	p.isFunctionExpression();

const getName = path => {
	const fParent = path.findParent(p => isPathTypeAFunction(p));

	let name;

	switch (fParent.type) {
		case 'FunctionDeclaration':
			name = fParent.node.id.name;
			break;
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
			if (fParent.parent.id && fParent.parent.id.name) {
				name = fParent.parent.id.name
			}

			if (fParent.node.id && fParent.node.id.name) {
				name = fParent.node.id.name
			}

			if (fParent.parent.left && fParent.parent.left.property && fParent.parent.left.property.name) {
				name = fParent.parent.left.property.name;
			}
			break;
		case 'ClassMethod':
			name = fParent.node.key.name;
	}

	return name;
}

const ConsoleProfileVisitor = function (babel) {
	return {
		visitor: {
			// ArrowFunctionExpression: FunctionVisitor
			BlockStatement: function (path, args) {
				let state = {
					gotProfileComment: false,
					gotReturn: false,
					blockDepth: 0
				};

				BlockVisitor(path, { state });

				if (state.gotProfileComment) {
					path.unshiftContainer(
						'body',
						generateProfileStart(getName(path))
					);
				}

				path.traverse(ReturnVisitor, { state });

				if (!state.gotReturn) {
					path.pushContainer('body', generateProfileEnd());
				}
			}
		}
	}

}

module.exports = ConsoleProfileVisitor;
