import {LibraryMap, VersionData} from "../types.ts";
import { config } from "https://deno.land/std@0.128.0/dotenv/mod.ts";
import { refresh } from "../controllers/libraries.ts";

import * as semver from "https://deno.land/x/semver/mod.ts";

declare global {
	interface Window { libraries: LibraryMap }
}

interface Tag {
	original: string;
	parsed: string
}

async function retrieveTags(name: string, repo: string, owner: string): Promise<Tag[]> {
	try {
		const releases = await (await fetch(`${(await config()).GITHUB_API}/repos/${owner}/${repo}/releases?per_page=100`)).json();
		const tags: Tag[] = [];

		for (const release of releases) {
			let tag = release['tag_name'];
			tag = tag
					.replace(/[^0-9\.]/g, '')
					.replace(/[^0-9]*$/, '')
					.replace(/(?<=^[^0-9]*[0-9]+)\.?$/, '.0')
					.replace(/(?<=^[^0-9]*[0-9]+\.[0-9]+)\.?$/, '.0')
					.replace(/(?<=[0-9]+\.[0-9]+\.[0-9]+)(\.[0-9]+)*/, '');

			if (semver.clean(tag)) {
				tags.push({ original: release['tag_name'], parsed: semver.clean(tag)! });
			}
		}

		tags.sort((a, b) => {
			return semver.compare(b.parsed, a.parsed);
		});

		const result: Tag[] = [];

		for (const tag of tags) {
			if (result.length === 0) {
				result.push(tag);
				continue;
			}

			const diff = semver.diff(result[result.length - 1].parsed, tag.parsed);

			if (diff === 'major' || diff === 'minor') {
				result.push(tag);
			}
		}

		console.log(`${releases.length} releases found for ${name}, reduced to ${result.length} different versions`);

		return result;
	} catch (e) {
		console.warn(`Unable to retrieve releases for ${name}: ${e}`);
	}

	return [];
}

async function populateImplementations(name: string, tags: Tag[]) {
	const implementations: VersionData = {};
	const implementationVersions: Deno.DirEntry[] = [];

	for await (const dirent of Deno.readDir(`data/libraries/${name}`)) {
		if (dirent.isDirectory) {
			implementationVersions.push(dirent);
		}
	}

	implementationVersions.sort((a, b) => semver.compare(b.name, a.name));

	await Promise.all(implementationVersions.map(async (implementation) => {
		const cmakeImplementation: { [ fragment: string ]: string } = {};
		const cppImplementation: { [ fragment: string ]: string } = {};
		const srcFiles: { [ file: string ]: string } = {};
		const cmakeFragments: Deno.DirEntry[] = [];
		const cppFragments: Deno.DirEntry[] = [];
		const srcFileNames: Deno.DirEntry[] = [];

		for await (const dirent of Deno.readDir(`data/libraries/${name}/${implementation.name}`)) {
			if (dirent.isFile) {
				if (dirent.name.endsWith('.txt')) {
					cmakeFragments.push(dirent);
				}

				if (dirent.name.endsWith('.cpp')) {
					cppFragments.push(dirent);
				}

				if (dirent.name.endsWith('.h')) {
					srcFileNames.push(dirent);
				}
			}
		}

		await Promise.all(cmakeFragments.map(async (fragment) => {
			const fragName = fragment.name.replace(/\.txt$/, '');
			cmakeImplementation[fragName] = await Deno.readTextFile(`data/libraries/${name}/${implementation.name}/${fragment.name}`);
		}));

		await Promise.all(cppFragments.map(async (fragment) => {
			const fragName = fragment.name.replace(/\.cpp$/, '');
			cppImplementation[fragName] = await Deno.readTextFile(`data/libraries/${name}/${implementation.name}/${fragment.name}`);
		}));

		await Promise.all(srcFileNames.map(async (file) => {
			const fileName = file.name.replace(/\.h$/, '');
			srcFiles[fileName] = await Deno.readTextFile(`data/libraries/${name}/${implementation.name}/${file.name}`);
		}));

		implementations[implementation.name] = {
			cmakeImplementation,
			cppImplementation,
			srcFiles
		};
	}));

	let currentIndex = 0;

	if (!tags.length) {
		window.libraries[name].versions['0.0.0'] = { ...implementations['0.0.0'] };
	}

	tags.forEach(tag => {
		let versionName = implementationVersions[currentIndex].name;

		if (currentIndex + 1 < Object.keys(implementations).length) {
			if (semver.lt(tag.parsed, versionName)) {
				currentIndex++;
				versionName = implementationVersions[currentIndex].name;
			}
		}

		window.libraries[name].versions[tag.original] = { ...implementations[versionName] };
	});
}

export async function loadLibraries() {
	window.libraries = {};

	for await (const dirent of Deno.readDir('data/libraries')) {
		const meta = JSON.parse(await Deno.readTextFile(`data/libraries/${dirent.name}/meta.json`));
		const tags = await retrieveTags(dirent.name, meta.repo, meta.owner);

		window.libraries[dirent.name] = { ...meta, versions: {}};

		await populateImplementations(dirent.name, tags);
	}

	refresh();

	console.log(`Loaded ${Object.keys(window.libraries).length} libraries`);
}
