export function time(): string {
	let now = new Date();

	return `[${now.getHours()}:${now.getMinutes()}.${now.getMilliseconds()} ${('0' + now.getDate()).slice(-2)}.${('0' + now.getMonth()).slice(-2)}.${now.getFullYear().toString().slice(-2)}] `;
}