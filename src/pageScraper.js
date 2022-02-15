const scraperObject = {
	url: 'https://bancanet.banamex.com/MXGCB/JPS/portal/Index.do',
	async scraper(browser){
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}....`);
		await page.goto(this.url);

		console.log(`Waiting for #preSignonForm...`);
		await page.waitForSelector('#preSignonForm');
		await page.type('#textCliente', process.env.CLIENT_NUMBER);
		console.log(`Waiting for '#loginCustomerBox > div.marginT15.Button-Area > a`);
		await page.waitForSelector('#loginCustomerBox > div.marginT15.Button-Area > a');
		await page.click('#loginCustomerBox > div.marginT15.Button-Area > a');
		await page.waitForSelector('#textFirma');
		await page.type('#textFirma', process.env.CLIENT_PASSWORD);
		console.log(`Taking screenshot...`);
		await page.screenshot({path: "./screenshot.png"});
		console.log(`Screenshot taken...`);
	}
}

module.exports = scraperObject;