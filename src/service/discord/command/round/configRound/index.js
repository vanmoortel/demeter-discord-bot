import logger from '../../../../core/winston/index.js'
import {
    basicSetter,
    setDefaultReputation,
    setDuration, setGuildDefault, setMaxReputationDecay,
    setMinReputationDecay
} from '../../../../core/round/index.js'
import {COMMANDS_NAME} from '../../index.js'

/**
 * Update for this round the discord matching quantity
 * @param matching - The matching quantity
 * @param roundId - Round array position
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMatchingDiscord = async (matching, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => matching >= 0,
    (round) => {
        round.config.discordMatching = matching
        return round
    }, db, mutex)

/**
 * Update for this round the role power multiplier for QR
 * @param multiplier - multiplier apply to this role
 * @param role - Discord role id (if undefined = apply to default)
 * @param roundId - Round array position
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setRolePower = async (multiplier, role, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => multiplier >= 0,
    (round) => {
        if (role)
            round.config.rolePowerMultipliers[role] = multiplier
        else
            round.config.rolePowerMultipliers['default'] = multiplier
        return round
    }, db, mutex)

/**
 * Update for this round the channel grant multiplier
 * @param multiplier - multiplier apply to this role
 * @param channel - Discord channel id (if undefined = apply to default)
 * @param roundId - Round array position
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelMultiplier = async (multiplier, channel, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => multiplier >= 0,
    (round) => {
        if (channel)
            round.config.channelGrantMultipliers[channel] = multiplier
        else
            round.config.channelGrantMultipliers['default'] = multiplier
        return round
    }, db, mutex)

/**
 * Update for this round the reaction grant quantity
 * @param grant - How much reputation will be granted when react with this emoji
 * @param reaction - if custom emoji use Discord emoji id or simple the emoji char (if undefined = apply to default)
 * @param roundId - Round array position
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionGrant = async (grant, reaction, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => grant >= 0,
    (round) => {
        if (reaction){
            const regex = /<:(.*):\d+>|(.)/gm
            let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
            round.config.reactionGrants[emoji] = grant
        }
        else
            round.config.reactionGrants['default'] = grant
        return round
    }, db, mutex)

/**
 * Update for this round the reply grant quantity
 * @param grant - How much reputation will be granted when reply
 * @param roundId - Round array position
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReplyGrant = async (grant, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => grant >= 0,
    (reaction) => {
        reaction.config.replyGrant = grant
        return reaction
    }, db, mutex)

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const configRound = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.ROUND.CONFIG.name)?.options
        if (!options) return false

        const shift = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.ROUND_SHIFT.name)?.value
        if (typeof shift !== 'number' || db?.data[guildUuid]?.rounds.length <= shift) return true
        const roundId = db?.data[guildUuid]?.rounds?.length - shift - 1

        let response = ''


        const isApplyGuildDefault = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.APPLY_GUILD_DEFAULT.name)?.value
        if (isApplyGuildDefault)
            if(!await setGuildDefault(roundId, guildUuid, db, mutex))
                response += ''

        const defaultReputation = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.DEFAULT_REPUTATION.name)?.value
        if (typeof defaultReputation === 'number')
            if(!await setDefaultReputation(defaultReputation, roundId, guildUuid, db, mutex))
                response += 'How much will receive a new user need to be >= 0\n'

        const discordMatching = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.DISCORD_MATCHING.name)?.value
        if (typeof discordMatching === 'number')
            if(!await setMatchingDiscord(discordMatching, roundId, guildUuid, db, mutex))
                response += 'Default reputation for Quadratic funding, need to be >= 0\n'

        const duration = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.DURATION.name)?.value
        if (typeof duration === 'number')
            if(!await setDuration(duration, roundId, guildUuid, db, mutex))
                response += 'Duration of each round in days need to be > 0\n'

        const minDecay = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.MIN_DECAY.name)?.value
        if (typeof minDecay === 'number')
            if(!await setMinReputationDecay(minDecay, roundId, guildUuid, db, mutex))
                response += 'Min reputation decay in percent at each round(eg: 0.01) need to be >= 0 and =< 1 and <= max decay\n'

        const maxDecay = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.MAX_DECAY.name)?.value
        if (typeof maxDecay === 'number')
            if(!await setMaxReputationDecay(maxDecay, roundId, guildUuid, db, mutex))
                response += 'Max reputation decay in percent at each round(eg: 0.01) need to be >= 0 and =< 1 and >= min decay\n'

        const roleMultiplier = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.ROLE_MULTIPLIER.name)?.value
        const role = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.ROLE.name)?.value
        if (typeof roleMultiplier === 'number')
            if(!await setRolePower(roleMultiplier, role, roundId, guildUuid, db, mutex))
                response += 'Power multiplier for this role need to be >= 0\n'

        const channelMultiplier = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.CHANNEL_MULTIPLIER.name)?.value
        const channel = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.CHANNEL.name)?.value
        if (typeof channelMultiplier === 'number')
            if(!await setChannelMultiplier(channelMultiplier, channel, roundId, guildUuid, db, mutex))
                response += 'Grant multiplier for this channel need to be >= 0\n'

        const reactionGrant = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.REACTION_GRANT.name)?.value
        const reaction = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.REACTION.name)?.value
        if (typeof reactionGrant === 'number')
            if(!await setReactionGrant(reactionGrant, reaction, roundId, guildUuid, db, mutex))
                response += 'How much will be granted per reaction need to be >= 0\n'

        const replyGrant = options?.find(o => o?.name === COMMANDS_NAME.ROUND.CONFIG.REPLY_GRANT.name)?.value
        if (replyGrant)
            if(!await setReplyGrant(replyGrant, roundId, guildUuid, db, mutex))
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