/** @type {import("prettier").Config} */
const config = {
	pluginSearchDirs: [__dirname],
	importOrder: ["^node:", "<THIRD_PARTY_MODULES>", "^#root", "^[./]"],
	printWidth: 280,
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: "always",
	trailingComma: "none",
	useTabs: true,
	tabWidth: 4,
	endOfLine: "lf"
};

module.exports = config;
