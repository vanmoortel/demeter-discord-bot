import {MessageActionRow, MessageSelectMenu} from 'discord.js'
import Moment from 'moment'
import logger from '../../../core/winston/index.js'
import {makeUserConfigFromGuildConfig} from '../../../core/index.js'
import {findUserUuidByDiscordId} from '../../user/index.js'
import {normalizeReceivedGrant, normalizeSentGrant} from '../../../core/reputation/index.js'

export const SELECT_USER_INFO = {
    customId: 'select-user-info',
    placeholder: 'Nothing selected',
}
export const SELECT_USER_INFO_OPTIONS = {
    SHOW_USER_REPUTATION: {value: 'show-user-reputation', label: '🥇 Show your reputation'},
    SHOW_USER_GRANTS: {value: 'show-user-grants', label: '👏 Show your grants sent/received'},
    SHOW_USER_CONFIG: {value: 'show-user-config', label: '⚙ Show your config'},
}

export const userInfoComponents = [new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(SELECT_USER_INFO.customId)
            .setPlaceholder(SELECT_USER_INFO.placeholder)
            .addOptions(Object.values(SELECT_USER_INFO_OPTIONS)),
    )]

/**
 * Show the user reputation and position in TOP reputation
 * @param interaction - Discord interaction
 * @param userUuid - User unique identifier
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printUserReputation = async (interaction, userUuid, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_USER_INFO_OPTIONS.SHOW_USER_REPUTATION.value)) return false

        if (!guildDb.users[userUuid]) {
            await interaction
                ?.reply({content: `You have 0 reputation...`, ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Sort user by reputation...')
        const usersKey = Object.keys(guildDb.users)
            .sort((a, b) => guildDb.users[b].reputations[guildDb.users[b].reputations.length - 1] - guildDb.users[a].reputations[guildDb.users[a].reputations.length - 1])
        logger.debug('Sort user by reputation done.')

        await interaction
            ?.reply({
                content: `You have **${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(guildDb.users[userUuid].reputations[guildDb.users[userUuid].reputations.length - 1])} reputations** (only ${usersKey.findIndex(u => u === userUuid)} members have more reputations)`,
                ephemeral: true
            })
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

/**
 * Print user grants
 * @param interaction - Discord interaction
 * @param userUuid - User unique identifier
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printUserGrants = async (interaction, userUuid, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_USER_INFO_OPTIONS.SHOW_USER_GRANTS.value)) return false

        const round = guildDb.rounds[guildDb.rounds.length - 1]

        logger.debug('Get user...')
        if (!userUuid) {
            await interaction
                ?.reply({
                    content:
                        `<@!${guildDb?.users[userUuid]?.discordId}>\n` +
                        `Round ${Moment(round.startDate).format('MMMM Do YYYY')} - ${Moment(round.startDate).add(round.config.roundDuration, 'days').format('MMMM Do YYYY')}\n\n` +
                        `👏 - 0 grant(s) sent: \n\n` +
                        `\n\n🎁 - 0 grant(s) received: \n\n` +
                        `\n\n🖨 - 0 mint(s): \n\n`, ephemeral: true
                })
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        logger.debug('Get user done.')

        logger.debug('Normalize all grants/mints...')
        const grantReceived = normalizeReceivedGrant(round.grants, userUuid, guildDb.users, round.config.minReputationDecay, 0)
        const grantSent = normalizeSentGrant(round.grants, userUuid, guildDb.users, round.config.minReputationDecay, 0)
        const mint = round.mints[userUuid] || {}
        logger.debug('Normalize all grants/mints done.')

        await interaction
            ?.reply({
                content:
                    `<@!${guildDb?.users[userUuid]?.discordId}>\n` +
                    `Round ${Moment(round.startDate).format('MMMM Do YYYY')} - ${Moment(round.startDate).add(round.config.roundDuration, 'days').format('MMMM Do YYYY')}\n\n` +

                    `👏 - ${Object.keys(grantSent).length} grant(s) sent: \n` +
                    Object.keys(grantSent)
                        .sort((a, b) => grantSent[b] - grantSent[a])
                        .slice(0, 10)
                        .map((sender) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(grantSent[sender])} reputations to ${guildDb.users[sender]?.discordId
                            ? `<@!${guildDb.users[sender]?.discordId}>`
                            : (guildDb.users[sender]?.displayName || 'Missing member')}`).join('\n') +

                    `\n\n🎁 - ${Object.keys(grantReceived).length} grant(s) received: \n` +
                    Object.keys(grantReceived)
                        .sort((a, b) => grantReceived[b] - grantReceived[a])
                        .slice(0, 10)
                        .map((receiver) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(grantReceived[receiver])} reputations from ${guildDb.users[receiver]?.discordId
                            ? `<@!${guildDb.users[receiver]?.discordId}>`
                            : (guildDb.users[receiver]?.displayName || 'Missing member')}`).join('\n') +

                    `\n\n🖨 - ${Object.keys(mint).length} mint(s)\n` +
                    Object.keys(mint).map((receiver) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(mint[receiver])} reputations from ${guildDb.users[receiver]?.discordId
                        ? `<@!${guildDb.users[receiver]?.discordId}>`
                        : (guildDb.users[receiver]?.displayName || 'Missing member')}`).join('\n'), ephemeral: true
            })
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

/**
 * Print user config with some explanation
 * @param interaction - Discord interaction
 * @param userUuid - User unique identifier
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printUserConfig = async (interaction, userUuid, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_USER_INFO_OPTIONS.SHOW_USER_CONFIG.value)) return false

        const userConfig = userUuid
            ? guildDb.users[userUuid].config
            : makeUserConfigFromGuildConfig(guildDb.config)

        await interaction
            ?.reply({
                content: `When you reply to a message, you will automatically offer ${userConfig.replyGrant} reputations to the message's author.\n`
                    + 'You can change this value with the command `/user config reply-grant:2`\n\n'
                    + `When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.\n${Object.keys(guildDb.config.reactionGrants)
                        .map((emoji) => `${emoji} => ${guildDb.config.reactionGrants[emoji]} reputations`).join('\n')}\n`
                    + 'You can change this value with the command `/user config reaction::fire: reaction-grant:1`\n\n'
                    + `Based on the channel, you can apply a multiplier to your reaction and reply grant.\n${Object.keys(guildDb.config.channelGrantMultipliers)
                        .map((channel) => `${channel === 'default' ? channel : `<#${channel}>`} => x${guildDb.config.channelGrantMultipliers[channel]}`).join('\n')}\n`
                    + 'You can change this value with the command `/user config channel:#🌌-defi channel-multiplier:1`',
                ephemeral: true
            })
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

/**
 * Process all print interaction
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @returns {Promise<boolean>}
 */
export const printUserInfo = async (interaction, guildUuid, db) => {
    try {
        await db.read()

        if (!guildUuid) return true
        const guildDb = db.data[guildUuid]

        const userUuid = findUserUuidByDiscordId(interaction.member.id, guildDb.users)

        if (await printUserReputation(interaction, userUuid, guildDb)) return true
        if (await printUserGrants(interaction, userUuid, guildDb)) return true
        if (await printUserConfig(interaction, userUuid, guildDb)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}