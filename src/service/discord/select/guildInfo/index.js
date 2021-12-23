import {MessageActionRow, MessageSelectMenu} from 'discord.js'
import logger from '../../../core/winston/index.js'
import Moment from "moment";

export const SELECT_GUILD_INFO = {
    customId: 'select-server-info',
    placeholder: 'Nothing selected',
}
export const SELECT_GUILD_INFO_OPTIONS = {
    ADMIN_ROLE: {value: 'admin-role', label: '🤠 admin role'},
    CAPTCHA_ROLE: {value: 'captcha-role', label: '🤖 captcha role'},

    DEFAULT_REPUTATION: {value: 'default-reputation', label: '🐣 Default reputation'},
    ROUND_DURATION: {value: 'round-duration', label: '⏱ Round duration'},
    MIN_REPUTATION_DECAY: {value: 'min-reputation-decay', label: '📉 Min reputation decay'},
    MAX_REPUTATION_DECAY: {value: 'max-reputation-decay', label: '⚖ Max reputation decay'},
    DISCORD_MATCHING: {value: 'discord-matching', label: '🎁 discord matching'},
    ROLE_POWER_MULTIPLIERS: {value: 'role-power-multipliers', label: '🧙 role power multipliers'},

    MIN_REPUTATION_TRANSFER: {value: 'min-reputation-transfer', label: '↪ min reputation transfer'},
    MIN_REPUTATION_START_PROPOSAL: {value: 'min-reputation-start-proposal', label: '📃 min reputation start proposal'},
    MIN_REPUTATION_CONFIRM_PROPOSAL: {value: 'min-reputation-confirm-proposal', label: '🗳 min reputation confirm proposal'},
    PROPOSAL_CHANNEL: {value: 'proposal-channel', label: '📢 proposal channel'},
    CHANNEL_PANTHEONS: {value: 'channel-pantheons', label: '👑 channel pantheons'},

    REPLY_GRANT: {value: 'reply-grant', label: '💬 Reply grant'},
    REACTION_GRANTS: {value: 'reaction-grants', label: '❤ Reaction grants'},
    CHANNEL_GRANT_MULTIPLIERS: {value: 'channel-grant-multiplier', label: '🗺 channel grant multipliers'},

    MIN_REPUTATION_MUTE: {value: 'min-reputation-mute', label: '🤫 min reputation to mute'},

    REACTION_ROLES: {value: 'reaction-roles', label: '🎭 reaction assign role'},

    REPUTATION_ROLES: {value: 'reputation-roles', label: '🎖 reputation assign role'},

    REACTION_TRANSFERS: {value: 'reaction-transfers', label: '🔀 transfer message with reaction'},

    MUTED_USERS: {value: 'muted-users', label: '📵 list users muted'},
}

export const guildInfoComponents = [new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(SELECT_GUILD_INFO.customId)
            .setPlaceholder(SELECT_GUILD_INFO.placeholder)
            .addOptions(Object.values(SELECT_GUILD_INFO_OPTIONS)),
    )]

