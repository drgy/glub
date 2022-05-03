const fs = require('fs');

const compatibility = JSON.parse(fs.readFileSync('data/compatibility.json', 'utf8'));
const libraries = JSON.parse(process.argv[2]);

let hash = '';

fs.readdirSync('data/libraries').sort().forEach(library => {
	let index = libraries.findIndex(o => o.name === library)
	hash += `${index === -1 ? '0' : libraries[index].version}|`;
});

let result;

if (process.argv.length === 3) {
	result = 'incompatible';
} else if (process.argv.length === 4) {
	result = process.argv[3] === 'ubuntu' ? 'linux_compatible' : 'windows_compatible';
} else {
	result = 'compatible';
}

compatibility[hash] = result;

fs.writeFileSync('data/compatibility.json', JSON.stringify(compatibility, null, '\t'));
