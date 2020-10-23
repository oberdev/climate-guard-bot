import { Telegraf } from 'telegraf'
import * as dotenv from 'dotenv'
import { inputs } from './stages/inputs'
import { moveToScene } from './utils'
import { AUTH } from './stages/inputs/auth'
import TelegrafSession from 'telegraf-session-local'
import chalk from 'chalk'
import updateLogger from 'telegraf-update-logger'
import { BotContext } from './interfaces/bot'
import { securedMenuMiddleware } from './menus'
dotenv.config()
export const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN)
export const telegram = bot.telegram

const start = Telegraf.optional<BotContext>(ctx => !ctx.session.api, async (ctx) => await moveToScene(AUTH)(ctx, '/'))
const stop = Telegraf.optional<BotContext>(ctx => !!ctx.session.api, async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.session.menuMessageId)
  } catch (e) {
    console.log(e)
  }
  ctx.session = {}
  await ctx.reply('Пока')
})

const localSession = new TelegrafSession({
  database: 'persist/sessions.json'
})

bot.use(
  updateLogger({
    colors: {
      id: chalk.white,
      chat: chalk.yellow,
      user: chalk.green,
      type: chalk.bold
    }
  })
)

bot.use(localSession.middleware())
bot.use(inputs.middleware())
bot.use(securedMenuMiddleware)

bot.start(start)
bot.command('stop', stop)

bot.catch((e) => {
  console.log(e)
})