/**
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printAdminRole = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.ADMIN_ROLE.value)) return false

        await interaction
            ?.reply({content: guildDb?.config?.adminRole
                    ? `Users with the <@&${guildDb?.config?.adminRole}> role can perform certain privileged actions such as changing the bot configuration or granting reputation to a member.`
                    : 'No admin role set', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printCaptchaRole = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.CAPTCHA_ROLE.value)) return false

        await interaction
            ?.reply({content: guildDb.config.captchaRole
                    ?`<@&${guildDb.config.captchaRole}> is added when the user has passed the captcha verification.`
                    : 'No captcha role set', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printDefaultReputation = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.DEFAULT_REPUTATION.value)) return false

        await interaction
            ?.reply({content: `Each new user will receive ${guildDb.config.defaultReputation} reputations and can't go bellow this amount.`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printRoundDuration = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.ROUND_DURATION.value)) return false

        await interaction
            ?.reply({content: `Each round has a duration of ${guildDb.config.roundDuration} days, reputation is distributed at the end of each round.`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMinReputationDecay = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MIN_REPUTATION_DECAY.value)) return false

        await interaction
            ?.reply({content: `At the end of each round, all members will  grant ${guildDb.config.minReputationDecay * 100}% of their total reputation.\n`+
                `If you grant less during a round, we will burn the difference.`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMaxReputationDecay = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MAX_REPUTATION_DECAY.value)) return false

        await interaction
            ?.reply({content: `The further the user moves away from the standard deviation of reputation, the more reputation he will lose at the end of each round, at most ${guildDb.config.maxReputationDecay * 100}%.`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printDiscordMatching = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.DISCORD_MATCHING.value)) return false

        await interaction
            ?.reply({content: `At the end of each period, we will distribute ${guildDb.config.discordMatching} reputation in addition to the total reputation burn during this round via a Quadratic Funding formula.`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printRolePowerMultipliers = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.ROLE_POWER_MULTIPLIERS.value)) return false

        await interaction
            ?.reply({content: `When we compute the reputation matching at the end of each round, we take several parameters to determine the amount of reputation granted to you.`+
                `The diversity and amount of reputation received, the seniority of the donator but also the role of the donator.\n\n`+
                `${Object.keys(guildDb.config.rolePowerMultipliers)
                    .map((role) => `${role === 'default' ? role : `<@&${role}>`} => x${guildDb.config.rolePowerMultipliers[role]}`).join('\n')}`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMinReputationTransfer = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MIN_REPUTATION_TRANSFER.value)) return false

        await interaction
            ?.reply({content: guildDb.config.minReputationTransfer
                    ? `To forward a message, you need to gather ${guildDb.config.minReputationTransfer} reputations.`
                    : 'Forward message is disabled.', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMinReputationStartProposal = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MIN_REPUTATION_START_PROPOSAL.value)) return false

        await interaction
            ?.reply({content: guildDb.config.minReputationToStartProposal
                    ? `To propose a vote, you need to gather ${guildDb.config.minReputationToStartProposal} reputations.`
                    : 'Proposal is disabled.', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMinReputationConfirmProposal = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MIN_REPUTATION_CONFIRM_PROPOSAL.value)) return false

        await interaction
            ?.reply({content: guildDb.config.minReputationToConfirmProposal
                    ? `For a proposal to be considered valid, ${guildDb.config.minReputationToConfirmProposal} reputations must be collected.`
                    : 'Proposal is disabled.', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printChannelProposal = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.PROPOSAL_CHANNEL.value)) return false

        await interaction
            ?.reply({content: guildDb.config.channelProposal
                    ? `Once having collected the minimum reputation required, the proposals will be proposed to the vote in channel <#${guildDb.config.channelProposal}>.`
                    : 'Proposal is disabled', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printChannelPantheons = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.CHANNEL_PANTHEONS.value)) return false

        await interaction.reply({content: `When a channel is set up as a pantheon, reactions will offer grants to the people mentioned instead of the author:\n`
                + Object.keys(guildDb.config.channelPantheons)
                    .filter(channel => guildDb.config.channelPantheons[channel])
                .map((channel) => `<#${channel}>`).join('\n'), ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printReplyGrant = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.REPLY_GRANT.value)) return false

        await interaction.reply({content: `When you reply to a message, you will automatically offer ${guildDb.config.replyGrant} reputations to the message's author.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printReactionGrants = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.REACTION_GRANTS.value)) return false

        await interaction.reply({content: `When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.\n\n${Object.keys(guildDb.config.reactionGrants)
                .map((emoji) => `${emoji.includes(':') ? `<:${emoji}>`: emoji } => ${guildDb.config.reactionGrants[emoji]} reputations`).join('\n')}`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printChannelGrantMultipliers = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.CHANNEL_GRANT_MULTIPLIERS.value)) return false

        await interaction.reply({content: `Based on the channel, you can apply a multiplier to your reaction and reply grant.\n\n${Object.keys(guildDb.config.channelGrantMultipliers)
                .map((channel) => `${channel === 'default' ? channel : `<#${channel}>` } => x${guildDb.config.channelGrantMultipliers[channel]}`).join('\n')}`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMinReputationMute = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MIN_REPUTATION_MUTE.value)) return false

        await interaction
            ?.reply({content: guildDb.config.minReputationToMute
                    ? `To mute someone, you need to gather ${guildDb.config.minReputationToMute} reputations.`
                    : 'Mute is disabled.', ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printReactionRoles = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.REACTION_ROLES.value)) return false

        await interaction
            ?.reply({content: `When you react to a message, you will automatically be assigned to a discord role.\n\n${Object.keys(guildDb?.reactionRoles)
                    .map((messageId) => `${messageId} => ${Object.keys(guildDb?.reactionRoles[messageId])
                        .map((reaction) => `${reaction} -> <@&${guildDb?.reactionRoles[messageId][reaction]}>`).join('; ')}`).join('\n')}`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printReputationRoles = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.REPUTATION_ROLES.value)) return false

        await interaction
            ?.reply({content: `Set a discord role based on your reputation.\n\n${Object.keys(guildDb?.reputationRoles)
                    .map((role) => `<@&${role}> => ${guildDb?.reputationRoles[role]} reputations`).join('\n')}`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printReactionTransfers = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.REACTION_TRANSFERS.value)) return false

        await interaction
            ?.reply({content: `Transfer a message if enough reputation use this emoji.\n\n${Object.keys(guildDb?.reactionTransfers)
                    .map((reaction) => `${reaction} => <#${guildDb?.reactionTransfers[reaction]}>`).join('\n')}`, ephemeral: true})
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
 *
 * @param interaction - Discord interaction
 * @param guildDb - in-memory database
 * @returns {Promise<boolean>}
 */
