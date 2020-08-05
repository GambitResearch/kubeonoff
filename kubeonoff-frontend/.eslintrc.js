module.exports = {
	parser: 'babel-eslint',
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		jest: true
	},
	extends: [
		'react-app'
	],
	parserOptions: {
		exmaVersion: 6,
		sourceType: 'module',
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			jsx: true
		},
		sourceType: 'module'
	},
	rules: {
		// indent: [
		// 	'error',
		// 	'tab',
		// 	{
		// 		SwitchCase: 1,
		// 		ArrayExpression: 1,
		// 		VariableDeclarator: 1,
		// 		CallExpression: {
		// 			arguments: 1
		// 		}
		// 	}
		// ],
		// [ 'no-console' ]: [
		// 	'warn',
		// 	{
		// 		allow: ['warn', 'info', 'debug', 'error']
		// 	}
		// ],
		[ 'no-console' ]: 0,
		[ 'linebreak-style' ]: [
			'error',
			'unix'
		],
		quotes: [
			'error',
			'single'
		],
		semi: [
			'error',
			'never'
		],
		strict: [
			'error',
			'global'
		],
		[ 'comma-dangle' ]: [
			'error',
			'never'
		],
		[ 'no-unused-vars' ]: [
			'error', {
				args: 'none'
			}
		],
		[ 'react/prop-types' ]: [
			0
		]
	}
}
