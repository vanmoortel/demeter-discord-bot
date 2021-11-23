import logger from "./service/winston/index.js"
import createClient from "./service/discord/index.js"
import {Mutex} from "async-mutex"
import connectWallet, {loadDb} from "./service/aleph/index.js"
import createIPFS from "./service/ipfs/index.js"
import createDb from "./service/lowdb/index.js"

(async () => {
    // Mutex will be used to prevent concurrent modification on aleph,
    // it's slow inefficient BUT good enough for this use-case
    const mutex = new Mutex()

    // Wallet with some ALEPH token to save your database
    const wallet = await connectWallet()

    // IPFS node to save DB(I dont use ALEPH directly due to issue with file size)
    const ipfs = await createIPFS()

    const db = await createDb();

    await loadDb(wallet, db, mutex, ipfs)

    // Discord.js client
    const clientDiscord = createClient(
        undefined,
        undefined,
        undefined,
        () => logger.info('Connected'),
        () => logger.info('blip'),
        undefined)
})()