const fs = require('fs')
const mkdirp = require('mkdirp')

const names = require('./names')
const clients = require('./clients')
const parse = require('./parser')

function csv (data) {
  return data.map(job => job.skills.pve.map(skill =>
    [job.name, skill.name, skill.icon].join()).join('\n')).join('\n')
}

function save (path, ext, data) {
  const text = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2)

  mkdirp.sync('build')
  fs.writeFileSync(`build/${path}.${ext}`, text)
}

function update (list, {name: client}, {id, name, skills}) {
  let item = list.find(j => j.id === id)
  if (!item) list.push(item = { id, name: {...names[id]}, skills: { pve: [], pvp: [] } })
  
  item.name[client] = name
  !['pve', 'pvp'].forEach(pv =>
    item.skills[pv].push(...skills[pv].map(s => ({ ...s, client }))))
}

async function main () {
  const ffxiv = []

  for (const client of clients) {
    try {
      const jobs = await parse(client)
      jobs.forEach(job => update(ffxiv, client, job))

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
  .catch(err => console.error(err))