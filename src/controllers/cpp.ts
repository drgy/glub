import { CppPayload } from "../types.ts";

const defCppFragments: { [ name: string ]: string } = {};
const defHeaderFiles: { [ name: string ]: string } = {};

for await (const dirent of Deno.readDir('data/default')) {
	if (dirent.name.endsWith('.cpp')) {
		defCppFragments[dirent.name.replace(/\.cpp$/, '')] = await Deno.readTextFile(`data/default/${dirent.name}`);
	}

	if (dirent.name.endsWith('.h')) {
		defHeaderFiles[dirent.name.replace(/\.h$/, '')] = await Deno.readTextFile(`data/default/${dirent.name}`);
	}
}

export async function getCppFiles({ request, response }: { request: any, response: any })  {
	const payload: CppPayload = await request.body().value;
	const srcFiles: { [file: string]: string } = {};
	let keyword: string;

	for (const header of Object.keys(defHeaderFiles)) {
		srcFiles[header] = defHeaderFiles[header];
	}

	for (const library of payload.libraries)  {
		const libSrcFiles = window.libraries[library.name].versions[library.version].srcFiles;

		for (const file of Object.keys(libSrcFiles)) {
			srcFiles[file] = libSrcFiles[file];

			if (srcFiles[file] === '') {
				delete srcFiles[file];
			}
		}
	}

	for (let [ file, content ] of Object.entries(srcFiles)) {
		while (content.match(/(?<=\/\*)[^\/]+(?=\*\/)/)) {
			keyword = content.match(/(?<=\/\*)[^\/]+(?=\*\/)/)![0];

			if (payload[keyword as keyof typeof payload]) {
				content = content.replaceAll(`/*${keyword}*/`, payload[keyword as keyof typeof payload] as string);
				continue;
			}

			if (defCppFragments[keyword as keyof typeof defCppFragments]) {
				content = content.replaceAll(`/*${keyword}*/`, (payload.libraries.length ? defCppFragments[keyword] : defCppFragments[`${keyword}_raw`]) || '');
			}

			let cppData = '';

			for (const library of payload.libraries) {
				const implementation = window.libraries[library.name].versions[library.version].cppImplementation[keyword];

				if (implementation) {
					cppData += implementation;
				}
			}

			content = content.replaceAll(`/*${keyword}*/`, cppData);
		}

		srcFiles[file] = content;
	}

	response.body = {
		...srcFiles
	};

	return response;
}
