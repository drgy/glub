import { Categories } from "../types.ts";

const libraries: Categories = {};

export function refresh() {
	for (const [ name, library ] of Object.entries(window.libraries || {})) {
		libraries[library.category] ??= {};
		libraries[library.category][name] = {
			versions: Object.keys(library.versions),
			url: library.url
		};
	}
}

export function getLibraries({ response }: { response: any }) {
	response.body = libraries;
	return response;
}
