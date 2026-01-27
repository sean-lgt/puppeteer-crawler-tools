const { createBrowser, createPage } = require('../browser-config.js')

async function main() {
  let browser = await createBrowser()
  const page = await createPage(browser)

  console.log('🚀 正在打开 instagram 页面...')
  await page.goto('https://www.instagram.com/', {
    waitUntil: 'networkidle0',
  })
}

main()
