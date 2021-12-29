import {Collection} from 'discord.js'
import logger from '../../core/winston/index.js'
import {processButton} from '../button/index.js'
import {processGuild} from './guild/index.js'
import {processGrant} from './reputation/grant/index.js'
import {processReputation} from './reputation/index.js'
import {ApplicationCommandOptionTypes} from '../util/discordConstant.js'
import {processPrintButton} from './button/index.js'
import {processRound} from './round/index.js'
import {processProposal} from './proposal/index.js'
import {processUser} from './user/index.js'
import {processGiveaway} from "./giveaway/index.js";

export const COMMANDS_NAME = {
    GUILD: {
        name: 'guild',
        CONFIG: {
            name: 'config',

            ADMIN_ROLE: {name: 'admin-role'},

            CAPTCHA_ROLE: {name: 'captcha-role'},

            DEFAULT_REPUTATION: {name: 'default-reputation'},

            DISCORD_MATCHING: {name: 'discord-matching'},
            DURATION: {name: 'duration'},
            MIN_DECAY: {name: 'min-decay'},
            MAX_DECAY: {name: 'max-decay'},

            ROLE: {name: 'role'},
            ROLE_MULTIPLIER: {name: 'role-multiplier'},

            CHANNEL: {name: 'channel'},
            CHANNEL_MULTIPLIER: {name: 'channel-multiplier'},

            REACTION: {name: 'reaction'},
            REACTION_GRANT: {name: 'reaction-grant'},

            REPLY_GRANT: {name: 'reply-grant'},

            CHANNEL_PANTHEON: {name: 'channel-pantheon'},
            CHANNEL_PANTHEON_ENABLE: {name: 'channel-pantheon-enable'},

            REACTION_ROLE_MESSAGE: {name: 'reaction-role-message'},
            REACTION_ROLE_REACTION: {name: 'reaction-role-reaction'},
            REACTION_ROLE_ROLE: {name: 'reaction-role-role'},

            REPUTATION_ROLE_ROLE: {name: 'reputation-role-role'},
            REPUTATION_ROLE_MIN: {name: 'reputation-role-min'},

            REACTION_TRANSFER_REPUTATION: {name: 'reaction-transfer-reputation'},
            REACTION_TRANSFER_REACTION: {name: 'reaction-transfer-reaction'},
            REACTION_TRANSFER_CHANNEL: {name: 'reaction-transfer-channel'},
        },
        CONFIG_2: {
            name: 'config-2',

            MIN_REPUTATION_START_PROPOSAL: {name: 'min-rep-start-proposal'},
            MIN_REPUTATION_CONFIRM_PROPOSAL: {name: 'min-rep-confirm-proposal'},
            CHANNEL_PROPOSAL: {name: 'channel-proposal'},

            MIN_REPUTATION_MUTE: {name: 'min-rep-mute'},
        },
        DB_URL: { name: 'db-url'}
    },
    ROUND: {
        name: 'round',
        CONFIG: {
            name: 'config',

            ROUND_SHIFT: {name: 'round-shift'},

            APPLY_GUILD_DEFAULT: {name: 'apply-guild-default'},

            DEFAULT_REPUTATION: {name: 'default-reputation'},

            DISCORD_MATCHING: {name: 'discord-matching'},
            DURATION: {name: 'duration'},
            MIN_DECAY: {name: 'min-decay'},
            MAX_DECAY: {name: 'max-decay'},

            ROLE: {name: 'role'},
            ROLE_MULTIPLIER: {name: 'role-multiplier'},

            CHANNEL: {name: 'channel'},
            CHANNEL_MULTIPLIER: {name: 'channel-multiplier'},

            REACTION: {name: 'reaction'},
            REACTION_GRANT: {name: 'reaction-grant'},

            REPLY_GRANT: {name: 'reply-grant'}
        },
        START_FIRST: {
            name: 'start-first'
        }
    },
    USER: {
        name: 'user',

        CONFIG:{
            name: 'config',

            APPLY_GUILD_DEFAULT: {name: 'apply-guild-default'},

            CHANNEL: {name: 'channel'},
            CHANNEL_MULTIPLIER: {name: 'channel-multiplier'},

            REACTION: {name: 'reaction'},
            REACTION_GRANT: {name: 'reaction-grant'},

            REPLY_GRANT: {name: 'reply-grant'},
        },
        UNMUTE: {
            name: 'unmute',

            USER:{name: 'user'}
        }
    },
    REPUTATION: {
        name: 'reputation',

        TOP: {
            name: 'top',

            START: {name: 'start'},
        },
        GRANT_LIST: {
            name: 'grant-list',

            USER: {name: 'user'},
            ROUND: {name: 'round'},
        },
        GRANT_ADD: {
            name: 'grant-add',

            USER: {name: 'user'},
            AMOUNT: {name: 'amount'},
        },
        GRANT_SET: {
            name: 'grant-set',

            USER: {name: 'user'},
            AMOUNT: {name: 'amount'},
        },
        FETCH_HISTORY: {
            name: 'fetch-history',

            START_DATE: {name: 'start-date'}
        },
        RECOMPUTE_REPUTATION: {
            name: 'recompute-reputation',

            USE_GUILD_CONFIG: {name: 'use-guild-config'}
        }
    },
    BUTTON: {
        name: 'button',

        CAPTCHA: {
            name: 'captcha'
        },
        GUILD_INFO: {
            name: 'guild-info'
        },
        USER_INFO: {
            name: 'user-info'
        },
        MANUAL: {
            name: 'manual'
        },

    },
    PROPOSAL:{
        name: 'proposal',

        START: {
            name: 'start',

            MESSAGE: { name: 'message'},
            DURATION: { name: 'duration'},
            MINT_USER: { name: 'mint-user'},
            MINT_AMOUNT: { name: 'mint-qty'}
        },
        MUTE: {
            name: 'mute',
            USER: { name: 'user'},
            DURATION: { name: 'duration'},
        }
    },
    GIVEAWAY:{
        name: 'giveaway',

        MESSAGE: { name: 'message'},
        WEIGHTED: { name: 'weighted'},
    }
}

