const globals = [
  ['en', 'na', 'English'],
  ['ja', 'jp', '日本語'],
  ['de', 'de', 'Deutsch'],
  ['fr', 'fr', 'Français'],
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
      skillEffect: 'td.content',
    },
  })),

  {
    name: 'ko',
    language: '한국어',
    baseURL: 'https://guide.ff14.co.kr',
    endpoint: '/job',

    selector: {
      job: '#left_job_0_0 ul.depth4 li a',
      pveTab: 'ul.tab_type2 li:nth-child(1) a',
      pve: 'div.on article.job_cont',
      pvpTab: 'ul.tab_type2 li:nth-child(2) a',
      pvp: 'div.on article.job_cont',
      skill: '.base_tb tbody tr[id]',
      skillIcon: 'td:first-child span.job_icon img',
      skillName: 'td:first-child span.job_skill_title',
      skillNameFallback: 'td:first-child',
      skillEffect: 'td:last-child',
    },
  },
]
