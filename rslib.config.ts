import { NodeLibraryBuilder } from "@savvy-web/rslib-builder";

const config: ReturnType<typeof NodeLibraryBuilder.create> = NodeLibraryBuilder.create({
	tsdocLint: true,
	entry: {
		index: "./src/index.ts",
		static: "./src/static.ts",
		"prompt/index": "./src/prompt/index.ts",
		"formatter/index": "./src/formatter/index.ts",
		"bin/cli": "./src/bin/cli.ts",
	},
	externals: [
		// Externalize peer dependencies
		"@commitlint/cli",
		"@commitlint/config-conventional",
		"@commitlint/cz-commitlint",
		"@commitlint/types",
		"@commitlint/lint",
	],
	transform({ pkg }) {
		delete pkg.devDependencies;
		delete pkg.bundleDependencies;
		delete pkg.scripts;
		delete pkg.publishConfig;
		delete pkg.devEngines;
		return pkg;
	},
});

export default config;
