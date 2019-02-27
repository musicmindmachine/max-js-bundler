import { basename, dirname, extname, join } from "path";

import { rollup, RollupBuild, RollupOutput, OutputChunk, OutputAsset } from "rollup";
import nodeResolve from "rollup-plugin-node-resolve";
import babelPlugin from "rollup-plugin-babel";
import commonJSPlugin from "rollup-plugin-commonjs";
import builtinsPlugin from "rollup-plugin-node-builtins";
import globalsPlugin from "rollup-plugin-node-globals";

import { isFile } from "./utils";


export class MaxJSCompiler {

	static banner: string = `
/**
 * This file has been auto-generated using in order to prepare external projects using NPM dependencies etc
 * in the [js] and [jsui] object in Max MSP. Any manual changes might be overwritten when regenerating this
 * file. In case you'd like to learn more, report issues etc - pleaser refer to the Project on GitHub
 *
 * https://github.com/fde31/n4m_transpile_js
 *
 */`;

	readonly filepath: string;
	private bundler: RollupBuild | null = null;

	constructor({
		filepath
	} : {
		filepath: string
	}) {

		this.filepath = filepath;
	}

	get directoy(): string {
		return dirname(this.filepath);
	}

	get filename(): string {
		return basename(this.filepath);
	}

	get extension(): string {
		return extname(this.filename);
	}

	async setup(): Promise<void> {
		// only setup once
		if (this.bundler) return;
		if (!(await isFile(this.filepath))) throw new Error(`File ${this.filepath} does not exist or is not a file.`);

		this.bundler = await rollup({
			input: this.filepath,
			plugins: [
				nodeResolve({
					browser: true
				}),
				commonJSPlugin({
					sourceMap: false
				}),
				builtinsPlugin(),
				globalsPlugin(),
				babelPlugin({
					babelrc: false,
					presets: [
						"@babel/preset-env"
					]
				})
			],
			treeshake: false
		});
	}

	async output(): Promise<string>{

		if (!this.bundler) throw new Error("Compiler has not been setup yet.");

		const { output } : { output: RollupOutput["output"] } = await this.bundler.generate({
			banner: MaxJSCompiler.banner,
			compact: false,
			// exports: "none",
			format: 'iife',
			name: "__c74_gen__",
			strict: false
		});

		if (output.length === 0) throw new Error("No output chunk generated");

		const outputChunk: OutputChunk | OutputAsset | undefined = output.shift();
		return outputChunk && outputChunk.code ? outputChunk.code : "";
	}
}
