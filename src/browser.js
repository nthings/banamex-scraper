const puppeteer = require('puppeteer');

async function startBrowser(){
	let browser;
	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: true,
	        args: [
				"--disable-gpu",
				"--disable-dev-shm-usage",
				"--disable-setuid-sandbox",
				"--no-sandbox",
			],
	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}

module.exports = {
	startBrowser
};