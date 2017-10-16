const t = require('babel-types');

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

					if (cNode.type === 'CommentLine' && (cNode.value || '').indexOf('profile') > -1) {
						args.state.gotProfileComment = true;
						args.state.path = path;
						return;
					}
				}
				
			}
		}
	}
}


const generateProfileStart = functionLabel =>
		t.expressionStatement(
				t.callExpression(
						t.memberExpression(t.identifier('console'), t.identifier('profile')),
						[ t.stringLiteral(functionLabel) ]
				)
		);

const generateProfileEnd = () =>
		t.expressionStatement(
				t.callExpression(
						t.memberExpression(t.identifier('console'), t.identifier('profileEnd')),
						[]
				)
		);

const ReturnVisitor = {
	ReturnStatement: function (path, args) {
		if (args.state.gotProfileComment) {
			path.insertBefore(generateProfileEnd());
		}
		args.state.gotReturn = true;
	}
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
					gotReturn: false
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
