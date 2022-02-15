const scraperObject = {
	url: 'https://www.banamex.com/',
	async scraper(browser){
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}....`);
		await page.goto(this.url);
		console.log(`Waiting for #menu-login...`);
		await page.waitForSelector('#menu-login');
		await page.click('#menu-login');
		console.log(`Waiting for #menu-login-bancanet > li:nth-child(3) > a`);
		await page.waitForSelector('#menu-login-bancanet > li:nth-child(3) > a');
		await page.click('#menu-login-bancanet > li:nth-child(3) > a');
		await page.type('#textCliente', process.env.CLIENT_NUMBER);
		console.log(`Waiting for '#loginCustomerBox > div.marginT15.Button-Area > a`);
		await page.waitForSelector('#loginCustomerBox > div.marginT15.Button-Area > a');
		await page.click('#loginCustomerBox > div.marginT15.Button-Area > a');
		console.log(`Taking screenshot...`);
		const ss = await page.screenshot({path: "/screenshot.png"});
	}
}

module.exports = scraperObject;