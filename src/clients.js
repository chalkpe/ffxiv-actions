
const globals = [
  ['en', 'na', 'English'],
  ['ja', 'jp', '日本語'],
  ['de', 'de', 'Deutsch'],
  ['fr', 'fr', 'Français']
]

module.exports = [
  ...globals.map(([name, url, language]) => ({
    name,
    language,
    baseURL: `https://${url}.finalfantasyxiv.com`,
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
    name: 'ko',
    language: '한국어',
    baseURL: 'https://guide.ff14.co.kr',
    endpoint: '/job',

    selector: {
      job: '.job_box ul a',
      pve: '.job_cont.pve',
      pvp: '.job_cont.pvp',
      skill: '.base_tb tbody tr[id]',
      skillIcon: 'td:first-child span.job_icon img',
      skillName: 'td:first-child span.job_skill_title',
      skillNameFallback: 'td:first-child',
      skillEffect: 'td:last-child'
    }
  }
]