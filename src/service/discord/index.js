import {Intents, Client} from "discord.js"
import logger from "../winston/index.js"

/**
 * Get discord client
 * @param discordToken - https://discord.com/developers/docs/intro
 * @param flags - https://discord.com/developers/docs/topics/gateway#list-of-intents
 * @param onError - function callback
 * @param onDebug - function callback
 * @param onReady - function callback
 * @param onMessageCreate - function callback trigger when a new message is sent(!!! all servers)
 * @param onMessageReactionAdd - function callback trigger when a reaction is add to a message(!!! all servers)
 * @returns {null|Client}
 */
const createClient = (
    discordToken=process.env.DISCORD_TOKEN,
    flags= Intents.FLAGS,
    onError = logger.error,
    onReady = () => {},
    onMessageCreate = () => {},
    onMessageReactionAdd = () => {},
    ) => {
    try {
        const _client = new Client({intents: [...Object.values(flags)]})

        _client.on('error', onError)
        _client.on('ready', onReady)
        _client.on('messageCreate', onMessageCreate)
        _client.on('messageReactionAdd', onMessageReactionAdd)

        logger.info('Try to connect discord API...')
        _client.login(discordToken).catch(logger.error)
        logger.info('Try to connect discord API done.')

        return _client
    }catch (e) {
        logger.error(e)
        return null
    }
}

export default createClient