const printMutedList = async (interaction, guildDb) => {
    try {
        if (!interaction?.values?.includes(SELECT_GUILD_INFO_OPTIONS.MUTED_USERS.value)) return false

        await interaction
            ?.reply({content: `List of users muted.\n\n${Object.keys(guildDb?.discordMutedUsers)
                    .map((userDiscordId) => `<@!${userDiscordId}> => ${Moment(guildDb?.discordMutedUsers[userDiscordId]?.startDate)
                        .add(guildDb?.discordMutedUsers[userDiscordId]?.duration, 'minutes')
                        .format('MMMM Do YYYY, h:mm a')}`).join('\n')}`, ephemeral: true})
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
 * @param db - in-memory database
 * @returns {Promise<boolean>}
 */
export const printGuildInfo = async (interaction, guildUuid, db) => {
    try {
        await db.read()

        if (!guildUuid) return true
        const guildDb = db.data[guildUuid]

        if (await printAdminRole(interaction, guildDb)) return true
        if (await printCaptchaRole(interaction, guildDb)) return true

        if (await printDefaultReputation(interaction, guildDb)) return true
        if (await printRoundDuration(interaction, guildDb)) return true
        if (await printMinReputationDecay(interaction, guildDb)) return true
        if (await printMaxReputationDecay(interaction, guildDb)) return true
        if (await printDiscordMatching(interaction, guildDb)) return true
        if (await printRolePowerMultipliers(interaction, guildDb)) return true

        if (await printMinReputationTransfer(interaction, guildDb)) return true
        if (await printMinReputationStartProposal(interaction, guildDb)) return true
        if (await printMinReputationConfirmProposal(interaction, guildDb)) return true
        if (await printChannelProposal(interaction, guildDb)) return true
        if (await printChannelPantheons(interaction, guildDb)) return true

        if (await printReplyGrant(interaction, guildDb)) return true
        if (await printReactionGrants(interaction, guildDb)) return true
        if (await printChannelGrantMultipliers(interaction, guildDb)) return true

        if (await printMinReputationMute(interaction, guildDb)) return true

        if (await printReactionRoles(interaction, guildDb)) return true

        if (await printReputationRoles(interaction, guildDb)) return true

        if (await printReactionTransfers(interaction, guildDb)) return true

        if (await printMutedList(interaction, guildDb)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}