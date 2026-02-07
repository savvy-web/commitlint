import { NodeLibraryBuilder } from "@savvy-web/rslib-builder";

export default NodeLibraryBuilder.create({
	externals: [
		// Externalize peer dependencies
		"@commitlint/cli",
		"@commitlint/config-conventional",
		"@commitlint/cz-commitlint",
		"@commitlint/types",
		"@commitlint/lint",
	],
	dtsBundledPackages: ["@commitlint/types"],
	transform({ pkg }) {
		delete pkg.devDependencies;
		delete pkg.bundleDependencies;
		delete pkg.publishConfig;
		delete pkg.devEngines;
		delete pkg.config;
		pkg.scripts = {
			postinstall: "savvy-commit check --quiet || true",
		};
		return pkg;
	},
});
