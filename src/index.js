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

async function main () {
  for (let server of servers) {
    mkdirp.sync('build')
    fs.writeFileSync(`build/${server.name}.json`, JSON.stringify(await parse(server), null, 2))
    console.log(`saved ${server.name}`)
  }
}

main()
  .then(() => console.log('done'))
  .catch(err => console.error(err))