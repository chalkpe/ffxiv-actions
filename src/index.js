const fs = require('fs')
const mkdirp = require('mkdirp')
const parse = require('./parser')

const servers = [
  {
    name: 'global',
    baseURL: 'https://na.finalfantasyxiv.com',
    endpoint: '/jobguide/battle',

    selector: {
      job: '.jobguide__content ul a',
      pve: '.job__content.job__content--battle',
      pvp: '.job__content.job__content--pvp',
      skill: 'tbody.job__tbody tr',
      skillIcon: 'td.skill .skill__wrapper__icon img',
      skillName: 'td.skill p strong',
      skillEffect: 'td.content'
    }
  },

  {
    name: 'korea',
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

function formatJob (job) {
  return job.skills[0].map(skill =>
    [job.name, skill.name, skill.icon].join()).join('\n')
}

function save (path, ext, data) {
  const text = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2)

  mkdirp.sync('build')
  fs.writeFileSync(`build/${path}.${ext}`, text)
}

async function main () {
  for (let server of servers) {
    try {
      const data = await parse(server)
      const small = data.map(formatJob).join('\n')

      save(server.name, 'json', data)
      save(server.name, 'csv', small)

      console.log('saved', server.name)
    } catch (err) {
      console.error('failed', server.name, err)
    }
  }
}

main()
  .then(() => console.log('done'))
  .catch(err => console.error(err))