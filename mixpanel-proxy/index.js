'use strict';
const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
const proxy = httpProxy.createProxyServer({});

const API_URL = process.env.MIXPANEL_API_URL || 'https://api.mixpanel.com';
const LIB_HOST = process.env.MIXPANEL_LIB_HOST || 'https://cdn4.mxpnl.com';
const LIB_PATH = process.env.MIXPANEL_LIB_PATH || '/libs/mixpanel-2-latest.min.js';
const PORT = process.env.PORT || 3000;
const TRUNCATE_URL = process.env.TRUNCATE_URL || '^/mpanel';

if (process.env.SENTRY_DSN) {
    require('@sentry/node').init({ dsn: process.env.SENTRY_DSN });
}

const server = http.createServer(function(req, res) {
    const is_lib_req = req.url === '/mpanel/lib';
    const parsed_url = url.parse(is_lib_req ? LIB_HOST + LIB_PATH : API_URL);
    req.headers.host = parsed_url.hostname;
    const parsed_incoming_url = url.parse(req.url);
    console.log(parsed_incoming_url);
    const searchParams = new URLSearchParams(parsed_incoming_url.query);
    const data_b64 = searchParams.get('data');
    const client_ip = req.headers['x-forwarded-for'];

    if (is_lib_req) {
        req.url = LIB_PATH;
        proxy.web(req, res, {
            target: LIB_HOST
        });
    } else {
        if (data_b64 && client_ip) {
            const data = JSON.parse(Buffer.from(data_b64, 'base64').toString('utf-8'));
            data.$ip = client_ip;
            if (data.properties) {
                data.properties.ip = client_ip;
            }
            const new_data_b64 = Buffer.from(JSON.stringify(data)).toString('base64');
            searchParams.set('data', new_data_b64);
            parsed_incoming_url.query = searchParams.toString();
            console.log({new_url: parsed_incoming_url.format()});
            req.url = parsed_incoming_url.format();
        }
        if (TRUNCATE_URL) {
            req.url = req.url.replace(new RegExp(TRUNCATE_URL, 'gm'), '');
        }
        proxy.web(req, res, {
            target: API_URL
        });
    }
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
