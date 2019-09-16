const fs = require('fs')
const mkdirp = require('mkdirp')
const parse = require('./parser')

const globals = [
  ['na', 'English'],
  ['jp', '日本語'],
  ['de', 'Deutsch'],
  ['fr', 'Français']
]

const clients = [
  ...globals.map(([name, language]) => ({
    name,
    language,
    baseURL: `https://${name}.finalfantasyxiv.com`,
    endpoint: '/jobguide/battle',

    selector: {
      job: '.jobguide__content ul a',
      pve: '.job__content.job__content--battle',
      pvp: '.job__content.job__content--pvp',
      skill: 'tbody.job__tbody tr[id]',
      skillIcon: 'td.skill .skill__wrapper__icon img',
      skillName: 'td.skill p strong',
      skillEffect: 'td.content'
    }
  })),

  {
    name: 'kr',
    language: '한국어',
    baseURL: 'https://guide.ff14.co.kr',
    endpoint: '/job',

    selector: {
      job: '.job_box ul a',
      pve: '.job_cont.pve',
      pvp: '.job_cont.pvp',
      skill: 'tbody tr',
      skillIcon: 'td:first-child span.job_icon img',
      skillName: 'td:first-child span.job_skill_title',
      skillNameFallback: 'td:first-child',
      skillEffect: 'td:last-child'
    }
  }
]

const names = {
  paladin:     {code: '13', short: 'pld'},
  monk:        {code: '14', short: 'mnk'},
  warrior:     {code: '15', short: 'war'},
  dragoon:     {code: '16', short: 'drg'},
  bard:        {code: '17', short: 'brd'},
  whitemage:   {code: '18', short: 'whm'},
  blackmage:   {code: '19', short: 'blm'},
  summoner:    {code: '1b', short: 'smn'},
  scholar:     {code: '1c', short: 'sch'},
  ninja:       {code: '1e', short: 'nin'},
  machinist:   {code: '1f', short: 'mch'},
  darkknight:  {code: '20', short: 'drk'},
  astrologian: {code: '21', short: 'ast'},
  samurai:     {code: '22', short: 'sam'},
  redmage:     {code: '23', short: 'rdm'},
  gunbreaker:  {code: '25', short: 'gnb'},
  dancer:      {code: '26', short: 'dnc'}
}

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
      console.log('saved', client.name)
    } catch (err) {
      console.error('failed', client.name, err)
    }
  }

  save('ffxiv', 'json', ffxiv)
}

main()
  .then(() => console.log('done'))
  .catch(err => console.error(err))