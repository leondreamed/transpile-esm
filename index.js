const fs = require('node:fs');
const { Module } = require('node:module');

const swc = require('@swc/core');
const { isFileEsmSync } = require('is-file-esm-ts');

function createNewLoader(extension) {
	const oldLoader = Module._extensions[extension];

	/**
		We patch the require loader to transpile workspace packages (since they're written in ESM).
	*/
	const newLoader = function (mod, filePath) {
		let isEsm;
		try {
			isEsm = isFileEsmSync(filePath);
		} catch {
			isEsm = false;
		}

		if (isEsm) {
			const code = fs.readFileSync(filePath, 'utf8');
			const transpiledCode = swc.transformSync(code, {
				jsc: {
					parser: {
						syntax: 'typescript',
						tsx: true
					},
					transform: {
						react: {
							runtime: 'automatic'
						}
					}
				},
				module: {
					type: 'commonjs'
				},
				sourceMaps: 'inline'
			});

			mod._compile(transpiledCode.code, filePath);
		} else {
			return oldLoader(mod, filePath);
		}
	};

	Module._extensions[extension] = newLoader;
}

createNewLoader('.js');
createNewLoader('.jsx');
createNewLoader('.mjs');
createNewLoader('.ts');
createNewLoader('.tsx');
