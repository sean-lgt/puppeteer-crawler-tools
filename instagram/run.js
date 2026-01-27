// 使用 node 子进程执行
const { spawn } = require('child_process')
const path = require('path')

// 获取命令行参数的搜索关键词
const keyword = process.argv[2]
if (!keyword) {
  console.error('❌ 请输入搜索关键词')
  console.log(`🚀 使用方法：npm start <搜索关键词>`)
  console.log(`🚀 npm start blackpink`)
  process.exit(1)
}

console.log(`🚀 开始执行完成爬取流程，搜索关键词：${keyword}`)

// 执行搜索脚本
function runSearch() {
  return new Promise((resolve, reject) => {
    console.log('\n=== 步骤1: 收集链接 ===')
    const searchProcess = spawn('node', ['get-search-urls.js', keyword], {
      stdio: 'inherit',
      cwd: __dirname,
    })

    searchProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n 🎉 执行搜索脚本，收集到链接')
        resolve()
      } else {
        reject(
          new Error(`❌[error code: ${code}] 执行搜索脚本失败，请检查错误信息`)
        )
      }
    })

    searchProcess.on('error', (err) => {
      reject(err)
    })
  })
}

// 执行获取详情脚本
function runGetDetails() {
  return new Promise((resolve, reject) => {
    console.log('\n=== 步骤2: 获取详情 ===')
    const detailsProcess = spawn('node', ['get-detail.js', keyword], {
      stdio: 'inherit',
      cwd: __dirname,
    })

    detailsProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n 🎉 执行获取详情完成')
        resolve()
      } else {
        reject(
          new Error(
            `❌[error code: ${code}] 执行获取详情脚本失败，请检查错误信息`
          )
        )
      }
    })

    detailsProcess.on('error', (err) => {
      reject(err)
    })
  })
}

async function main() {
  try {
    await runSearch()
    await runGetDetails()
    console.log('\n 🎉 执行完成')
    console.log('\n 5s后自动退出')
    setTimeout(() => {
      process.exit(0)
    }, 5000)
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

main()
