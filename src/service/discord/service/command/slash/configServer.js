import logger from "../../../../winston/index.js";
import {ApplicationCommandOptionTypes} from "../../../../../utils/discordConstant.js";

const COMMAND_CONFIG_SERVER = {
    ADMIN_ROLE: 'admin-role',
    DISCORD_MATCHING: 'discord-matching',
    DURATION: 'duration',
    DECAY: 'decay',
    ROLE: 'role',
    ROLE_MULTIPLIER: 'role-multiplier',
    CHANNEL: 'channel',
    CHANNEL_MULTIPLIER: 'channel-multiplier',
    REACTION: 'reaction',
    REACTION_GRANT: 'reaction-grant',
    REPLY_GRANT: 'reply-grant'
}

export const CONFIG_SERVER = {type: ApplicationCommandOptionTypes.SUB_COMMAND, name: 'server-config', description: 'set server config', options:[{
            type: ApplicationCommandOptionTypes.ROLE, name: COMMAND_CONFIG_SERVER.ADMIN_ROLE, description: 'Set admin role',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.DISCORD_MATCHING, description: 'Default Discord matching pool',
        },{
            type: ApplicationCommandOptionTypes.INTEGER, name: COMMAND_CONFIG_SERVER.DURATION, description: 'Duration of each round in days',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.DECAY, description: 'Reputation decay in percent at each round(eg: 0.01)',
        },{
            type: ApplicationCommandOptionTypes.ROLE, name: COMMAND_CONFIG_SERVER.ROLE, description: 'Role to apply the power multiplier(not specified=default)',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.ROLE_MULTIPLIER, description: 'Power multiplier for this role(>=0)',
        },{
            type: ApplicationCommandOptionTypes.CHANNEL, name: COMMAND_CONFIG_SERVER.CHANNEL, description: 'Channel to apply the grant multiplier(not specified=default)',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.CHANNEL_MULTIPLIER, description: 'Grant multiplier for this channel(>=0)',
        },{
            type: ApplicationCommandOptionTypes.STRING, name: COMMAND_CONFIG_SERVER.REACTION, description: 'Reaction that will grant reputation',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.REACTION_GRANT, description: 'How much will be granted per reaction(>=0)',
        },{
            type: ApplicationCommandOptionTypes.NUMBER, name: COMMAND_CONFIG_SERVER.REPLY_GRANT, description: 'How much will be granted per reply(>=0)',
        }]}

