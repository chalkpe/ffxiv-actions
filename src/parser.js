const names = require('./names')
const puppeteer = require('puppeteer')
const defaultViewport = { width: 1920, height: 1080 }

const injectUtil = () => {
  window.Q = (a, b) => (b ? a.querySelector(b) : [...document.querySelectorAll(a)])

  window.textNode = (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
  window.markupNode = (n) => n.nodeName !== 'DIV' && (n.outerHTML || n.nodeValue).trim()

  window.text = (e) => e && [...e.childNodes].find(textNode)?.textContent.trim()
  window.effect = (e) =>
    e &&
    [...e.childNodes]
      .map(markupNode)
      .filter((n) => n)
      .join('')
  window.link = (e) => e && e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href').replace(/^\/\//, 'https://')
}

const newPage = async (browser, path, selector) => {
  const page = await browser.newPage(browser)

  await page.setRequestInterception(true)
  page.on('request', (req) => (['image', 'font', 'stylesheet'].includes(req.resourceType()) ? req.abort() : req.continue()))

  await page.goto(path)
  await page.waitForTimeout(selector)
  await page.evaluate(injectUtil)

  return page
}

async function parseJobs(browser, client) {
  const page = await newPage(browser, client.baseURL + client.endpoint, client.selector.job)

  try {
    const data = await page.evaluate((s) => Q(s.job).map((a) => ({ name: text(a), link: link(a).toLowerCase() })), client.selector)

    return data
  } catch (err) {
    throw err
  } finally {
    await page.close()
  }
}

async function parseSkills(browser, client, link) {
  const page = await newPage(browser, client.baseURL + link, client.selector.skill)

  try {
    const run = (p) =>
      page.evaluate(
        (s, p) =>
          Q(`${p} ${s.skill}`).map((tr) => ({
            name: (text(Q(tr, s.skillName)) || text(Q(tr, s.skillNameFallback))).replace(/\s+/g, ' '),
            icon: link(Q(tr, s.skillIcon)),
            effect: effect(Q(tr, s.skillEffect)).replace(/\s+/g, ' '),
          })),
        client.selector,
        p
      )

    if (client.selector.pveTab) {
      await page.evaluate((s) => Q(s.pveTab)[0].click(), client.selector)
      await page.waitForNavigation()
      await page.evaluate(injectUtil)
    }
    const pve = await run(client.selector.pve)

    if (client.selector.pvpTab) {
      await page.evaluate((s) => Q(s.pvpTab)[0].click(), client.selector)
      await page.waitForNavigation()
      await page.evaluate(injectUtil)
    }
    const pvp = await run(client.selector.pvp)

    return { pve, pvp }
  } catch (err) {
    throw err
  } finally {
    await page.close()
  }
}

module.exports = async function parse(client) {
  const browser = await puppeteer.launch({ defaultViewport })

  try {
    console.info(`[${client.name}]`, 'parsing jobs...')

    const jobs = await parseJobs(browser, client).then((jobs) => jobs.filter((job) => !job.link.includes('bluemage')))

    console.info(`[${client.name}]`, 'fetched jobs:', jobs.map((job) => job.name).join(', '))

    const result = await Promise.all(
      jobs.map(async (job) => {
        const name = job.name.replace(/（.+）$/, '')
        const id = job.link.split('/').filter((s) => s)[1]

        const skills = await parseSkills(browser, client, job.link)
        console.info(`[${client.name}]`, 'fetched job:', id, '/', name)

        return { name, id, ...names[id], skills }
      })
    )

    return result
  } catch (err) {
    throw err
  } finally {
    await browser.close()
  }
}
