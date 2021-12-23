import {Permissions} from 'discord.js'
import {v4 as uuidv4} from 'uuid'
import logger from '../../../../core/winston/index.js'
import {
    basicSetter,
    setDefaultReputation,
    setDuration, setMaxReputationDecay,
    setMinReputationDecay
} from '../../../../core/guild/index.js'
import {addRemoveReputationRole} from '../../../reputation/reputationRole/index.js'
import {COMMANDS_NAME} from '../../index.js'
import {makeGuild} from '../../../../core/index.js'
import {makeDiscord} from '../../../data/index.js'


/**
 * Update the admin role
 * @param adminRole - Discord role Id
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setAdminRole = async (adminRole, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    () => true,
    (guildDb) => {
        guildDb.config.adminRole = adminRole
        return guildDb
    }, db, mutex)

/**
 * Update the captcha role
 * @param captchaRole - Discord role Id
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setCaptchaRole = async (captchaRole, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    () => true,
    (guildDb) => {
        guildDb.config.captchaRole = captchaRole
        return guildDb
    }, db, mutex)

/**
 * Update the guild discord matching quantity
 * @param matching - The matching quantity
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMatchingDiscord = async (matching, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => matching >= 0,
    (guildDb) => {
        guildDb.config.discordMatching = matching
        return guildDb
    }, db, mutex)

/**
 * Update the guild role power multiplier for QR
 * @param multiplier - multiplier apply to this role
 * @param role - Discord role id (if undefined = apply to default)
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setRolePower = async (multiplier, role, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => multiplier >= 0,
    (guildDb) => {
        if (role)
            guildDb.config.rolePowerMultipliers[role] = multiplier
        else
            guildDb.config.rolePowerMultipliers['default'] = multiplier
        return guildDb
    }, db, mutex)

/**
 * Update the guild channel grant multiplier
 * @param multiplier - multiplier apply to this role
 * @param channel - Discord channel id (if undefined = apply to default)
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelMultiplier = async (multiplier, channel, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => multiplier >= 0,
    (guildDb) => {
        if (channel)
            guildDb.config.channelGrantMultipliers[channel] = multiplier
        else
            guildDb.config.channelGrantMultipliers['default'] = multiplier
        return guildDb
    }, db, mutex)

/**
 * Update the guild reaction grant quantity
 * @param grant - How much reputation will be granted when react with this emoji
 * @param reaction - if custom emoji use Discord emoji id or simple the emoji char (if undefined = apply to default)
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionGrant = async (grant, reaction, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => grant >= 0,
    (guildDb) => {
        if (reaction){
            const regex = /<:(.*):\d+>|(.)/gm
            let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
            guildDb.config.reactionGrants[emoji] = grant
        }
        else
            guildDb.config.reactionGrants['default'] = grant
        return guildDb
    }, db, mutex)

/**
 * Update the guild reply grant quantity
 * @param grant - How much reputation will be granted when reply
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReplyGrant = async (grant, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => grant >= 0,
    (guildDb) => {
        guildDb.config.replyGrant = grant
        return guildDb
    }, db, mutex)


/**
 * Update the guild channel pantheon
 * @param enable - Enable pantheon for this channel
 * @param channel - Discord channel id (if undefined = apply to default)
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelPantheon = async (enable, channel, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => true,
    (guildDb) => {
        guildDb.config.channelPantheons[channel] = enable
        return guildDb
    }, db, mutex)

/**
 * Update add/remove role when react to a message
 * @param message - The url of message to react
 * @param reaction - Reaction that will trigger the add/remove role
 * @param role - Which role to add/remove
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionRole = async (message, reaction, role, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => {
        const regex = /<:(.*):\d+>|(.)/gm
        let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
        if (message.startsWith('https://discord.com/channels/') && emoji) return true

        return false
    },
    (guildDb) => {
        let messageId = message.split('/')
        messageId = messageId[messageId.length - 1]
        if (!messageId) return guildDb

        const regex = /<:(.*):\d+>|(.)/gm
        let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
        guildDb.reactionRoles[messageId] = {[emoji]: role}

        return guildDb
    }, db, mutex)

/**
 * Update add/remove role based on reputation earned
 * @param role - Role to add/remove
 * @param min - How much reputation needed, if not provided remove role
 * @param guildUuid - Guild unique identifier
 * @param client - Discord client
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReputationRole = async (role, min, guildUuid, client, db, mutex) => basicSetter(
    guildUuid,
    async () => role,
    async (guildDb) => {
        if (typeof min === 'number')
            guildDb.reputationRoles[role] = min
        else
            delete guildDb.reputationRoles[role]
        await addRemoveReputationRole(typeof min === 'number', guildDb.users, guildDb.reputationRoles, db.data[guildUuid]?.guildDiscordId, {client})
        return guildDb
    }, db, mutex)

/**
 * Update how much reputation is required to transfer a message
 * @param reputation - How much reputation
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionTransferReputation = async (reputation, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => typeof reputation === 'number',
    async (guildDb) => {
        guildDb.config.minReputationTransfer = reputation
        return guildDb
    }, db, mutex)

/**
 * Update which reaction will transfer to which channel
 * @param reaction - Reaction that will trigger the transfer
 * @param channel - Where to transfer
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionTransfer = async (reaction, channel, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => reaction,
    async (guildDb) => {
        if (channel)
            guildDb.reactionTransfers[reaction] = channel
        else
            delete guildDb.reactionTransfers[reaction]
        return guildDb
    }, db, mutex)

/**
 * Update the min reputation to start a proposal
 * @param reputation - how much reputation
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMinReputationStartProposal = async (reputation, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => typeof reputation === 'number',
    async (guildDb) => {
        guildDb.config.minReputationToStartProposal = reputation
        return guildDb
    }, db, mutex)

/**
 * Update the min reputation to accept the vote of a proposal
 * @param reputation - how much reputation
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMinReputationConfirmProposal = async (reputation, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => typeof reputation === 'number',
    async (guildDb) => {
        guildDb.config.minReputationToConfirmProposal = reputation
        return guildDb
    }, db, mutex)

/**
 * Update the channel where to post the proposal
 * @param channel - Channel to post
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelProposal = async (channel, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => !!channel,
    (guildDb) => {
        guildDb.config.channelProposal = channel
        return guildDb
    }, db, mutex)

/**
 * Update the min reputation to mute someone
 * @param reputation - how much reputation
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMinReputationMute = async (reputation, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => typeof reputation === 'number',
    async (guildDb) => {
        guildDb.config.minReputationToMute = reputation
        return guildDb
    }, db, mutex)

/**
 * Initialize the guild
 * @param guildDiscordId - Guild discord id
 * @param db - in-memory database
 * @param mutex - mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const initGuild = async (guildDiscordId, db, mutex) => {
    try {
        const guildUuid = uuidv4()

        await mutex.runExclusive(async () => {
            await db.read()
            db.data[guildUuid] = makeGuild(makeDiscord.makeGuild(guildDiscordId))
            await db.write()
        })

        return true
    } catch (e) {
        logger.error(e)
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const configGuild = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.GUILD.name) return false

        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.GUILD.CONFIG.name)?.options
        const options2 = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.GUILD.CONFIG_2.name)?.options

        if (!options && !options2) return false

        let isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)

        if (!guildUuid) {
            if (!isAdmin) return true
            await initGuild(interaction?.guildId, db, mutex)
            await db.read()

            guildUuid = Object.keys(db?.data)
                ?.find(uuid => db?.data[uuid]?.guildDiscordId === interaction?.guildId)
            if (!guildUuid) return true
        }

        isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            || interaction.member.roles.cache.has(db.data[guildUuid]?.config?.adminRole)
        if (!isAdmin) return true

        let response = ''

        const adminRole = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.ADMIN_ROLE.name)?.value
        if (adminRole)
            if(!await setAdminRole(adminRole, guildUuid, db, mutex))
                response += ''

        const captchaRole = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.CAPTCHA_ROLE.name)?.value
        if (captchaRole)
            if(!await setCaptchaRole(captchaRole, guildUuid, db, mutex))
                response += ''

        const defaultReputation = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.DEFAULT_REPUTATION.name)?.value
        if (typeof defaultReputation === 'number')
            if(!await setDefaultReputation(defaultReputation, guildUuid, db, mutex))
                response += 'How much will receive a new user need to be >= 0\n'

        const discordMatching = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.DISCORD_MATCHING.name)?.value
        if (typeof discordMatching === 'number')
            if(!await setMatchingDiscord(discordMatching, guildUuid, db, mutex))
                response += 'Default reputation for Quadratic funding, need to be >= 0\n'

        const duration = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.DURATION.name)?.value
        if (typeof duration === 'number')
            if(!await setDuration(duration, guildUuid, db, mutex))
                response += 'Duration of each round in days need to be > 0\n'

        const minDecay = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.MIN_DECAY.name)?.value
        if (typeof minDecay === 'number')
            if(!await setMinReputationDecay(minDecay, guildUuid, db, mutex))
                response += 'Min reputation decay in percent at each round(eg: 0.01) need to be >= 0 and =< 1 and <= max decay\n'

        const maxDecay = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.MAX_DECAY.name)?.value
        if (typeof maxDecay === 'number')
            if(!await setMaxReputationDecay(maxDecay, guildUuid, db, mutex))
                response += 'Max reputation decay in percent at each round(eg: 0.01) need to be >= 0 and =< 1 and >= min decay\n'

        const roleMultiplier = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.ROLE_MULTIPLIER.name)?.value
        const role = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.ROLE.name)?.value
        if (typeof roleMultiplier === 'number')
            if(!await setRolePower(roleMultiplier, role, guildUuid, db, mutex))
                response += 'Power multiplier for this role need to be >= 0\n'

        const channelMultiplier = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.CHANNEL_MULTIPLIER.name)?.value
        const channel = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.CHANNEL.name)?.value
        if (typeof channelMultiplier === 'number')
            if(!await setChannelMultiplier(channelMultiplier, channel, guildUuid, db, mutex))
                response += 'Grant multiplier for this channel need to be >= 0\n'

        const reactionGrant = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_GRANT.name)?.value
        const reaction = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION.name)?.value
        if (typeof reactionGrant === 'number')
            if(!await setReactionGrant(reactionGrant, reaction, guildUuid, db, mutex))
                response += 'How much will be granted per reaction need to be >= 0\n'

        const replyGrant = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REPLY_GRANT.name)?.value
        if (replyGrant)
            if(!await setReplyGrant(replyGrant, guildUuid, db, mutex))
                response += 'How much will be granted per reply need to be >= 0\n'

        const channelPantheonEnable = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.CHANNEL_PANTHEON_ENABLE.name)?.value
        const channelPantheon = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.CHANNEL_PANTHEON.name)?.value
        if (channelPantheon)
            if(!await setChannelPantheon(channelPantheonEnable, channelPantheon, guildUuid, db, mutex))
                response += 'Set pantheon failed.'

        const reactionRoleMessage = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_MESSAGE.name)?.value
        const reactionRoleReaction = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_REACTION.name)?.value
        const reactionRoleRole = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_ROLE.name)?.value
        if (reactionRoleMessage && reactionRoleReaction)
            if(!await setReactionRole(reactionRoleMessage, reactionRoleReaction, reactionRoleRole, guildUuid, db, mutex))
                response += 'Please provide at least a message link and an emoji(if no role = remove)'

        const reputationRoleRole = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REPUTATION_ROLE_ROLE.name)?.value
        const reputationRoleMin = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REPUTATION_ROLE_MIN.name)?.value
        if (reputationRoleRole)
            if(!await setReputationRole(reputationRoleRole, reputationRoleMin, guildUuid, interaction.client, db, mutex))
                response += 'Please provide at least a role(if no min = remove)'

        const reactionTransferReaction = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_REACTION.name)?.value
        const reactionTransferChannel = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_CHANNEL.name)?.value
        if (reactionTransferReaction)
            if(!await setReactionTransfer(reactionTransferReaction, reactionTransferChannel, guildUuid, db, mutex))
                response += 'Please provide at least a reaction(if no channel = remove)'

        const reactionTransferReputation = options?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_REPUTATION.name)?.value
        if (typeof reactionTransferReputation === 'number')
            if(!await setReactionTransferReputation(reactionTransferReputation, guildUuid, db, mutex))
                response += 'The minimum reputation to transfer a message should be a number(0 = no transfer)'

        const minReputationStartProposal = options2?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_START_PROPOSAL.name)?.value
        if (typeof minReputationStartProposal === 'number')
            if(!await setMinReputationStartProposal(minReputationStartProposal, guildUuid, db, mutex))
                response += 'The minimum reputation to start a proposal should be a number(0 = no proposal)'

        const minReputationConfirmProposal = options2?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_CONFIRM_PROPOSAL.name)?.value
        if (typeof minReputationConfirmProposal === 'number')
            if(!await setMinReputationConfirmProposal(minReputationConfirmProposal, guildUuid, db, mutex))
                response += 'The minimum reputation to accept a proposal should be a number(0 = no proposal)'

        const minReputationMute = options2?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_MUTE.name)?.value
        if (typeof minReputationMute === 'number')
            if(!await setMinReputationMute(minReputationMute, guildUuid, db, mutex))
                response += 'The minimum reputation to mute should be a number(0 = no mute)'

        const channelProposal = options2?.find(o => o?.name === COMMANDS_NAME.GUILD.CONFIG_2.CHANNEL_PROPOSAL.name)?.value
        if (channelProposal)
            if(!await setChannelProposal(channelProposal, guildUuid, db, mutex))
                response += 'Where to post the proposal'

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