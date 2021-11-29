import logger from "../../../../winston/index.js";

export const BUTTON_SERVER_INFO = {
    ADMIN_ROLE: {customId: 'ADMIN_ROLE', label: '🔧 Admin Role', style: 'PRIMARY'},

    DISCORD_MATCHING: {customId: 'DISCORD_ALLOCATION', label: '🎁 Discord Matching', style: 'PRIMARY'},
    ROUND_DURATION: {customId: 'ROUND_DURATION', label: '⏱ Round duration', style: 'PRIMARY'},
    REPUTATION_DECAY: {customId: 'REPUTATION_DECAY', label: '📉 Reputation decay', style: 'PRIMARY'},
    ROLE_POWER: {customId: 'ROLE_POWER', label: '🥇 Role power multiplier', style: 'PRIMARY'},

    REPLY_GRANT: {customId: 'MESSAGE_VOTE', label: '💬 Reply grant', style: 'PRIMARY'},
    REACTION_GRANT: {customId: 'REACTION_VOTE', label: '❤ Reaction grant', style: 'PRIMARY'},
    CHANNEL_GRANT_MULTIPLIER: {customId: 'CHANNEL_VOTE', label: '🗺 Channel grant multiplier', style: 'PRIMARY'},
}


/**
 * Print the admin role and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printAdminRole = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.ADMIN_ROLE.customId) return false

        await interaction.reply({content: `Users with the <@&${serverDb.config.adminRole}> role can perform certain privileged actions such as changing the bot configuration or granting reputation to a member.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server Discord matching and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printDiscordMatching = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.DISCORD_MATCHING.customId) return false

        await interaction.reply({content: `At the end of each period, we use Quadratic Funding to distribute a certain amount of reputation.\n`+
                `By default, we will distribute ${serverDb.config.discordMatching} reputations, this can be changed for each round.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server round duration and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printRoundDuration = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.ROUND_DURATION.customId) return false

        await interaction.reply({content: `Each round has a duration of ${serverDb.config.roundDuration} days, this can be changed for each round.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server reputation decay and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printReputationDecay = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.REPUTATION_DECAY.customId) return false

        await interaction.reply({content: `At the end of each round, all members will  grant ${serverDb.config.reputationDecay * 100}% of their total reputation.\n`+
                `If you grant less during a round, we will burn the difference, this can be changed for each round.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server role power multiplier and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printRolePower = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.ROLE_POWER.customId) return false

        await interaction.reply({content: `When we compute the reputation matching at the end of each round, we take several parameters to determine the amount of reputation granted to you.`+
                `The diversity and amount of reputation received, the seniority of the donator but also the role of the donator.\n\n`+
                `Here is the default multiplier depending on the role, this can be changed for each round.\n\n${Object.keys(serverDb.config.rolePowerMultiplier)
                .map((role) => `${role === 'default' ? role : `<@&${role}>`} => x${serverDb.config.rolePowerMultiplier[role]}`).join('\n')}`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server reply grant and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printReplyGrant = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.REPLY_GRANT.customId) return false

        await interaction.reply({content: `When you reply to a message, you will automatically offer ${serverDb.config.replyGrant} reputation(s) to the message's author, this can be changed for each round.`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server reaction grant and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printReactionGrant = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.REACTION_GRANT.customId) return false

        await interaction.reply({content: `When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose, this can be changed for each round.\n\n${Object.keys(serverDb.config.reactionGrant)
                    .map((emoji) => `${emoji.includes(':') ? `<:${emoji}>`: emoji } => x${serverDb.config.reactionGrant[emoji]}`).join('\n')}`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Print the server channel grant and explanation
 * @param interaction - Discord interaction
 * @param serverDb - in-memory server database
 * @returns {Promise<boolean>}
 */
const printChannelGrant = async (interaction, serverDb) => {
    try {
        if (interaction.customId !== BUTTON_SERVER_INFO.CHANNEL_GRANT_MULTIPLIER.customId) return false

        await interaction.reply({content: `Based on the channel, you can apply a multiplier to your reaction and reply grant., this can be changed for each round.\n\n${Object.keys(serverDb.config.channelGrantMultiplier)
                    .map((channel) => `${channel === 'default' ? channel : `<#${channel}>` } => x${serverDb.config.channelGrantMultiplier[channel]}`).join('\n')}`, ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Process all print interaction
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @returns {Promise<boolean>}
 */
export const printServerInfo = async (interaction, db) => {
    try {
        const serverDb = db.data[interaction.guildId]

        if (await printAdminRole(interaction, serverDb)) return true
        if (await printDiscordMatching(interaction, serverDb)) return true
        if (await printRoundDuration(interaction, serverDb)) return true
        if (await printReputationDecay(interaction, serverDb)) return true
        if (await printRolePower(interaction, serverDb)) return true
        if (await printReplyGrant(interaction, serverDb)) return true
        if (await printReactionGrant(interaction, serverDb)) return true
        if (await printChannelGrant(interaction, serverDb)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}