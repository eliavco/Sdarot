const fetch = require('node-fetch');
const http = require('http');
const fs = require('fs');
const { JSDOM } = require("jsdom");
const readline = require('readline');

const showNum = process.argv[2]*1;
// To run script find show id on sdarot.life and run the following command in directory: npm start -- {id}
// For example, for the show Ramzor run: npm start -- 226
const base = 'C:\\Users\\eliav_1iz7\\Documents\\TVShows\\';
let baseShow = 'C:\\Users\\eliav_1iz7\\Documents\\TVShows\\';
let showName = '';
let seasonNum = 0;
let showSlug = '';
let seasons = [];
let description = '';

const webHost = 'sdarot.life';
const webProtocol = 'https';
let cookieSdarot = 'ojOk17PK1g3tc3bQAeMoTHlFkii-IR4NpLBrZImLA%2Cepgd5yw7RmUhIKtg9Kq8hy5RIH-mbtczgvRGq15JdezGgS-v7ao9w0J6JBD85tBG4fnmleHlrVVjnhYs2bSQ4Y';

async function GetInfo(i, host, protocol, baseP) {
    async function GetTitle(id, host, protocol) {
        const main = await fetch(`${protocol}://${host}/watch/${id}`);
        if (main.status == 200) {
            const htmlMain = await main.text();
            const doc = new JSDOM(htmlMain);
            const poster = doc.window.document.querySelector('.poster');
            console.log(`Show Code: ${id}`);
            console.log(`Show Name: ${poster.querySelector('h1 strong').innerHTML}`);
            showName = poster.querySelector('h1 strong').innerHTML;
            const seasonList = doc.window.document.querySelector('#season').children;
            console.log(`Number of Seasons in Show: ${seasonList.length}`);
            seasonNum = seasonList.length;
            //////
            const desAP = htmlMain.substring(htmlMain.indexOf('תקציר הסדרה'));
            const des = desAP.substring(desAP.indexOf('<p>')+3, desAP.indexOf('</p>'));
            description = des;
            //////
            const firstSeason = seasonList[0];
            const showPath = firstSeason.querySelector('a').href;
            const SlugOfShow = showPath.substring(7, 7 + showPath.substring(7).indexOf('/'));
            showSlug = encodeURI(SlugOfShow);
            console.log(`Show Slug: ${encodeURI(SlugOfShow)}\n---\n`);
        }
    }
    async function GetSeason(id, num, host, protocol) {
        const episodes = [];
        console.log(`Season Num: ${num}`);
        const main = await fetch(`${protocol}://${host}/watch/${showSlug}/season/${num}/`);
        if (main.status == 200) {
            const htmlMain = await main.text();
            const doc = (new JSDOM(htmlMain)).window.document;
            const episodeList = doc.querySelector('#episode').children;
            console.log(`\tNumber of Episodes in season: ${episodeList.length}`);
            for (let ep = 0; ep < episodeList.length; ep ++) {
                console.log(`\t\tEpisode Num: ${ep + 1}`);
                const episodeTitle = await GetEpisode(id, num, ep + 1, host, protocol);
                console.log(`\t\t\t${episodeTitle}`);
                episodes.push(episodeTitle);
            }
            seasons.push(episodes);
        }
        console.log();
    }
    async function GetEpisode(id, sNum, eNum, host, protocol) {
        const main = await fetch(`${protocol}://${host}/watch/${showSlug}/season/${sNum}/episode/${eNum}`);
        if (main.status == 200) {
            const htmlMain = await main.text();
            const doc = (new JSDOM(htmlMain)).window.document;
            const title = doc.querySelector('#player .head p').innerHTML;
            const titleAbs = title.substring(0, title.indexOf(' /'));
            return titleAbs;
        }
    }
    await GetTitle(i, host, protocol);
    for (let ind = 0; ind < seasonNum; ind++){
        await GetSeason(i, ind + 1, host, protocol);
    }
    const shName = decodeURI(showSlug).substring(showSlug.indexOf('-')+1);
    baseShow = `${baseP}${shName}\\`;
    let shouldDir = true;
    const anb = await openNPrompt('setting up directories');
    if (anb) shouldDir = false;
    if (shouldDir) {
        if (!fs.existsSync(`${baseP}${shName}`)){
            fs.mkdirSync(`${baseP}${shName}`);
        }
        for (let n = 0; n < seasonNum; n++) {
            if (!fs.existsSync(`${baseShow}Season${n+1}`)){
                fs.mkdirSync(`${baseShow}Season${n+1}`);
            }
        }
        let all = '';
        seasons.forEach((season, sInd) => {
            all += `Season Num: ${sInd + 1}\n\tNumber of Episodes in season: ${season.length}\n`;
            season.forEach((episode, eInd) => {
               all += `\t\tEpisode Num: ${eInd + 1}\n\t\t\t${episode}\n`;
            });
            all += '\n'
        });
        fs.writeFileSync(`${baseShow}Description.txt`, `${showNum}\nName: ${showName}\nNumber Of Seasons:${seasonNum}\nDescription: ${description}\n\n---\n\n${all}`);
    }
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

async function callA(slug, sNum, eNum, sId, host, protocol) {
    const res = await fetch(`${protocol}://${host}/ajax/watch`, {
        method: 'POST',
        headers: {
            'Host': host,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': `${protocol}://${host}`,
            'Connection': 'keep-alive',
            'Referer': `${protocol}://${host}/watch/${slug}/season/${sNum}/episode/${eNum}`,
            'Cookie': `Sdarot=${cookieSdarot};`,
            'TE': 'Trailers'
        },
        body: `preWatch=true&SID=${sId}&season=${sNum}&ep=${eNum}`,
    });
    if (res.status === 200) {
        const body = await res.text();
        return body;
    }
}

async function callB(j, slug, sNum, eNum, sId, host, protocol) {
    const res = await fetch(`${protocol}://${host}/ajax/watch`, {
        method: 'POST',
        headers: {
            'Host': host,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': `${protocol}://${host}`,
            'Connection': 'keep-alive',
            'Referer': `${protocol}://${host}/watch/${slug}/season/${sNum}/episode/${eNum}`,
            'Cookie': `Sdarot=${cookieSdarot};`,
            'TE': 'Trailers'
        },
        body: `watch=false&token=${j}&serie=${sId}&season=${sNum}&episode=${eNum}&type=episode`,
    });
    if (res.status === 200) {
        const body = await res.text();
        return body;
    }
}

async function UCall(slug, sNum, eNum, sId, host, protocol){
    const a = await callA(slug, sNum, eNum, sId, host, protocol);
    wait(30000);
    const e = await callB(a, slug, sNum, eNum, sId, host, protocol);
    const c = JSON.parse(e);
    if (c.error) {
        console.log('Servers full or token incorrect');
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

async function issueNewToken() {
    const res = await fetch('https://sdarot.life/');
    const cookies = res.headers.raw()['set-cookie'][0];
    const Sdarot = cookies.substring(cookies.indexOf('Sdarot=') + 7, cookies.substring(cookies.indexOf('Sdarot=')).indexOf(';'));
    cookieSdarot = Sdarot;
    console.log(`\n###\nIssued a new token: ${Sdarot}\n###\n`);
}

async function TCall(slug, sNum, eNum, eName, sId, host, protocol) {
    console.log(`Downloading S${sNum}E${eNum}`);
    const ableString = eName.replace(/\?|:|"/g, '');
    let go = false;
    const an = await openNPrompt(`S${sNum}E${eNum} ${eName}`);
    if (an) go = true;
    while(!go) {
        let w;
        let counter = 0;
        while (!w) {
            if (counter == 5) {
                counter = 0;
                await issueNewToken();
            }
            w = await UCall(slug, sNum, eNum, sId, host, protocol);
            console.log('Retrying...');
            counter++;
        }
        console.log(w);
        const file = fs.createWriteStream(`${baseShow}Season${sNum}\\${sNum},${eNum}\uA789 ${ableString}.mp4`);
        try {
            const res = await fetch(w, {
                method: 'GET',
                headers: {
                    'Host': host,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': `${protocol}://${host}`,
                    'Connection': 'keep-alive',
                    'Referer': `${protocol}://${host}/watch/${slug}/season/${sNum}/episode/${eNum}`,
                    'Cookie': `Sdarot=${cookieSdarot};`,
                    'TE': 'Trailers'
                }
            });
            res.body.pipe(file);
            const end = new Promise(function(resolve, reject) {
                file.on('finish', function() {
                    file.close(()=>{
                        console.log(`Downloaded S${sNum}E${eNum}\n`);
                        resolve();
                    });  // close() is async, call cb after close completes.
                }).on('error', function(err) {
                    fs.unlinkSync(`${baseShow}Season${sNum}\\${sNum},${eNum}\uA789 ${ableString}.mp4`);
                    reject(err);
                });
            });
            try {
                await end;
                go = true;
            } catch (e) {
                console.log(err.message); 
            }
        } catch (err) {
            fs.unlinkSync(`${baseShow}Season${sNum}\\${sNum},${eNum}\uA789 ${ableString}.mp4`); // Delete the file async. (But we don't check the result)
            console.log(err.message);
            console.log(`Retrying to Download S${sNum}E${eNum}`);
        }
    }
}

//async function Call(showSlug, sInd, eInd, episode, showNum, webHost, webProtocol) {
//    console.log(showSlug, sInd, eInd, episode, showNum, webHost, webProtocol)
//};

//TCall('226-%D7%A8%D7%9E%D7%96%D7%95%D7%A8-ramzor', 1, 4, 'MyAss', showNum, webHost, webProtocol);
async function RUN() {
    await GetInfo(showNum, webHost, webProtocol, base);
    console.log('Download has started...\n');
    for (let l = 0; l < seasons.length; l++) {
        for (let m = 0; m < seasons[l].length; m++) {
            await TCall(showSlug, l + 1, m + 1, seasons[l][m], showNum, webHost, webProtocol);
        }
    }
}

RUN();

async function openNPrompt(skip) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const promisified = new Promise(function (resolve, reject) {
        rl.question(`Skip ${skip}? 's' to skip\n`, (answer) => {
            resolve(answer);
        });
        setTimeout(() => {
            resolve();
        }, 5000);
    });
    
    const anj = await promisified;
    if (anj == 's') {
        console.log(`Skipping ${skip}`);
        rl.close();
        return 'skip';
    }
    rl.close();
    return null;
}