export const COMMANDS = [
    {
        name: COMMANDS_NAME.GUILD.name, description: 'Demeter guild', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.GUILD.CONFIG.name,
                description: 'Config guild(admin only)',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.GUILD.CONFIG.ADMIN_ROLE.name,
                        description: 'Set admin role',
                    }, {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.GUILD.CONFIG.CAPTCHA_ROLE.name,
                        description: 'Set captcha role',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.DEFAULT_REPUTATION.name,
                        description: 'Default Reputation for new member',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.DISCORD_MATCHING.name,
                        description: 'How much reputation to add to QR',
                    }, {
                        type: ApplicationCommandOptionTypes.INTEGER,
                        name: COMMANDS_NAME.GUILD.CONFIG.DURATION.name,
                        description: 'Duration of each round in days',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.MIN_DECAY.name,
                        description: 'Min reputation decay in percent at each round(eg: 0.01)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.MAX_DECAY.name,
                        description: 'Max reputation decay in percent at each round(eg: 0.01)',
                    }, {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.GUILD.CONFIG.ROLE.name,
                        description: 'Role to apply the power multiplier(not specified=default)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.ROLE_MULTIPLIER.name,
                        description: 'Power multiplier for this role(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.GUILD.CONFIG.CHANNEL.name,
                        description: 'Channel to apply the grant multiplier(not specified=default)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.CHANNEL_MULTIPLIER.name,
                        description: 'Grant multiplier for this channel(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION.name,
                        description: 'Reaction that will grant reputation',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_GRANT.name,
                        description: 'How much will be granted per reaction(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.REPLY_GRANT.name,
                        description: 'How much will be granted per reply(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.GUILD.CONFIG.CHANNEL_PANTHEON.name,
                        description: 'Channels where reputation is granted to the people mentioned',
                    }, {
                        type: ApplicationCommandOptionTypes.BOOLEAN,
                        name: COMMANDS_NAME.GUILD.CONFIG.CHANNEL_PANTHEON_ENABLE.name,
                        description: 'Enable pantheon for this channel',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_MESSAGE.name,
                        description: 'Set a role when react to this message(message url)',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_REACTION.name,
                        description: 'Emoji to use to receive role',
                    }, {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_ROLE_ROLE.name,
                        description: 'Role to set when react(if not set remove previous role)',
                    }, {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.GUILD.CONFIG.REPUTATION_ROLE_ROLE.name,
                        description: 'Role to set when enough reputation',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.REPUTATION_ROLE_MIN.name,
                        description: 'Min reputation to set role(if not set remove role)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_REPUTATION.name,
                        description: 'Minimum reputation to transfer a message(0 = no transfer)',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_REACTION.name,
                        description: 'Reaction to transfer a message',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.GUILD.CONFIG.REACTION_TRANSFER_CHANNEL.name,
                        description: 'Destination to transfer a message',
                    }
                ]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.GUILD.CONFIG_2.name,
                description: 'Config guild(admin only)',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_START_PROPOSAL.name,
                        description: 'How much reputation to start a vote(0 = no vote)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_CONFIRM_PROPOSAL.name,
                        description: 'How much reputation to accept a proposal(0 = no vote)',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.GUILD.CONFIG_2.CHANNEL_PROPOSAL.name,
                        description: 'Where to post the proposal',
                    },{
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.GUILD.CONFIG_2.MIN_REPUTATION_MUTE.name,
                        description: 'How much reputation to mute someone(0 = no mute)',
                    },
                ]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.GUILD.DB_URL.name,
                description: 'Show the URL of database',
            }
        ]
    },
    {
        name: COMMANDS_NAME.ROUND.name, description: 'Demeter round', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.ROUND.CONFIG.name,
                description: 'Config round(admin only)',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.ROUND_SHIFT.name,
                        description: 'How much round in the past(0=now)',
                    }, {
                        type: ApplicationCommandOptionTypes.BOOLEAN,
                        name: COMMANDS_NAME.ROUND.CONFIG.APPLY_GUILD_DEFAULT.name,
                        description: 'Apply guild default setting to this round',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.DEFAULT_REPUTATION.name,
                        description: 'Default Reputation for new member',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.DISCORD_MATCHING.name,
                        description: 'How much reputation to add to QR',
                    }, {
                        type: ApplicationCommandOptionTypes.INTEGER,
                        name: COMMANDS_NAME.ROUND.CONFIG.DURATION.name,
                        description: 'Duration of each round in days',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.MIN_DECAY.name,
                        description: 'Min reputation decay in percent at each round(eg: 0.01)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.MAX_DECAY.name,
                        description: 'Max reputation decay in percent at each round(eg: 0.01)',
                    }, {
                        type: ApplicationCommandOptionTypes.ROLE,
                        name: COMMANDS_NAME.ROUND.CONFIG.ROLE.name,
                        description: 'Role to apply the power multiplier(not specified=default)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.ROLE_MULTIPLIER.name,
                        description: 'Power multiplier for this role(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.ROUND.CONFIG.CHANNEL.name,
                        description: 'Channel to apply the grant multiplier(not specified=default)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.CHANNEL_MULTIPLIER.name,
                        description: 'Grant multiplier for this channel(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.ROUND.CONFIG.REACTION.name,
                        description: 'Reaction that will grant reputation',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.REACTION_GRANT.name,
                        description: 'How much will be granted per reaction(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.ROUND.CONFIG.REPLY_GRANT.name,
                        description: 'How much will be granted per reply(>=0)',
                    }
                ]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.ROUND.START_FIRST.name,
                description: 'Start the first round'
            }
        ]
    },
    {
        name: COMMANDS_NAME.USER.name, description: 'Demeter user', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.USER.CONFIG.name,
                description: 'Config user',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.BOOLEAN,
                        name: COMMANDS_NAME.USER.CONFIG.APPLY_GUILD_DEFAULT.name,
                        description: 'Apply guild default setting',
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: COMMANDS_NAME.USER.CONFIG.CHANNEL.name,
                        description: 'Channel to apply the grant multiplier(not specified=default)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.USER.CONFIG.CHANNEL_MULTIPLIER.name,
                        description: 'Grant multiplier for this channel(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.USER.CONFIG.REACTION.name,
                        description: 'Reaction that will grant reputation',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.USER.CONFIG.REACTION_GRANT.name,
                        description: 'How much will be granted per reaction(>=0)',
                    }, {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.USER.CONFIG.REPLY_GRANT.name,
                        description: 'How much will be granted per reply(>=0)',
                    }
                ]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.USER.UNMUTE.name,
                description: 'Unmute a user(Admin only)',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.USER,
                        name: COMMANDS_NAME.USER.UNMUTE.USER.name,
                        description: 'User to unmute',
                        required: true
                    }
                ]
            },
        ]
    },
    {
        name: COMMANDS_NAME.REPUTATION.name, description: 'Demeter reputation', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.TOP.name,
                description: 'Print top reputation members',
                options: [{
                    type: ApplicationCommandOptionTypes.INTEGER,
                    name: COMMANDS_NAME.REPUTATION.TOP.START.name,
                    description: 'Print top members starting from this position',
                }]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.GRANT_LIST.name,
                description: 'Show list of grant sent/received for a member',
                options: [{
                    type: ApplicationCommandOptionTypes.USER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_LIST.USER.name,
                    description: 'Member to show',
                },{
                    type: ApplicationCommandOptionTypes.INTEGER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_LIST.ROUND.name,
                    description: 'How much round in the past(0=now)',
                },]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.GRANT_ADD.name,
                description: 'Grant more reputation to a member',
                options: [{
                    type: ApplicationCommandOptionTypes.USER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_ADD.USER.name,
                    description: 'Member to grant reputation',
                },{
                    type: ApplicationCommandOptionTypes.INTEGER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_ADD.AMOUNT.name,
                    description: 'How much to add ?(Automatically modified to not exceed the max)',
                },]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.GRANT_SET.name,
                description: 'Update how much granted to a member',
                options: [{
                    type: ApplicationCommandOptionTypes.USER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_SET.USER.name,
                    description: 'Member to update grant reputation',
                },{
                    type: ApplicationCommandOptionTypes.INTEGER,
                    name: COMMANDS_NAME.REPUTATION.GRANT_SET.AMOUNT.name,
                    description: 'How much to grant ?(Automatically modified to not exceed the max)',
                },]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.FETCH_HISTORY.name,
                description: 'Reload and compute grant history(erase all rounds and reputation)',
                options: [{
                    type: ApplicationCommandOptionTypes.STRING,
                    name: COMMANDS_NAME.REPUTATION.FETCH_HISTORY.START_DATE.name,
                    description: 'Date of the first round(format: 31/01/2021)',
                    required: true,
                },]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.REPUTATION.RECOMPUTE_REPUTATION.name,
                description: 'Recompute grant history',
                options: [{
                    type: ApplicationCommandOptionTypes.BOOLEAN,
                    name: COMMANDS_NAME.REPUTATION.RECOMPUTE_REPUTATION.USE_GUILD_CONFIG.name,
                    description: 'Use current guild config',
                    required: true,
                },]
            },
        ]
    },
    {
        name: COMMANDS_NAME.BUTTON.name, description: 'Print button', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.BUTTON.CAPTCHA.name,
                description: 'Print captcha button',
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.BUTTON.GUILD_INFO.name,
                description: 'Print guild info button',
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.BUTTON.USER_INFO.name,
                description: 'Print user info button',
            },
        ]
    },
    {
        name: COMMANDS_NAME.PROPOSAL.name, description: 'Discord Proposal', options: [
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.PROPOSAL.START.name,
                description: 'Start a proposal',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: COMMANDS_NAME.PROPOSAL.START.MESSAGE.name,
                        description: 'Proposal\'s message URL',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionTypes.INTEGER,
                        name: COMMANDS_NAME.PROPOSAL.START.DURATION.name,
                        description: 'Proposal\'s duration in days(>0)',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionTypes.USER,
                        name: COMMANDS_NAME.PROPOSAL.START.MINT_USER.name,
                        description: 'User to mint reputation'
                    },
                    {
                        type: ApplicationCommandOptionTypes.NUMBER,
                        name: COMMANDS_NAME.PROPOSAL.START.MINT_AMOUNT.name,
                        description: 'How much reputation to mint(>0)'
                    },
                ]
            },
            {
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: COMMANDS_NAME.PROPOSAL.MUTE.name,
                description: 'Vote to mute someone',
                options: [
                    {
                        type: ApplicationCommandOptionTypes.USER,
                        name: COMMANDS_NAME.PROPOSAL.MUTE.USER.name,
                        description: 'User to mute',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionTypes.INTEGER,
                        name: COMMANDS_NAME.PROPOSAL.MUTE.DURATION.name,
                        description: 'How much minute to mute',
                        required: true
                    },
                ]
            },
        ]
    },
    {
        name: COMMANDS_NAME.GIVEAWAY.name, description: 'Discord Giveaway', options: [
            {
                type: ApplicationCommandOptionTypes.STRING,
                name: COMMANDS_NAME.GIVEAWAY.MESSAGE.name,
                description: 'Message URL where people react',
                required: true
            },
            {
                type: ApplicationCommandOptionTypes.BOOLEAN,
                name: COMMANDS_NAME.GIVEAWAY.WEIGHTED.name,
                description: 'Weighted by reputation',
                required: true
            },
        ]
    }
]

