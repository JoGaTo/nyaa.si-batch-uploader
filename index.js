const compression = require('compression');
const express = require('express');
const expressWs = require('express-ws');
const fetch = require('node-fetch');
const FormData = require('form-data');
const log4js = require('log4js');
const multer = require('multer');
const open = require('open');

/*-------------------*/

const FALLBACK_PORT = 5151;
const API_URLS = {
    nyaa: 'https://nyaa.si/api/upload',
    sukebei: 'https://sukebei.nyaa.si/api/upload'
	
};

/*-------------------*/

log4js.configure({
	appenders: [
		{ type: 'console' }
	]
});


global.Promise = fetch.Promise = require('bluebird');
global.Log = log4js.getLogger();

global.Broadcast = function(sessionId, type, message) {
	Log[type](message);
	wss.clients.forEach(client => {
		try { client.send(JSON.stringify({ sessionId, type, message })); }
		catch (e) { }
	});
};

/*-------------------*/

const app = express();
const multipart = multer().fields([
    { name: 'data', maxCount: 1 },
    { name: 'file', maxCount: 5000 }
]);

app.set('port', (process.env.PORT || FALLBACK_PORT));

app.use(compression());
app.use(log4js.connectLogger(Log, { level: log4js.levels.DEBUG }));
app.use(express.static(__dirname + '/www'));

app.post('/proceed', multipart, (req, res) =>
    doMultiUpload(JSON.parse(req.body.data), req.files.file, res)
);

app.post('/shutdown', (req,res) => {
    Broadcast(null, 'info', 'Shutting down.');
    process.exit(0);
});

const wss = expressWs(app).getWss();
app.ws('/ws', (ws, req) => { });

app.listen(app.get('port'), () => {
    Log.info(`Started on port ${app.get('port')}.`);
    if (process.argv.indexOf('--open') !== -1)
        open(`http://localhost:${app.get('port')}`);
});

process.on('uncaughtException', e => {
    if (e.errno === 'EADDRINUSE') {
        open(`http://localhost:${FALLBACK_PORT}`);
        setTimeout(() => process.exit(0), 250);
    } else {
        console.log(e);
        process.exit(0);
    }
});

/*-------------------*/

function doMultiUpload(data, files, response) {

    // Sent as a header
	const headers = {
		Authorization: 'Basic ' + new Buffer(`${data.username}:${data.password}`).toString('base64')
	};

    // Sent as part of the multipart form data
	const torrentData = JSON.stringify({
		name: data.name || null,
		category: data.category || null,
		information: data.information || null,
		description: data.description || null,
		anonymous: data.anonymous,
		hidden: data.hidden,
		complete: data.complete,
		remake: data.remake,
		trusted: data.trusted
	});

    // Array of functions that generate promises, each promise performs a POST request to upload a torrent
	const promises = [ ];
	files.forEach(file => {
		const form = new FormData();
		form.append('torrent_data', torrentData);
		form.append('torrent', file.buffer, {
			filename: file.originalname,
			knownType: file.mimetype,
			knownLength: file.size
		});
		promises.push(() => {
            Broadcast(data.sessionId, 'info', `Uploading "${file.originalname}"...`);
            return doSingleUpload(form, headers, data.sukebei)
                .catch(e => {
                    Broadcast(data.sessionId, 'error', `Upload of "${file.originalname}" failed.`);
                    return Promise.reject(e);
                });
        });
    });

    // Execute the promises in the array sequentially, one at a time
	Promise.mapSeries(promises, x => x().reflect(), { concurrency: 1 })
		.then(results => {
            const body = { };
            results.forEach((result,index) => {
                body[files[index].originalname] = {
                    result: result.isFulfilled(),
                    reason: (result.isFulfilled() ? null : result.reason().message)
                };
            });
			response.json(body);
		});

}

function doSingleUpload(form, headers, sukebei) {
    return fetch(API_URLS[sukebei ? 'sukebei' : 'nyaa'], { method: 'POST', body: form, headers })
        .then(response => {
            if (response.status > 400) {
            	let message = `API returned code ${response.status} (${response.statusText})`;
            	if (response.status === 403) message += ' (wrong credentials?)';
				return Promise.reject(new Error(message));
			}
            return response.json();
        })
        .then(response => {
            if (!response.errors) return; // Assume it completed successfully
            const errors = [ ];
            Object.keys(response.errors).forEach(category => {
                errors.push(...response.errors[category].map(error => `(${category}) ${error}`));
            });
            return Promise.reject(new Error(errors.join('<br>')));
        });
}
