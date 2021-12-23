import {v4 as uuidv4} from 'uuid'
import logger from '../../core/winston/index.js'
import {makeDiscord} from '../data/index.js'
import {createUser} from '../../core/user/index.js'

/**
 * Create user discord
 * @param discordId - User discord Id
 * @param guild - Discord Guild
 * @returns {Promise<{discordId: string, displayName: string}|null>}
 */
export const createUserDiscord = async ({discordId, guild}) => {
    try {
        logger.debug('Create new discord user...')
        const member = await guild?.members
            ?.fetch(discordId)
            ?.catch(() => null)
        if (!member) return null
        logger.debug('Create new discord user done.')

        return makeDiscord.makeUser(member.id, member.displayName)
    } catch (e) {
        logger.error(e)
        return null
    }
}

/**
 * Find the user UUID by his User Discord Id
 * @param discordId - User discord id
 * @param users - List of User in DB
 * @returns {string|undefined}
 */
export const findUserUuidByDiscordId = (discordId, users) => Object.keys(users)
    .find(u => users[u]?.discordId === discordId)

/**
 * Check with user discord id if a user already exist or create a new one if not
 * @param discordId - User discord id
 * @param guildDb - Database of this guild
 * @param guild - Discord guild
 * @returns {Promise<{[p: string]: User}|null>}
 */
export const checkCreateUserDiscord = async (discordId, guildDb, guild) => {
    try {
        logger.debug('Check if user already exist...')
        let uuid = findUserUuidByDiscordId(discordId, guildDb?.users)
        const roundLength = guildDb?.rounds?.length
        if (uuid) return {[uuid]: guildDb?.users[uuid]}
        logger.debug('Check if user already exist done.')

        logger.debug('Create Discord user...')
        uuid = uuidv4()
        const user = await createUser(guildDb?.rounds[roundLength - 1]?.config, roundLength, {discordId, guild})
        if (!user) return null
        logger.debug('Create Discord user done.')

        return {[uuid]: user}
    } catch (e) {
        logger.error(e)
        return null
    }
}