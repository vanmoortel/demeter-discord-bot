import logger from "../../winston/index.js";
import {createCommand} from "./command/index.js";

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
        if (message.author.id === client.user.id || message.channelType === 'DM') return true;

    } catch (e) {
        logger.error(e)
    }
}

/**
 * Trigger when the client is ready
 * @param client - Discord client
 * @returns {Promise<void>}
 */
export const checkWhenReady = async (client) => {
    try {
        const guilds = await client.guilds.cache

        await guilds.each(async (val, key) => await createCommand(client, key))

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