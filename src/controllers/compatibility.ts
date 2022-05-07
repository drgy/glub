import {CmakeLibrary} from "../types.ts";

const compatibility = JSON.parse(await Deno.readTextFile('data/compatibility.json'));

export async function getCompatibility({ request, response }: { request: any, response: any }) {
	const payload: CmakeLibrary[] = await request.body().value;

	let regex = '';

	Object.keys(window.libraries || {}).sort().forEach(library => {
		let index = payload.findIndex(lib => lib.name === library);
		regex += `${index === -1 ? '(0|#)' : `(\\*|${payload[index].version}|#)`}\\|`;
	});

	const config = Object.keys(compatibility).find(config => config.match(new RegExp(regex)));
	response.body = config ? compatibility[config] : 'not_tested';
	return response;
}
