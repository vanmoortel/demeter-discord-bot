import createClient from "./service/discord/index.js"
import {Mutex} from "async-mutex"
import connectWallet, {loadDb, persistDb} from "./service/aleph/index.js"
import createDb from "./service/lowdb/index.js"
import createHeartBeat from "./service/heartbeats/index.js"
import {checkWhenNewGuild, checkWhenReady, onMessageCreate} from "./service/discord/service/index.js";
import processCommand from "./service/discord/service/command/index.js";

(async () => {
    // Mutex will be used to prevent concurrent modification on aleph,
    // it's slow inefficient BUT good enough for this use-case
    const mutex = new Mutex()

    // Wallet with some ALEPH token to save your database
    const wallet = await connectWallet()

    const db = await createDb();

    // Load last saved Database
    await loadDb(wallet, db, mutex)

    // Discord.js client
    const clientDiscord = await createClient(
        undefined,
        undefined,
        undefined,
        async (client) => await checkWhenReady(client),
        (message) => onMessageCreate(message, clientDiscord, db, mutex),
        undefined,
        (interaction) => processCommand(interaction, db, mutex),
        async (guild) => await checkWhenNewGuild(guild),)


    const heartbeat = createHeartBeat(undefined, undefined, [{modulo: 1, func: async () => await persistDb(wallet, db, mutex)}])

})()