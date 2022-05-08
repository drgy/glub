const https = require('https');
const fs = require('fs');
const url = require('url');

const githubApi = 'https://api.github.com';
const compatibility = JSON.parse(fs.readFileSync('data/compatibility.json', 'utf8'));
const libraries = fs.readdirSync('data/libraries').sort();
const output = [];
let done = false;

for (let i = 0; i < libraries.length; i++) {
	const metadata = JSON.parse(fs.readFileSync(`data/libraries/${libraries[i]}/meta.json`, 'utf8'));
	const releaseRequest = https.request({
		...url.parse(`${githubApi}/repos/${metadata.owner}/${metadata.repo}/releases/latest`),
		method: 'GET',
		headers: {
			'User-Agent': 'glub-tests'
		}
	}, res => {
		let release = '';

		res.on('data', data => {
			release += data;
		});

		res.on('end', () => {
			let latestRelease = JSON.parse(release);

			if (latestRelease['tag_name']) {
				latestRelease = latestRelease['tag_name']
						.replace(/[^0-9\.]/g, '')
						.replace(/[^0-9]*$/, '')
						.replace(/(?<=^[^0-9]*[0-9]+)\.?$/, '.0')
						.replace(/(?<=^[^0-9]*[0-9]+\.[0-9]+)\.?$/, '.0')
						.replace(/(?<=[0-9]+\.[0-9]+\.[0-9]+)(\.[0-9]+)*/, '');
			} else {
				latestRelease = '0.0.0';
			}

			if (latestRelease === '0.0.0' || !Object.keys(compatibility).some(hash => hash.match(new RegExp(`^(0\\|){${i}}${latestRelease.replace(/\./g, '\\.')}\\|(0\\|)*$`)))) {
				output.push(JSON.stringify({ name: libraries[i], version: latestRelease }));
			}

			if (i === libraries.length - 1) {
				done = true;
			}
		});
	});

	releaseRequest.end()
}

function printOutput() {
	if (!done) {
		setTimeout(printOutput, 100);
	} else {
		console.log(JSON.stringify({ libraries: output }));
	}
}

printOutput();
