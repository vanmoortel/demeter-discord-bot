import {Mutex} from 'async-mutex'
import connectWallet, {loadDb, persistDb} from './service/core/aleph/index.js'
import createDb from './service/core/lowdb/index.js'
import createHeartBeat from './service/core/heartbeats/index.js'
import {checkWhenNewGuild, checkWhenReady, onMessageCreate, createClient} from './service/discord/index.js'
import processCommand from './service/discord/command/index.js'
import {checkEndRound} from './service/core/reputation/index.js'
import {processReaction} from './service/discord/reaction/index.js'
import {checkEndProposal} from './service/discord/proposal/index.js'

(async () => {
    process.env.SALT = {}
    // Mutex will be used to prevent concurrent modification on aleph,
    // it's slow inefficient BUT good enough for this use-case
    const mutex = new Mutex()

    // Wallet with some ALEPH token to save your database
    const wallet = await connectWallet()

    const db = await createDb()
    const salt = {} // Salt will be used for captcha secret

    // Load last saved Database
    await loadDb(wallet, db, mutex, undefined)

    // Discord.js client
    const clientDiscord = await createClient(
        undefined,
        undefined,
        undefined,
        async (client) => await checkWhenReady(client, Object.values(db.data).map(d => d?.guildDiscordId)),
        (message) => onMessageCreate(message, clientDiscord, db, mutex),
        async (messageReaction, user) => await processReaction(messageReaction, user, false, db, mutex),
        async (messageReaction, user) => await processReaction(messageReaction, user, true, db, mutex),
        (interaction) => processCommand(interaction, db, mutex, salt),
        async (guild) => await checkWhenNewGuild(guild),)


    const heartbeat = createHeartBeat(undefined, undefined, [
        {modulo: 1, func: async () => await persistDb(wallet, db, mutex)},
        {modulo: 60, func: async () => await checkEndRound(db, mutex, {client: clientDiscord})},
        {modulo: 15, func: async () => await checkEndProposal(db, mutex, {client: clientDiscord})},
    ])

})()