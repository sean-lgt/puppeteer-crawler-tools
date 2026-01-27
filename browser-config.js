const puppeteer = require('puppeteer')
const path = require('path')
const config = require('./config.json')

/**
 * @description: 创建 Puppeteer 浏览器实例
 * @return {Promise<Browser>} 浏览器实例
 * @param {Object} options - 可选的配置参数
 * @param {boolean} options.headless - 是否无头模式，默认 false
 */
async function createBrowser(options = {}) {
  const { headless = false } = options

  // puppeteer启动参数配置
  const launchOptions = {
    headless,
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: path.join(__dirname, 'user-data'),
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--start-maximized',
      // '--max_old_space_size=2048',
      ...(config.proxy ? [`--proxy-server=${config.proxy}`] : []),
      '--disable-web-security',
      // '--disable-features=VizDisplayCompositor',
    ],
  }

  return await puppeteer.launch(launchOptions)
}

/**
 * @description: 创建页面并设置默认配置
 * @return {Promise<Page>} 页面实例
 * @param {Browser} browser - 浏览器实例
 * @param {number} timeout - 超时时间（毫秒），默认 60000
 */
async function createPage(browser, timeout = 60000) {
  const existingPages = await browser.pages()
  const page =
    existingPages.length > 0 ? existingPages[0] : await browser.newPage()

  // 设置超时
  await page.setDefaultTimeout(timeout)
  await page.setDefaultNavigationTimeout(timeout)

  // 设置User-Agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  // 禁用不必要的资源加载以节省内存和提高速度
  await page.setRequestInterception(true)

  page.on('request', (request) => {
    const resourceType = request.resourceType()
    const url = request.url()

    // 阻止加载大部分静态资源，只保留必要的HTML和一些基础资源
    const OPEN_ABORT_RESOURCES = true
    if (OPEN_ABORT_RESOURCES) {
      if (
        resourceType === 'font' ||
        resourceType === 'media' ||
        resourceType === 'websocket' ||
        resourceType === 'manifest' ||
        resourceType === 'other' ||
        url.includes('google-analytics') ||
        url.includes('facebook.com/tr') ||
        url.includes('doubleclick') ||
        url.includes('googletagmanager') ||
        url.includes('analytics') ||
        url.includes('ads') ||
        url.includes('.woff') ||
        url.includes('.woff2') ||
        url.includes('.ttf') ||
        url.includes('.eot') ||
        url.includes('video') ||
        url.includes('audio')
      ) {
        request.abort()
      } else {
        request.continue()
      }
    } else {
      request.continue()
    }
  })

  // 禁用图像加载（如果你需要图片，可以注释掉这部分）
  // await page.setJavaScriptEnabled(false) // 如果不需要JS可以禁用

  return page
}

module.exports = {
  createBrowser,
  createPage,
}
