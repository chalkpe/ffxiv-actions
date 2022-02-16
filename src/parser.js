const names = require('./names')
const puppeteer = require('puppeteer')
const defaultViewport = { width: 1920, height: 1080 }

const injectUtil = () => {
  window.Q = (a, b) => b ? a.querySelector(b) : [...document.querySelectorAll(a)]

  window.textNode = n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
  window.markupNode = n => n.nodeName !== 'DIV' && (n.outerHTML || n.nodeValue).trim()

  window.text = e => e && [...e.childNodes].find(textNode)?.textContent.trim()
  window.effect = e => e && [...e.childNodes].map(markupNode).filter(n => n).join('')
  window.link = e => e && e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href').replace(/^\/\//, 'https://')
}

async function parseJobs (browser, client) {
  const page = await browser.newPage()
  await page.goto(client.baseURL + client.endpoint)
  await page.waitForTimeout(client.selector.job)

  await page.evaluate(injectUtil)
  const data = await page.evaluate(s =>
    Q(s.job).map(a => ({ name: text(a), link: link(a) })
  ), client.selector)

  await page.close()
  return data
}

async function parseSkills (browser, client, link) {
  const page = await browser.newPage()
  await page.goto(client.baseURL + link)
  await page.waitForTimeout(client.selector.skill)

  await page.evaluate(injectUtil)
  const data = await page.evaluate(s => [s.pve, s.pvp].map(p =>
    Q(`${p} ${s.skill}`).map(tr => ({
      name: (text(Q(tr, s.skillName)) || text(Q(tr, s.skillNameFallback))).replace(/\s+/g, ' '),
      icon: link(Q(tr, s.skillIcon)),
      effect: effect(Q(tr, s.skillEffect)).replace(/\s+/g, ' ')
    }))
  ), client.selector)

  await page.close()
  return { pve: data[0], pvp: data[1] }
}

module.exports = async function parse (client) {
  const browser = await puppeteer.launch({ defaultViewport })

  const jobs = await parseJobs(browser, client).then((jobs) =>
    jobs.filter((job) => !job.link.includes('bluemage'))
  )

  const result = await Promise.all(jobs.map(async job => {
    const name = job.name.replace(/（.+）$/, '')
    const id = job.link.split('/').filter((s) => s)[1]
    const skills = await parseSkills(browser, client, job.link)

    return { name, id, ...names[id], skills }
  }))

  await browser.close()
  return result
}