/**
 *
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @param salt - Salt to generate a hash to hide the correct button
 * @param noiseImg - Jimp preloaded noise image
 * @param clientWeb3 - Web3.storage client
 * @returns {Promise<boolean>}
 */
const processCommand = async (interaction, db, mutex, salt, noiseImg, clientWeb3) => {
    try {
        if (interaction.type ===  2)return true

        await db.read()

        logger.debug('Get guild uuid...')
        const guildUuid = Object.keys(db?.data)
            ?.find(uuid => db?.data[uuid]?.guildDiscordId === interaction?.guildId)
        logger.debug('Get guild uuid done.')

        if(await processGuild(interaction, guildUuid, db, mutex, clientWeb3))return true
        if(await processRound(interaction, guildUuid, db, mutex))return true
        if(await processUser(interaction, guildUuid, db, mutex))return true
        if(await processGrant(interaction, guildUuid, db, mutex))return true
        if(await processReputation(interaction, guildUuid, db, mutex))return true
        if(await processPrintButton(interaction, guildUuid, db, mutex))return true
        if(await processProposal(interaction, guildUuid, db, mutex))return true
        if(await processGiveaway(interaction, guildUuid, db, mutex))return true

        if(await processButton(interaction, guildUuid, db, mutex, salt, noiseImg))return true

    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Create all commands
 * @param client - Client Discord
 * @param guildDiscordId - Discord guild id
 * @returns {Promise<void>}
 */
export const createCommand = async (client, guildDiscordId) => {
    try {
        for (const command of COMMANDS) {
            await client?.application?.commands
                ?.create(command, guildDiscordId)
                ?.catch((e) => {
                    logger.error(e)
                    logger.error(`Failed to create command for ${guildDiscordId}`)
                })
        }
    } catch (e) {
        logger.error(e)
    }
}

/**
 * Delete all commands
 * @param client - Client Discord
 * @param guildDiscordId - Discord guild id
 * @returns {Promise<void>}
 */
export const deleteCommands = async (client, guildDiscordId) => {
    try {
        const commands = await client?.application?.commands
            ?.fetch()
            ?.catch(() => {
                logger.error('Failed to retrieve command.')
                return new Collection()
            })

        commands.each(async (command) => await command
            ?.delete()
            ?.catch(() => logger.error(`Failed to remove command for ${guildDiscordId}`)))
    } catch (e) {
        logger.error(e)
    }
}


export default processCommand