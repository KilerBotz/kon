const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require('@adiwajshing/baileys')
let fs = require('fs')
let path = require('path')
let fetch = require('node-fetch')
let moment = require('moment-timezone')
let levelling = require('../lib/levelling')
let tags = {
  'rpgabsen': '𝐑𝐩𝐠 𝐀𝐛𝐬𝐞𝐧',
  'rpg': '𝐑𝐩𝐠',
  'game': '𝐆𝐚𝐦𝐞',
  'anonymous': '𝐀𝐧𝐨𝐧𝐲𝐦𝐨𝐮𝐬 𝐂𝐡𝐚𝐭',
  'serti': '𝐒𝐞𝐫𝐭𝐢𝐟𝐢𝐤𝐚𝐭',
  'downloader': '𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐫',
  'group': '𝐆𝐫𝐨𝐮𝐩',
  'owner': '𝐎𝐰𝐧𝐞𝐫',
  'info': '𝐈𝐧𝐟𝐨',
  'internet': '𝐈𝐧𝐭𝐞𝐫𝐧𝐞𝐭',
  'tools': '𝐓𝐨𝐨𝐥𝐬',
  'sticker': '𝐒𝐭𝐢𝐜𝐤𝐞𝐫',
  'premium': '𝐏𝐫𝐞𝐦𝐢𝐮𝐦',
  'xp': '𝐄𝐱𝐩',
  'maker': '𝐌𝐚𝐤𝐞𝐫',
  'jadian': '𝐉𝐚𝐝𝐢𝐚𝐧',
  'database': '𝐃𝐚𝐭𝐚𝐛𝐚𝐬𝐞',
  'lainnya': '𝐎𝐭𝐡𝐞𝐫',
}
const defaultMenu = {
  before: `
Hai, %ucapan %name! 👋
╭─ꕥ────────────ꕥ
│☄︎ *NAME* : KilersBotz
│☄︎ *OWNER* : Agus
│☄︎ *UPTIME:* : %uptime (%muptime)
│☄︎ *JAM* : %wib WIB
│☄︎ *HARI* : %week
│☄︎ *TANGGAL* : %date
╰───────────❑
╭─ꕥ「 *PROFILE* 」ꕥ
│☄︎ *Limit* : %limit
│☄︎ *Level* : %level
│☄︎ *XP* : %exp
╰──❑
%readmore`.trimStart(),
  header: '╭─ꕥ「  %category  」ꕥ',
  body: '│☄︎ %cmd %islimit %isPremium',
  footer: '╰❑\n',
  after: `*By KilersBotz*
`,
}
let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'))
    let { exp, limit, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = levelling.xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    // d.getTimeZoneOffset()
    // Offset -420 is 18.00
    // Offset    0 is  0.00
    // Offset  420 is  7.00
    const wib = moment.tz('Asia/Jakarta').format("HH:mm:ss")
    const wita = moment.tz('Asia/Makassar').format("HH:mm:ss")
    const wit = moment.tz('Asia/Jayapura').format("HH:mm:ss")
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send('uptime')
      _muptime = await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '(Ⓛ)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Ⓟ)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime, muptime,
      me: conn.getName(conn.user.jid),
      ucapan: ucapan(),
      npmname: package.name,
      npmdesc: package.description,
      version: package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: package.homepage ? package.homepage.url || package.homepage : '[unknown github url]',
      level, limit, name, weton, week, date, dateIslamic, wib, wit, wita, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    /*conn.sendHydrated(m.chat, text.trim(), 'Ⓟ premium | Ⓛ limit', null, 'https://chat.whatsapp.com/L3lV0py8tZzKtwvzLZd1Rz', 'Group Bot', '', '', [
      ['Donate', '/donasi'],
      ['Sewa Bot', '/sewa'],
      ['Owner', '/owner']
    ], m)*/
    let url = `https://telegra.ph/file/fa1e58984e645217715ed.jpg`.trim()
    let res = await fetch(url)
    let buffer = await res.buffer()
    let message = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer })
                const template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                    templateMessage: {
                        hydratedTemplate: {
                             locationMessage: { 
                             jpegThumbnail: fs.readFileSync('./media/PP.jpg') }, 
                            hydratedContentText: text.trim(),
                            hydratedFooterText:'Ⓟ premium | Ⓛ limit',
                            hydratedButtons: [{
                                urlButton: {
                                    displayText: 'Website Gw',
                                    url: 'https://www.kilers-beta.eu.org',
                                }
                            }, {
                                quickReplyButton: {
                                    displayText: 'Ping',
                                    id: '/ping'
                                }
                            }, {
                                quickReplyButton: {
                                    displayText: 'Group Bot',
                                    id: '/gcbot'
                                }
                            }, {
                                quickReplyButton: {
                                    displayText: 'Owner',
                                    id: '/owner'
                                }
                        }]
                        }
                    }
                }), { userJid: m.chat, quoted: m })
                conn.relayMessage(m.chat, template.message, { messageId: template.key.id })
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', m)
    throw e
  }
}
handler.help = ['menu']
handler.command = /^(menu|help|allmenu|\?)$/i

handler.exp = 3

module.exports = handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function ucapan() {
        const hour_now = moment.tz('Asia/Jakarta').format('HH')
        var ucapanWaktu = 'Pagi kak'
        if (hour_now >= '03' && hour_now <= '10') {
          ucapanWaktu = 'Pagi kak'
        } else if (hour_now >= '10' && hour_now <= '15') {
          ucapanWaktu = 'Siang kak'
        } else if (hour_now >= '15' && hour_now <= '17') {
          ucapanWaktu = 'Sore kak'
        } else if (hour_now >= '17' && hour_now <= '18') {
          ucapanWaktu = 'Selamat Petang kak'
        } else if (hour_now >= '18' && hour_now <= '23') {
          ucapanWaktu = 'Malam kak'
        } else {
          ucapanWaktu = 'Selamat Malam!'
        }	
        return ucapanWaktu
}