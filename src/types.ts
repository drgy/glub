export interface Library {
	category: string;
	repo: string;
	owner: string;
	url: string;
	versions: VersionData;
}

export interface VersionData {
	[ tag: string ]: {
		cmakeImplementation: {
			[ name: string ]: string
		};
		cppImplementation: {
			[ name: string ]: string
		};
		srcFiles: {
			[ file: string ]: string;
		};
	}
}

export interface Categories {
	[ category: string ]: {
		[ library: string ]: {
			versions: string[];
			url: string;
		};
	}
}

export interface LibraryMap {
	[ library: string ]: Library;
}

export interface CmakePayload {
	name: string;
	version: string;
	description: string;
	resPath: string;
	srcPath: string;
	libraries: CmakeLibrary[];
}

export interface CppPayload {
	name: string;
	srcPath: string;
	libraries: CmakeLibrary[];
}

export interface CmakeLibrary {
	name: string;
	version: string;
}
