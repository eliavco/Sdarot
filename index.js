const fetch = require('node-fetch');
const http = require('http');
const fs = require('fs');
const { JSDOM } = require("jsdom");
const showNum = process.argv[2]*1;
// To run script find show id on sdarot.life and run the following command in directory: npm start -- {id}
// For example, for the show Ramzor run: npm start -- 226
const base = 'C:\Users\eliav_1iz7\Documents\TVShows';
let showName = '';
let seasonNum = 0;

async function GetInfo(i) {
    async function GetTitle(id) {
        const main = await fetch(`https://sdarot.life/watch/${id}`);
        if (main.status == 200) {
            const htmlMain = await main.text();
            const doc = new JSDOM(htmlMain);
            const poster = doc.window.document.querySelector('.poster');
            console.log(`Show Code: ${id}`);
            console.log(`Show Name: ${poster.querySelector('h1 strong').innerHTML}`);
            showName = poster.querySelector('h1 strong').innerHTML;
            const seasonList = doc.window.document.querySelector('#season').children;
            console.log(`Number of Seasons in Show: ${seasonList.length}\n---\n`);
            seasonNum = seasonList.length;
        }
    }
    await GetTitle(i);
}

function wait (ms) {
	const start = new Date().getTime();
	let end = start;
    let led = start;
    process.stdout.write(`${ms/1000} `);
	while(end < start + ms) {
        if (end == led + 1000) {
            led += 1000;
            process.stdout.write(`${(ms-(led - start))/1000} `);
        }
		end = new Date().getTime();
	}
    process.stdout.write('\n');
}

async function callA() {
    const res = await fetch('https://sdarot.life/ajax/watch', {
        method: 'POST',
        headers: {
            'Host': 'sdarot.life',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Length': 73,
            'Origin': 'https://sdarot.life',
            'Connection': 'keep-alive',
            'Referer': 'https://sdarot.life/watch/226-%D7%A8%D7%9E%D7%96%D7%95%D7%A8-ramzor/season/1/episode/4',
            'Cookie': 'Sdarot=ilUQbYqFXCg2KN1fg36kVwHm-ce8xj4wbRrhcEXA1yoeQlYtkiigqZU3VOec6O6jtAqQztW1ekqa1E8UYRwvhK3zcsWMf2kXqKz3FOZ9vrQYeQLKh2QAgl2Ll6fub7gR; _ga=GA1.2.1762713100.1586001909; _gid=GA1.2.1976278075.1586001909; _gat=1',
            'TE': 'Trailers'
        },
        body: 'preWatch=true&SID=226&season=1&ep=4',
    });
    if (res.status === 200) {
        const body = await res.text();
        return body;
    }
}

async function callB(j) {
    const res = await fetch('https://sdarot.life/ajax/watch', {
        method: 'POST',
        headers: {
            'Host': 'sdarot.life',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Length': 73,
            'Origin': 'https://sdarot.life',
            'Connection': 'keep-alive',
            'Referer': 'https://sdarot.life/watch/226-%D7%A8%D7%9E%D7%96%D7%95%D7%A8-ramzor/season/1/episode/4',
            'Cookie': 'Sdarot=ilUQbYqFXCg2KN1fg36kVwHm-ce8xj4wbRrhcEXA1yoeQlYtkiigqZU3VOec6O6jtAqQztW1ekqa1E8UYRwvhK3zcsWMf2kXqKz3FOZ9vrQYeQLKh2QAgl2Ll6fub7gR; _ga=GA1.2.1762713100.1586001909; _gid=GA1.2.1976278075.1586001909; _gat=1',
            'TE': 'Trailers'
        },
        body: `watch=false&token=${j}&serie=226&season=1&episode=4&type=episode`,
    });
    if (res.status === 200) {
        const body = await res.text();
        return body;
    }
}

async function UCall(){
    const a = await callA();
    wait(30000);
    const e = await callB(a);
    const c = JSON.parse(e);
    if (c.error) {
        console.log('Servers full');
        return;
    } 
    console.log(e);
    // {"VID":"107483","ratedby":"9","rate":"4.3","viewed":"0","url":"minerva.sdarot.life","watch":{"480":"7m1fRFEo7rY8oIrzxXm0zA"},"time":1586019539,"uid":""}
    if (c['VID']) {
        let q;
        if (c.watch['480']) q = '480';
        if (c.watch['720']) q = '720';
        if (c.watch['1080']) q = '1080';
        const w = `http://${c.url}/w/episode/${q}/${c.VID}.mp4?token=${c.watch[q]}&time=${c.time}&uid=${c.uid}`;
        return w;
    }

    // http://${c.url}/w/episode/480/${c.VID}.mp4?token=hA6V5tTuu557G64iYUU9LA&time=${c.time}&uid=${c.uid}
}

async function TCall() {
    let w;
    while (!w) {
        w = await UCall();
        console.log('Retrying...');
    }
    console.log(w);
    const file = fs.createWriteStream("file.mp4");
    const request = http.get(w, { headers: {
            'Host': 'sdarot.life',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Length': 73,
            'Origin': 'https://sdarot.life',
            'Connection': 'keep-alive',
            'Referer': 'https://sdarot.life/watch/226-%D7%A8%D7%9E%D7%96%D7%95%D7%A8-ramzor/season/1/episode/4',
            'Cookie': 'Sdarot=ilUQbYqFXCg2KN1fg36kVwHm-ce8xj4wbRrhcEXA1yoeQlYtkiigqZU3VOec6O6jtAqQztW1ekqa1E8UYRwvhK3zcsWMf2kXqKz3FOZ9vrQYeQLKh2QAgl2Ll6fub7gR; _ga=GA1.2.1762713100.1586001909; _gid=GA1.2.1976278075.1586001909; _gat=1',
            'TE': 'Trailers'
        }  }, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(()=>{console.log('done');});  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink("file.mp4"); // Delete the file async. (But we don't check the result)
        console.log(err.message);
    });
}

// TCall();
GetInfo(showNum).then(()=>{
});