import logger from '../../../../core/winston/index.js'
import {
    basicSetter,
    setGuildDefault,
} from '../../../../core/user/index.js'
import {COMMANDS_NAME} from '../../index.js'
import {checkCreateUserDiscord} from '../../../user/index.js'

/**
 * Update for this user the channel grant multiplier
 * @param multiplier - multiplier apply to this role
 * @param channel - Discord channel id (if undefined = apply to default)
 * @param userUuid - User unique identifier
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelMultiplier = async (multiplier, channel, userUuid, guildUuid, db, mutex) => basicSetter(
    userUuid,
    guildUuid,
    async () => multiplier >= 0,
    (user) => {
        if (channel)
            user.config.channelGrantMultipliers[channel] = multiplier
        else
            user.config.channelGrantMultipliers['default'] = multiplier
        return user
    }, db, mutex)

/**
 * Update for this user the reaction grant quantity
 * @param grant - How much reputation will be granted when react with this emoji
 * @param reaction - if custom emoji use Discord emoji id or simple the emoji char (if undefined = apply to default)
 * @param userUuid - User unique identifier
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionGrant = async (grant, reaction, userUuid, guildUuid, db, mutex) => basicSetter(
    userUuid,
    guildUuid,
    async () => grant >= 0,
    (user) => {
        if (reaction){
            const regex = /<:(.*):\d+>|(.)/gm
            let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
            user.config.reactionGrants[emoji] = grant
        }
        else
            user.config.reactionGrants['default'] = grant
        return user
    }, db, mutex)

/**
 * Update for this user the reply grant quantity
 * @param grant - How much reputation will be granted when reply
 * @param userUuid - User unique identifier
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReplyGrant = async (grant, userUuid, guildUuid, db, mutex) => basicSetter(
    userUuid,
    guildUuid,
    async () => grant >= 0,
    (user) => {
        user.config.replyGrant = grant
        return user
    }, db, mutex)

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const configUser = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.USER.name) return false

        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.USER.CONFIG.name)?.options

        if (!options) return false

        if (!guildUuid) return true

        let user = null
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create author command...')
            user = await checkCreateUserDiscord(interaction.member.id, db?.data[guildUuid], interaction?.guild)
            if (!user) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...user}
            logger.debug('Retrieve or create author command done.')

            await db.write()
        })
        if (!user) {
            logger.error('Failed to create author command.')
            return true
        }

        const userUuid = Object.keys(user)[0]
        if (!userUuid) {
            logger.error('Failed to create author command.')
            return true
        }

        let response = ''


        const isApplyGuildDefault = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.APPLY_GUILD_DEFAULT.name)?.value
        if (isApplyGuildDefault)
            if(!await setGuildDefault(userUuid, guildUuid, db, mutex))
                response += ''

        const channelMultiplier = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.CHANNEL_MULTIPLIER.name)?.value
        const channel = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.CHANNEL.name)?.value
        if (typeof channelMultiplier === 'number')
            if(!await setChannelMultiplier(channelMultiplier, channel, userUuid, guildUuid, db, mutex))
                response += 'Grant multiplier for this channel need to be >= 0\n'

        const reactionGrant = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.REACTION_GRANT.name)?.value
        const reaction = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.REACTION.name)?.value
        if (typeof reactionGrant === 'number')
            if(!await setReactionGrant(reactionGrant, reaction, userUuid, guildUuid, db, mutex))
                response += 'How much will be granted per reaction need to be >= 0\n'

        const replyGrant = options?.find(o => o?.name === COMMANDS_NAME.USER.CONFIG.REPLY_GRANT.name)?.value
        if (replyGrant)
            if(!await setReplyGrant(replyGrant, userUuid, guildUuid, db, mutex))
                response += 'How much will be granted per reply need to be >= 0\n'

        await interaction
            ?.reply({content: response || 'Done !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}