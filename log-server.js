const http = require('http');

const server = http.createServer((req, res) => {
    // Handle CORS for web if necessary
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                console.log('\n\n=== LOG RECEIVED ===\n');
                console.log(JSON.stringify(JSON.parse(body), null, 2));
                console.log('\n==================\n');
            } catch (e) {
                console.log('\n\n=== LOG RECEIVED (RAW) ===\n', body, '\n==================\n');
            }
            res.writeHead(200);
            res.end('OK');
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(9999, () => {
    console.log('Log server listening on port 9999');
});
