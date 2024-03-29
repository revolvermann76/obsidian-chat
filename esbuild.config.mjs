import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from 'fs';

const copyPlugin = () => ({
	name: 'copy-plugin',
	setup(build) {
		build.onEnd(async () => {
			const pathIn = "./";
			//const pathOut = "/home/marc/zettelkasten/.obsidian/plugins/obsidian-chat/";
			const pathOut =	"D:/.obsidian/plugins/obsidian-chat/";
			const files = [
				"manifest.json",
				"main.js",
				"styles.css"
			];
			for (let i = 0; i < files.length; i++) {
				try {
					console.log(pathIn + files[i], pathOut + files[i]);
					fs.copyFileSync(pathIn + files[i], pathOut + files[i]);
				} catch (e) {
					console.error('Failed to copy file:', files[i]);
				}
			}
		});
	},
});

const banner =
	`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	plugins: [
		copyPlugin()
	],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}