import { config } from "https://deno.land/std@0.128.0/dotenv/mod.ts";
import {CmakePayload} from "../types.ts";

const cmakeTemplate = await Deno.readTextFile('data/CMakeLists.txt');
const defFragments: { [ name: string ]: string } = {};

for await (const dirent of Deno.readDir('data/default')) {
	if (!dirent.name.endsWith('.txt')) {
		continue;
	}

	defFragments[dirent.name.replace(/\.txt$/, '')] = await Deno.readTextFile(`data/default/${dirent.name}`);
}

const generated = {
	libPaths: (payload: CmakePayload): string => {
		let result = '';

		for (const lib of payload.libraries) {
			result += `lib/${lib.name};`
		}

		return result;
	},
	libRepos: async (payload: CmakePayload): Promise<string> => {
		const githubURL = (await config()).GITHUB_URL;
		let result = '';

		for (const lib of payload.libraries) {
			const library = window.libraries[lib.name];
			result += `${githubURL}/${library.owner}/${library.repo}.git;`;
		}

		return result;
	},
	libReleases: (payload: CmakePayload): string => {
		let result = '';

		for (const lib of payload.libraries) {
			result += `${lib.version === '0.0.0' ? 'master' : lib.version};`;
		}

		return result;
	},
	linkLibs: (payload: CmakePayload): string => {
		let result = '';

		for (const lib of payload.libraries) {
			const customImpl = window.libraries[lib.name].versions[lib.version].cmakeImplementation.linkLib;

			if (customImpl) {
				result += `${customImpl}\n`;
			} else {
				result += `target_link_libraries(${payload.name} ${lib.name})\n`;
			}
		}

		return result;
	},
	definitions: (payload: CmakePayload): string => {
		let cmakeDefs = '';
		let compileDefs = '';

		for (const lib of payload.libraries) {
			cmakeDefs += `set(LIB_${lib.name.toUpperCase()} ON)\n`;
			compileDefs += `add_compile_definitions(LIB_${lib.name.toUpperCase()})\n`;
		}

		return `${cmakeDefs}\n${compileDefs}`;
	}
}

export async function getCmake({ request, response }: { request: any, response: any })  {
	const payload: CmakePayload = await request.body().value;
	let cmake = cmakeTemplate;
	let keyword: string;

	if (!payload.srcPath.endsWith('/')) {
		payload.srcPath += '/';
	}

	if (!payload.resPath.endsWith('/')) {
		payload.resPath += '/';
	}

	while (cmake.match(/(?<=#\[\[)[^\]]+(?=\]\])/)) {
		keyword = cmake.match(/(?<=#\[\[)[^\]]+(?=\]\])/)![0];

		if (payload[keyword as keyof typeof payload]) {
			cmake = cmake.replaceAll(`#[[${keyword}]]`, payload[keyword as keyof typeof payload] as string);
			continue;
		}

		if (defFragments[keyword as keyof typeof defFragments]) {
			cmake = cmake.replaceAll(`#[[${keyword}]]`, (payload.libraries.length ? defFragments[keyword] : defFragments[`${keyword}_raw`]) || '')
		}

		if (generated[keyword as keyof typeof generated]) {
			cmake = cmake.replaceAll(`#[[${keyword}]]`, await generated[keyword as keyof typeof generated](payload));
		}

		let cmakeData = '';

		for (const library of payload.libraries) {
			const implementation = window.libraries[library.name].versions[library.version].cmakeImplementation[keyword];

			if (implementation) {
				cmakeData += implementation;
			}
		}

		cmake = cmake.replaceAll(`#[[${keyword}]]`, cmakeData);
	}

	cmake = cmake.replace(/\n\s*\n\s*\n/g, '\n\n');

	response.body = cmake;
	return response;
}
