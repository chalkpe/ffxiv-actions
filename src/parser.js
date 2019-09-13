const puppeteer = require('puppeteer')
const defaultViewport = { width: 1920, height: 1080 }

const injectUtil = () => {
  window.Q = (a, b) => b ? a.querySelector(b) : [...document.querySelectorAll(a)]

  window.textNode = n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
  window.markupNode = n => n.nodeName !== 'DIV' && (n.outerHTML || n.nodeValue).trim()

  window.text = e => e && [...e.childNodes].find(textNode).textContent.trim()
  window.effect = e => e && [...e.childNodes].map(markupNode).filter(n => n).join('')
  window.link = e => e && e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href').replace(/^\/\//, 'https://')
}

async function parseJobs (browser, server) {
  const page = await browser.newPage()
  await page.goto(server.baseURL + server.endpoint)
  await page.waitFor(server.selector.job)

  await page.evaluate(injectUtil)
  const data = await page.evaluate(s =>
    Q(s.job).map(a => ({ name: text(a), link: link(a) })
  ), server.selector)

  await page.close()
  return data
}

async function parseSkills (browser, server, link) {
  const page = await browser.newPage()
  await page.goto(server.baseURL + link)
  await page.waitFor(server.selector.skill)

  await page.evaluate(injectUtil)
  const data = await page.evaluate(s => [s.pve, s.pvp].map(p =>
    Q(`${p} ${s.skill}`).map(tr => ({
      name: text(Q(tr, s.skillName)) || text(Q(tr, s.skillNameFallback)),
      icon: link(Q(tr, s.skillIcon)),
      effect: effect(Q(tr, s.skillEffect))
    }))
  ), server.selector)

  await page.close()
  return { pve: data[0], pvp: data[1] }
}

module.exports = async function parse (server) {
  const browser = await puppeteer.launch({ defaultViewport })

  const jobs = await parseJobs(browser, server)
  const data = await Promise.all(jobs.map(async job => ({
    name: job.name,
    link: job.link.split('/').filter(s => s).slice(-1)[0],
    skills: await parseSkills(browser, server, job.link)
  })))

  await browser.close()
  return data
}