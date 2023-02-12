import scrape from './index.js'

console.log(JSON.stringify(await scrape(
  process.env['CLIENT_NUMBER'],
  process.env['CLIENT_PASSWORD'], 
  JSON.parse(process.env['ACCOUNTS_TO_PARSE'])
)))
