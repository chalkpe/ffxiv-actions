import { writeFileSync } from 'node:fs'
import { mkdirpSync } from 'mkdirp'
import clients, { type Client } from './clients.js'
import names from './names.js'
import parse, { type ParsedJob, type Skill, type Skills } from './parser.js'

interface Job {
  id: string
  name: Record<string, string | undefined>
  skills: Skills
}

function csv(data: ParsedJob[]): string {
  return data.map((job) => job.skills.pve.map((skill) => [job.name, skill.name, skill.icon].join()).join('\n')).join('\n')
}

function save(path: string, ext: string, data: unknown): void {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)

  mkdirpSync('build')
  writeFileSync(`build/${path}.${ext}`, text)
}

function update(list: Job[], { name: client }: Client, { id, name, skills }: ParsedJob): void {
  let item = list.find((j) => j.id === id)
  if (!item) {
    item = { id, name: { ...names[id] }, skills: { pve: [], pvp: [] } }
    list.push(item)
  }

  item.name[client] = name
  for (const pv of ['pve', 'pvp'] as const) {
    item.skills[pv].push(...skills[pv].map((s): Skill => ({ ...s, client })))
  }
}

async function main(): Promise<void> {
  const ffxiv: Job[] = []

  for (const client of clients) {
    try {
      const jobs = await parse(client)
      for (const job of jobs) {
        update(ffxiv, client, job)
      }

      save(client.name, 'json', jobs)
      save(client.name, 'csv', csv(jobs))
      console.info(`[${client.name}]`, 'saved', jobs.length, 'jobs')
    } catch (err) {
      console.error(`[${client.name}]`, 'failed', err)
    }
  }

  save('ffxiv', 'json', ffxiv)
}

main()
  .then(() => process.exit(0))
  .catch((err) => console.error(err))
