const fs = require('fs')
const path = require('path')
const { createBrowser, createPage } = require('../browser-config.js')

// 获取命令行参数中的搜索关键词
const keyword = process.argv[2]
if (!keyword) {
  console.error('请提供搜索关键词')
  console.log('用法: node get-search-urls.js <关键词>')
  console.log('例如：node get-search-urls.js home-decor')
  process.exit(1)
}

console.log(`🚀 搜索关键词：${keyword}`)

async function main() {
  let browser = await createBrowser()
  const page = await createPage(browser)

  console.log(`🚀 正在导航到instagram页面，搜索关键词: ${keyword}`)
  await page.goto(
    `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(
      keyword
    )}`,
    {
      waitUntil: 'networkidle0',
    }
  )

  console.log(`🚀 页面已加载完成`)

  // 收集到的链接集合，用于去重
  const collectedUrls = new Set()

  // 收集当前页面的链接
  async function collectCurrentUrls() {
    const urls = await page.evaluate(() => {
      const selector =
        'div.x78zum5.xdt5ytf.x11lt19s.x1n2onr6.xph46j.x7x3xai.xsybdxg.x194l6zq a'
      const links = document.querySelectorAll(selector)
      return Array.from(links).map((link) => link.href)
    })

    console.log(`🚀 urls：`, urls)

    const beforeCount = collectedUrls.size
    urls.forEach((url) => collectedUrls.add(url))
    const newCount = collectedUrls.size
    console.log(
      `🚀 收集到 ${newCount - beforeCount} 个新链接，总计${
        collectedUrls.size
      } 个`
    )
    return newCount > 0
  }

  // 滚动到页面底部
  async function scrollToBottom() {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
  }

  // 检查是否到达页面底部
  async function isAtBottom() {
    return await page.evaluate(() => {
      return (
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 100
      )
    })
  }

  // 等待网络空闲
  async function waitForNetworkIdle() {
    return new Promise((resolve) => {
      let timeoutId = null
      let requestCount = 0

      const onRequest = () => {
        requestCount++
        clearTimeout(timeoutId)
      }

      const onResponse = () => {
        requestCount--
        if (requestCount === 0) {
          // 500ms没有新的网络请求就认为是空闲了
          timeoutId = setTimeout(() => {
            page.off('request', onRequest)
            page.off('response', onResponse)
            resolve()
          }, 500)
        }
      }

      // 启动网络监听
      page.on('request', onRequest)
      page.on('response', onResponse)

      // 初始超时，防止无限等待
      setTimeout(() => {
        page.off('request', onRequest)
        page.off('response', onResponse)
        resolve()
      }, 10 * 1000)
    })
  }

  // 主要的滚动收集逻辑
  console.log(`🚀 开始收集链接...`)

  let consecutiveNoNewUrls = 0
  let scrollCount = 0
  const maxScrolls = 50
  const maxConsecutiveNoNewUrls = 3
  const maxUrls = 10 // 可以设置收集到200个链接时停止

  // 先收集初始页面的链接
  await collectCurrentUrls()
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 2000)
  })

  // 开始滚动收集
  while (
    consecutiveNoNewUrls < maxConsecutiveNoNewUrls &&
    scrollCount < maxScrolls &&
    collectedUrls.size < maxUrls
  ) {
    scrollCount++
    console.log(`🚀 第 ${scrollCount} 次滚动...`)

    // 滚动到底部
    await scrollToBottom()
    console.log(`🚀 等待新内容完全加载...`)
    // 等待网络空闲
    await waitForNetworkIdle()

    // 收集新的链接
    const hasNewUrls = await collectCurrentUrls()
    if (hasNewUrls) {
      consecutiveNoNewUrls = 0
    } else {
      consecutiveNoNewUrls++
      console.log(`🚀 连续 ${consecutiveNoNewUrls} 次没有新链接`)
    }

    // 检查是否达到目标数量
    if (collectedUrls.size >= maxUrls) {
      console.log(`🚀 已收集到目标数量 ${maxUrls} 个链接，停止滚动`)
      break
    }

    // 检查是否达到页面底部
    if ((await isAtBottom()) && consecutiveNoNewUrls > 0) {
      console.log(`🚀 已经到达页面底部，停止收集`)
      break
    }
  }

  console.log(`🚀 滚动收集完成，共收集到 ${collectedUrls.size} 个链接`)

  const jsonFileName = `instagram-urls.json`

  const jsonFilePath = path.join(__dirname, `./result-data/${jsonFileName}`)
  const urlsArray = Array.from(collectedUrls)

  // 写入到文件中
  try {
    // 自动递归创建所有缺失的目录
    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true })
    fs.writeFileSync(jsonFilePath, JSON.stringify(urlsArray, null, 2))
    console.log(`🚀 链接已保存到 ${jsonFilePath} 文件中`)
  } catch (error) {
    console.error('🚨 写入文件失败：', error)
    process.exit(1)
  }

  // 输入前10个链接作为示例
  const sampleUrls = Array.from(collectedUrls).slice(0, 10)
  console.log(`🚀 \n示例链接：`)
  sampleUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`)
  })

  await browser.close()
  console.log(`🚀 脚本执行完毕`)
}

main()
