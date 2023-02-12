import puppeteer from 'puppeteer'

const browser = await puppeteer.launch()
const page = await browser.newPage()
const navigationPromise = page.waitForNavigation()
let logged = false


async function scrape(user, password, accounts_to_parse) {
  let accounts = []
  try {
    if (!(user && password && accounts_to_parse)) {
      console.error('One of the required env vars is not set!')
      process.exit(1)
    }
    accounts_to_parse = accounts_to_parse.map((acc) => `${acc} - MXN`)

    await page.goto('https://bancanet.banamex.com/MXGCB/JPS/portal/Index.do')
    await page.setViewport({ width: 1280, height: 653 })

    try {
      await page.waitForSelector('#splash-207555-close-button', {
        timeout: 3000,
      })
      await page.click('#splash-207555-close-button')
    } catch {
      // pass
    }

    await page.waitForSelector('#textCliente')
    await page.focus('#textCliente')
    await page.keyboard.type(user)
    await page.keyboard.press('Enter')

    await navigationPromise

    await page.waitForSelector('#textFirma')
    await page.focus('#textFirma')
    await page.keyboard.type(password)
    await page.keyboard.press('Enter')

    await navigationPromise

    try {
      await page.waitForSelector(
        '#modal_commonError > div > div.clear.overflow > div.titulo.modaltitulo > p',
        {
          visible: true,
          timeout: 10000,
        }
      )
      const errors = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('#container > div > div.puntos > div > p')
        ).map((el) => el.textContent)
      )
      throw new Error(errors.join(' '))
    } catch(e) {
      if (e.message.includes('Solo puedes tener una sesión activa')) {
        throw e
      } else {
        // pass
      }
    }

    try {
      await page.waitForSelector(
        '.overlayofferconatiner > #outerContainer-0 > .outerContainer > .closeSvg > .closeSvgImg',
        {
          timeout: 3000,
        }
      )
      await page.click(
        '.overlayofferconatiner > #outerContainer-0 > .outerContainer > .closeSvg > .closeSvgImg'
      )
    } catch {
      // pass
    }

    logged = true

    await page.waitForSelector('.account-list-content')
    const account_list = await page.$$('.account-list-content')
    for (const element of account_list) {
      const account_name = await element.$eval(
        '.account-mask-label',
        (label) => label.textContent
      )
      if (accounts_to_parse.indexOf(account_name) > -1) {
        accounts.push({
          link: `https://bancanet.banamex.com/apps/dashboardnew/${await element.$eval(
            '.account-mask-link',
            (a) => a.getAttribute('href')
          )}`,
          name: account_name,
        })
      }
    }

    for (const account of accounts) {
      await page.goto(account.link)
      await navigationPromise
      await page.waitForSelector(
        'table'
      )

      try {
        await page.waitForSelector(
          'body > app-root > app-ada > app-demo-tdc > div.ada_section > div > app-ada-tdc > app-account-detail > div > div.info_area > div.table_info > app-row-info:nth-child(4) > div > div.text_right.label-01 > div'
        )
        const no_interests_amount = await page.$eval(
          'body > app-root > app-ada > app-demo-tdc > div.ada_section > div > app-ada-tdc > app-account-detail > div > div.info_area > div.table_info > app-row-info:nth-child(4) > div > div.text_right.label-01 > div',
          (div) => div.textContent
        )
        account.no_interests_amount = Number(
          no_interests_amount
            .replace(/\s+/g, '')
            .replace(/\,/g, '')
            .replace(/\$/g, '')
        )
      } catch {
        account.no_interests_amount = 0
      }

      account.data = await page.evaluate(() => {
        function buildDate(date) {
          const monthEN = {
            Ene: 'Jan', Abr: 'Apr', Ago: 'Aug', Dic: 'Dec'
          }

          if (date.includes(Object.keys(monthEN).join(','))) {
            return date.replace(/Ene|Abr|Ago|Dic/gi, function (matched) {
              return `${date.split(' ')[0]} ${monthEN[matched]}  ${new Date().getFullYear()}`
            })
          }

          return `${date} ${new Date().getFullYear()}`
        }

        const rows = Array.from(document.querySelectorAll('table tr'))
        return Array.from(rows, (row) => {
          const columns = Array.from(
            row.querySelectorAll('td'),
            (column) => column.innerText
          )
          if (columns[2]) {
            if (!columns[2].includes('En proceso') && columns[2].includes('-')) {
              const date = buildDate(columns[0])
              const amount = Number(
                columns[2]
                  .replace(/\s+/g, '')
                  .replace(/\-/g, '')
                  .replace(/\,/g, '')
                  .replace(/\$/g, '')
              )
              if (!amount) {
                // Rejected payment
                return null
              }

              let concept = columns[1]
              const match = /(.*)\((\d*):(\d*)\)/g.exec(concept)
              let current_month = null
              let total_months = null
              // If match then the expense is recurrent
              if (match) {
                concept = match[1]
                current_month = Number(match[2])
                total_months = Number(match[3])
              }

              return {
                date,
                amount,
                concept,
                current_month,
                total_months,
              }
            }
          }
        }).filter((x) => x)
      })

      delete account.link
      account.total = account.data.reduce((accumulator, element) => {
        return accumulator + element.amount
      }, 0)
    }
  } finally {
    // Logout
    if (logged) {
      await page.waitForSelector(
        '.bluehead > .blue-top-container > .logout-container > .headerlogout > .logoutlabel'
      )
      await page.click(
        '.bluehead > .blue-top-container > .logout-container > .headerlogout > .logoutlabel'
      )
    }

    await navigationPromise

    await browser.close()
  }
  console.log(accounts)
  return accounts
}

export default scrape
