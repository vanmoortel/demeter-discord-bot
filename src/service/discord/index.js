import {Intents, Client} from "discord.js"
import logger from "../winston/index.js"

/**
 * Get discord client
 * @param discordToken - https://discord.com/developers/docs/intro
 * @param flags - https://discord.com/developers/docs/topics/gateway#list-of-intents
 * @param onError - function callback
 * @param onReady - function callback
 * @param onMessageCreate - function callback trigger when a new message is sent(!!! all servers)
 * @param onMessageReactionAdd - function callback trigger when a reaction is add to a message(!!! all servers)
 * @param onInteractionCreate - function callback trigger when an interaction is made with the bot(slash command or button)
 * @param onGuildCreate - function callback trigger when the bot join a new guild
 * @returns {null|Client}
 */
const createClient = async (
    discordToken=process.env.DISCORD_TOKEN,
    flags= Intents.FLAGS,
    onError = logger.error,
    onReady = () => {},
    onMessageCreate = () => {},
    onMessageReactionAdd = () => {},
    onInteractionCreate = () => {},
    onGuildCreate = () => {},
    ) => {
    try {
        const _client = new Client({intents: [...Object.values(flags)]})

        _client.on('error', onError)
        _client.on('ready', onReady)
        _client.on('messageCreate', onMessageCreate)
        _client.on('messageReactionAdd', onMessageReactionAdd)
        _client.on('interactionCreate', onInteractionCreate)
        _client.on('guildCreate', onGuildCreate)

        logger.info('Try to connect discord API...')
        await _client.login(discordToken).catch(logger.error)
        logger.info('Try to connect discord API done.')

        return _client
    }catch (e) {
        logger.error(e)
        return null
    }
}

export default createClient