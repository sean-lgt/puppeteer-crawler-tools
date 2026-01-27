const { createBrowser, createPage } = require('./browser-config.js')

async function main() {
  let browser = await createBrowser()
  const page = await createPage(browser)

  console.log('🚀 正在打开 bing 页面...')
  await page.goto('https://cn.bing.com/', {
    waitUntil: 'networkidle0',
  })
}

main()
