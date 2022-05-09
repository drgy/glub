const https = require('https');
const fs = require('fs');
const url = require('url');

const glubApiUrl = 'https://glub.deno.dev';
const libraries = JSON.parse(process.argv[2]);
const reqData = JSON.stringify({
	name: "glub",
	version: "1.0.0",
	description: "library test",
	resPath: "res/",
	srcPath: "src/",
	libraries
});

fs.mkdirSync('project');
fs.mkdirSync('project/src');
fs.mkdirSync('project/build');

const cmakeReq = https.request({
	...url.parse(`${glubApiUrl}/cmake`),
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': reqData.length
	}
}, (cmakeRes) => {
	let cmake = '';

	cmakeRes.on('data', (data) => {
		cmake += data;
	});

	cmakeRes.on('end', () => {
		fs.writeFileSync('project/CMakeLists.txt', cmake);
	});
});

cmakeReq.on('error', error => {
	console.error(error)
})

cmakeReq.write(reqData);
cmakeReq.end();

const cppReq = https.request({
	...url.parse(`${glubApiUrl}/cpp`),
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': reqData.length
	}
}, (cppRes) => {
	let cppData = '';

	cppRes.on('data', (data) => {
		cppData += data;
	});

	cppRes.on('end', () => {
		for (const [file, content] of Object.entries(JSON.parse(cppData))) {
			if (file === 'main') {
				fs.writeFileSync('project/src/main.cpp', content.replace(/\};(?=\s*window\.start\(update\);)/g, '\twindow.close();\n\t};'));
				continue;
			}

			fs.writeFileSync(`project/src/${file}.h`, content);
		}
	});
});

cppReq.on('error', error => {
	console.error(error)
})

cppReq.write(reqData);
cppReq.end();