/**
 * Update the DB based on condition
 * @param interaction - Discord interaction
 * @param condFunc - Function to test some condition and return true if need to update
 * @param modifierFunc - Function to return an updated database
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const basicSetter = async (interaction, condFunc, modifierFunc, db, mutex) => {
    try {
        if(!await condFunc()) return false

        mutex.runExclusive(async () => {
            await db.read()

            db.data[interaction.guildId] = modifierFunc(db.data[interaction.guildId])

            await db.write()
        })

        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return false
    }
}

/**
 * Update the admin role
 * @param adminRole - Discord role Id
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setAdminRole = async (adminRole, interaction, db, mutex) => basicSetter(
    interaction,
    () => true,
    (serverDb) => {
        serverDb.config.adminRole = adminRole
        return serverDb
    }, db, mutex)

/**
 * Update the server discord matching quantity
 * @param matching - The matching quantity
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMatchingDiscord = async (matching, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (matching >= 0) return true

        return false
    },
    (serverDb) => {
        serverDb.config.discordMatching = matching
        return serverDb
    }, db, mutex)

/**
 * Update the server round duration
 * @param duration - round duration
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setDuration = async (duration, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (duration > 0) return true

        return false
    },
    (serverDb) => {
        serverDb.config.roundDuration = duration
        return serverDb
    }, db, mutex)

/**
 * Update the server reputation decay
 * @param decay - reputation decay
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReputationDecay = async (decay, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (decay >= 0 && decay <= 1) return true

        return false
    },
    (serverDb) => {
        serverDb.config.reputationDecay = decay
        return serverDb
    }, db, mutex)

/**
 * Update the server role power multiplier for QR
 * @param multiplier - multiplier apply to this role
 * @param role - Discord role id (if undefined = apply to default)
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setRolePower = async (multiplier, role, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (multiplier >= 0) return true

        return false
    },
    (serverDb) => {
        if (role)
            serverDb.config.rolePowerMultiplier[role] = multiplier
        else
            serverDb.config.rolePowerMultiplier['default'] = multiplier
        return serverDb
    }, db, mutex)

/**
 * Update the server channel grant multiplier
 * @param multiplier - multiplier apply to this role
 * @param channel - Discord channel id (if undefined = apply to default)
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setChannelMultiplier = async (multiplier, channel, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (multiplier >= 0) return true

        return false
    },
    (serverDb) => {
        if (channel)
            serverDb.config.channelGrantMultiplier[channel] = multiplier
        else
            serverDb.config.channelGrantMultiplier['default'] = multiplier
        return serverDb
    }, db, mutex)

/**
 * Update the server reaction grant quantity
 * @param grant - How much reputation will be granted when react with this emoji
 * @param reaction - if custom emoji use Discord emoji id or simple the emoji char (if undefined = apply to default)
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReactionGrant = async (grant, reaction, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (grant >= 0) return true

        return false
    },
    (serverDb) => {
        if (reaction){
            const regex = /<:(.*:\d+)>|(.)/gm
            let emoji = reaction.replace(regex, '$1') || reaction.replace(regex, '$2')
            serverDb.config.reactionGrant[emoji] = grant
        }
        else
            serverDb.config.reactionGrant['default'] = grant
        return serverDb
    }, db, mutex)

/**
 * Update the server reply grant quantity
 * @param grant - How much reputation will be granted when reply
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setReplyGrant = async (grant, interaction, db, mutex) => basicSetter(
    interaction,
    async () => {
        if (grant >= 0) return true

        return false
    },
    (serverDb) => {
        serverDb.config.replyGrant = grant
        return serverDb
    }, db, mutex)

/**
 * Process all config command
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const configServer = async (interaction, db, mutex) => {
    try {
        if (interaction?.options?.data[0]?.name !== CONFIG_SERVER.name) return false

        const options = interaction.options.data[0].options
        let response = ''

        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.ADMIN_ROLE))
            if(!await setAdminRole(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.ADMIN_ROLE)?.value,
                interaction, db, mutex)) response += ''
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.DISCORD_MATCHING))
            if(!await setMatchingDiscord(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.DISCORD_MATCHING)?.value,
                interaction, db, mutex)) response += 'Default Discord matching pool need to be >= 0\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.DURATION))
            if(!await setDuration(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.DURATION)?.value,
                interaction, db, mutex)) response += 'Duration of each round in days need to be > 0\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.DECAY))
            if(!await setReputationDecay(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.DECAY)?.value,
                interaction, db, mutex)) response += 'Reputation decay in percent at each round(eg: 0.01) need to be >= 0 and =< 1\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.ROLE_MULTIPLIER))
            if(!await setRolePower(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.ROLE_MULTIPLIER)?.value,
                options.find(o => o.name === COMMAND_CONFIG_SERVER.ROLE)?.value,
                interaction, db, mutex)) response += 'Power multiplier for this role need to be >= 0\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.CHANNEL_MULTIPLIER))
            if(!await setChannelMultiplier(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.CHANNEL_MULTIPLIER)?.value,
                options.find(o => o.name === COMMAND_CONFIG_SERVER.CHANNEL)?.value,
                interaction, db, mutex)) response += 'Grant multiplier for this channel need to be >= 0\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.REACTION_GRANT))
            if(!await setReactionGrant(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.REACTION_GRANT)?.value,
                options.find(o => o.name === COMMAND_CONFIG_SERVER.REACTION)?.value,
                interaction, db, mutex)) response += 'How much will be granted per reaction need to be >= 0\n'
        if (options.find(o => o.name === COMMAND_CONFIG_SERVER.REPLY_GRANT))
            if(!await setReplyGrant(
                options.find(o => o.name === COMMAND_CONFIG_SERVER.REPLY_GRANT)?.value,
                interaction, db, mutex)) response += 'How much will be granted per reply need to be >= 0\n'

        await interaction.reply({content: response || 'Done !', ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}