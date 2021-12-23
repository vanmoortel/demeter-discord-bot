import {Intents, Client} from 'discord.js'
import logger from '../core/winston/index.js'
import {createCommand, deleteCommands} from './command/index.js'
import {processMessage} from './message/index.js'

/**
 * Get discord client
 * @param discordToken - https://discord.com/developers/docs/intro
 * @param flags - https://discord.com/developers/docs/topics/gateway#list-of-intents
 * @param onError - function callback
 * @param onReady - function callback
 * @param onMessageCreate - function callback trigger when a new message is sent
 * @param onMessageReactionAdd - function callback trigger when a reaction is add to a message
 * @param onMessageReactionRemove - function callback trigger when a reaction is removed from a message
 * @param onInteractionCreate - function callback trigger when an interaction is made with the bot(slash command or button)
 * @param onGuildCreate - function callback trigger when the bot join a new guild
 * @returns {null|Client}
 */
export const createClient = async (
    discordToken=process.env.DISCORD_TOKEN,
    flags= Intents.FLAGS,
    onError = logger.error,
    onReady = () => {},
    onMessageCreate = () => {},
    onMessageReactionAdd = () => {},
    onMessageReactionRemove = () => {},
    onInteractionCreate = () => {},
    onGuildCreate = () => {},
    ) => {
    try {
        const _client = new Client({intents: [...Object.values(flags)], partials: ['MESSAGE', 'CHANNEL', 'REACTION'],})

        _client.on('error', onError)
        _client.on('ready', onReady)
        _client.on('messageCreate', onMessageCreate)
        _client.on('messageReactionAdd', onMessageReactionAdd)
        _client.on('messageReactionRemove', onMessageReactionRemove)
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

/**
 * Trigger when a message is submitted on any guild and channel visible by the bot
 * @param message - Discord Message
 * @param client - Discord Client
 * @param db - In-memory database
 * @param mutex - Mutex to access database
 * @returns {Promise<undefined|boolean>}
 */
export const onMessageCreate = async (message, client, db, mutex) => {
    try {
        logger.debug(`${message.guild.id}: [${message.author.username}] ${message.content}`)

        // Do nothing if a message is posted by the bot itself or in DM
        if (message.author.id === client.user.id || message.channelType === 'DM') return true

        await processMessage(message, db, mutex)

    } catch (e) {
        logger.error(e)
    }
}

/**
 * Trigger when the client is ready
 * @param client - Discord client
 * @param guildDiscordIds - List of guild discord ID in database
 * @returns {Promise<void>}
 */
export const checkWhenReady = async (client, guildDiscordIds) => {
    try {
        for (const guildDiscordId of guildDiscordIds) {
            await deleteCommands(client, guildDiscordId)
            await createCommand(client, guildDiscordId)
        }

        logger.info('Discord bot live !')
    } catch (e) {
        logger.error(e)
    }
}

/**
 * Trigger when the bot join a new guild
 * @param guild - Discord Guild
 * @returns {Promise<void>}
 */
export const checkWhenNewGuild = async (guild) => {
    try {

        await createCommand(guild.client, guild.id)

        logger.info('New Guild !')
    } catch (e) {
        logger.error(e)
    }
}