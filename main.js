import puppeteer from 'puppeteer'
import * as fs from 'fs'

const browser = await puppeteer.launch()
const page = await browser.newPage()
const navigationPromise = page.waitForNavigation()
let logged = false

try {
  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots")
  }

  const user = process.env['CLIENT_NUMBER']
  const password = process.env['CLIENT_PASSWORD']
  if (!(user && password)) {
    console.error('One of the required env vars is not set!')
    process.exit(1)
  }
  const accounts_to_parse = JSON.parse(process.env['ACCOUNTS_TO_PARSE'])

  console.log('Navigating to banamex...')
  await page.goto('https://bancanet.banamex.com/MXGCB/JPS/portal/Index.do')
  await page.setViewport({ width: 1280, height: 653 })
  
  try {
    console.log('Checking for popup...')
    await page.waitForSelector('#splash-207555-close-button', {
      timeout: 3000
    })
    await page.click('#splash-207555-close-button')
  } catch {
    console.log('No popup showed up. Proceeding...')
  }

  console.log('Logging in...')
  console.log('Filling username...')
  await page.waitForSelector('#textCliente')
  await page.focus('#textCliente')
  await page.keyboard.type(user)
  await page.keyboard.press('Enter')
  
  await navigationPromise
  
  console.log('Filling password...')
  await page.waitForSelector('#textFirma')
  await page.focus('#textFirma')
  await page.keyboard.type(password)
  await page.keyboard.press('Enter')

  console.log('Getting in...')
  await navigationPromise

  try {
    console.log('Checking for error')
    await page.waitForSelector('#modal_commonError > div > div.clear.overflow > div.titulo.modaltitulo > p', {
      visible: true,
      timeout: 10000
    })
    const errors = await page.evaluate(() => {
      const list = Array.from(document.querySelectorAll('#container > div > div.puntos > div > p'))
      return list.map(el => el.textContent)
    })
    console.log(errors)
    throw new Error(errors)
  } catch {
    console.log('No error found...')
  }

  try {
    console.log('Checking for popup')
    await page.waitForSelector('.overlayofferconatiner > #outerContainer-0 > .outerContainer > .closeSvg > .closeSvgImg', {
      timeout: 3000
    })
    await page.click('.overlayofferconatiner > #outerContainer-0 > .outerContainer > .closeSvg > .closeSvgImg')
  } catch {
    console.log('No popup showed up. Proceeding...')
  }

  logged = true

  await page.screenshot({ path: `screenshots/banamex.png` })

  let accounts = [];
  await page.waitForSelector('.account-list-content')
  const account_list = await page.$$('.account-list-content')
  for (const element of account_list) {
    const account_name = await element.$eval('.account-mask-label', label => label.textContent)
    // if account_name
    accounts.push(
      {
        link: `https://bancanet.banamex.com/apps/dashboardnew/${
          await element.$eval('.account-mask-link', a => a.getAttribute('href'))}`,
        name: account_name,
      }
    )
  }
  // .headermenu-ul > #ele-0 > a
  console.log(`Accounts: ${JSON.stringify(accounts)}`)

  await page.goto()

  // await page.waitForSelector('app-accountlist-creditcard > .account-list-container > .account-list-content:nth-child(3) > .account-list > .flex > .flex > div > .account-mask-link > .account-mask-label')
  // await page.click('app-accountlist-creditcard > .account-list-container > .account-list-content:nth-child(3) > .account-list > .flex > .flex > div > .account-mask-link > .account-mask-label')

  // await page.waitForSelector('.table-container > table > tbody > tr:nth-child(1) > .label-01')
  // await page.click('.table-container > table > tbody > tr:nth-child(1) > .label-01')

} catch (err) {
  console.log(`❌ Error: ${err.message}`)
} finally {
  // Logout
  console.log('Log out...')
  if (logged) {
    await page.waitForSelector('.bluehead > .blue-top-container > .logout-container > .headerlogout > .logoutlabel')
    await page.click('.bluehead > .blue-top-container > .logout-container > .headerlogout > .logoutlabel')
  }

  await navigationPromise

  await browser.close()
}