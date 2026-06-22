import puppeteer, { type Browser, type Viewport } from 'puppeteer'
import type { Client, Selector } from './clients.js'
import names from './names.js'

export interface Skill {
  name: string
  icon: string
  effect: string
  client?: string
}

export interface Skills {
  pve: Skill[]
  pvp: Skill[]
}

export interface JobLink {
  name: string
  link: string
}

export interface ParsedJob {
  name: string
  id: string
  code?: string
  short?: string
  skills: Skills
}

const defaultViewport: Viewport = { width: 1920, height: 1080 }

const injectUtil = (): void => {
  window.Q = ((a: string | ParentNode, b?: string) =>
    b !== undefined ? (a as ParentNode).querySelector(b) : [...document.querySelectorAll(a as string)]) as unknown as typeof window.Q

  window.textNode = (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim()

  window.markupNode = (n) => n.nodeName !== 'DIV' && (((n as Element).outerHTML || n.nodeValue) ?? '').trim()

  window.text = (e) => (e ? ([...e.childNodes].find(window.textNode)?.textContent ?? '').trim() : '')

  window.effect = (e) =>
    e
      ? [...e.childNodes]
          .map(window.markupNode)
          .filter((n): n is string => Boolean(n))
          .join('')
      : ''

  window.link = (e) => {
    if (!e) return ''
    const attr = e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href') ?? ''
    return attr.replace(/^\/\//, 'https://')
  }
}

const newPage = async (browser: Browser, path: string) => {
  const page = await browser.newPage()

  await page.setRequestInterception(true)
  page.on('request', (req) => (['image', 'font', 'stylesheet'].includes(req.resourceType()) ? req.abort() : req.continue()))

  await page.goto(path, { waitUntil: 'networkidle2' })
  await page.evaluate(injectUtil)

  return page
}

async function parseJobs(browser: Browser, client: Client): Promise<JobLink[]> {
  const page = await newPage(browser, client.baseURL + client.endpoint)

  try {
    return await page.evaluate((s: Selector) => Q(s.job).map((a) => ({ name: text(a), link: link(a).toLowerCase() })), client.selector)
  } finally {
    await page.close()
  }
}

async function parseSkills(browser: Browser, client: Client, jobLink: string): Promise<Skills> {
  const page = await newPage(browser, client.baseURL + jobLink)

  try {
    const run = (p: string) =>
      page.evaluate(
        (s: Selector, p: string) =>
          Q(`${p} ${s.skill}`).map((tr) => ({
            name: (text(Q(tr, s.skillName)) || (s.skillNameFallback ? text(Q(tr, s.skillNameFallback)) : '')).replace(/\s+/g, ' '),
            icon: link(Q(tr, s.skillIcon)),
            effect: effect(Q(tr, s.skillEffect)).replace(/\s+/g, ' '),
          })),
        client.selector,
        p,
      )

    if (client.selector.pveTab) {
      await page.evaluate((s: Selector) => Q(s.pveTab as string)[0]?.click(), client.selector)
      await page.waitForNavigation()
      await page.evaluate(injectUtil)
    }
    const pve = await run(client.selector.pve)

    if (client.selector.pvpTab) {
      await page.evaluate((s: Selector) => Q(s.pvpTab as string)[0]?.click(), client.selector)
      await page.waitForNavigation()
      await page.evaluate(injectUtil)
    }
    const pvp = await run(client.selector.pvp)

    return { pve, pvp }
  } finally {
    await page.close()
  }
}

export default async function parse(client: Client): Promise<ParsedJob[]> {
  const browser = await puppeteer.launch({ defaultViewport, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  try {
    console.info(`[${client.name}]`, 'parsing jobs...')

    const jobs = await parseJobs(browser, client).then((jobs) => jobs.filter((job) => !job.link.includes('bluemage')))

    console.info(`[${client.name}]`, 'fetched jobs:', jobs.map((job) => job.name).join(', '))

    return await Promise.all(
      jobs.map(async (job): Promise<ParsedJob> => {
        const name = job.name.replace(/（.+）$/, '')
        const id = job.link.split('/').filter((s) => s)[1] ?? ''

        const skills = await parseSkills(browser, client, job.link)
        console.info(`[${client.name}]`, 'fetched job:', id, '/', name)

        return { name, id, ...names[id], skills }
      }),
    )
  } finally {
    await browser.close()
  }
}
