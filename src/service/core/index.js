import Moment from 'moment'
import {makeCore} from './data/index.js'
import {makeDiscord} from '../discord/data/index.js'

/**
 *
 * @param discord - config user for discord
 * @returns {{replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}}}
 */
export const makeConfigUser = (
    discord=makeDiscord.makeConfigUser()
) => ({
    ...discord
})

/**
 *
 * @param core
 * @param discord
 * @returns {{rolePowerMultipliers: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}, discordMatching: number, roundDuration: number}}
 */
export const makeConfigRound = (
    core=makeCore.makeConfigRound(),
    discord=makeDiscord.makeConfigRound()
) => ({
    ...core,
    ...discord
})

/**
 *
 * @param discord
 * @param configRound
 * @returns {{reputationDecay: number, replyGrant: number, minReputationTransfer: number, minReputationToMute: number, channelGrantMultipliers: {default: number}, adminRole: string, minReputationToConfirmProposal: number, discordMatching: number, captchaRole: string, channelProposal: string, roundDuration: number, rolePowerMultipliers: {default: number}, channelPantheons: {}, minReputationToStartProposal: number, reactionGrants: {default: number}}}
 */
export const makeConfigGuild = (
    discord=makeDiscord.makeConfigGuild(),
    configRound=makeConfigRound()
) => ({
    ...discord,
    ...configRound
})

/**
 *
 * @param core
 * @param discord
 * @param creationDate
 * @param wallet
 * @param config
 * @returns {{reputations: *[], discordId: string, wallet: string, displayName: string, creationDate: string, config: {replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}}}}
 */
export const makeUser = (
    core=makeCore.makeUser(),
    discord=makeDiscord.makeUser(),
    creationDate = Moment().toISOString(),
    wallet='',
    config=makeConfigUser()
) => ({
    ...core,
    ...discord,
    creationDate,
    wallet,
    config
})

/**
 *
 * @param core
 * @param startDate
 * @param endDate
 * @param config
 * @returns {{grants: {}, mints: {}, endDate: string, config: {rolePowerMultipliers: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}, discordMatching: number, roundDuration: number}, startDate: string}}
 */
export const makeRound = (
    core=makeCore.makeRound(),
    startDate = Moment().toISOString(),
    endDate = '',
    config=makeConfigRound(),
) => ({
    ...core,
    startDate,
    endDate,
    config
})

/**
 *
 * @param discord
 * @param creationDate
 * @param rounds
 * @param users
 * @param config
 * @returns {{discordMutedUsers: {}, reactionTransfers: {}, discordProposals: {}, reputationRoles: {}, guildDiscordId: *, creationDate: string, config: {reputationDecay: number, replyGrant: number, minReputationTransfer: number, minReputationToMute: number, channelGrantMultipliers: {default: number}, adminRole: string, minReputationToConfirmProposal: number, discordMatching: number, captchaRole: string, channelProposal: string, roundDuration: number, rolePowerMultipliers: {default: number}, channelPantheons: {}, minReputationToStartProposal: number, reactionGrants: {default: number}}, rounds: *[], users: {}, reactionRoles: {}}}
 */
export const makeGuild = (
    discord=makeDiscord.makeGuild(),
    creationDate=Moment().toISOString(),
    rounds=[],
    users = {},
    config=makeConfigGuild()
) => ({
    ...discord,
    creationDate,
    rounds,
    users,
    config
})

/**
 *
 * @param guildConfig
 * @returns {{rolePowerMultipliers: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}, discordMatching: number, roundDuration: number}}
 */
export const makeRoundConfigFromGuildConfig = (guildConfig) => makeConfigRound(
    makeCore.makeConfigRound(
        guildConfig.defaultReputation,
        guildConfig.roundDuration,
        guildConfig.minReputationDecay,
        guildConfig.maxReputationDecay,
    ),
    makeDiscord.makeConfigRound(
        guildConfig.discordMatching,
        guildConfig.rolePowerMultipliers,
        makeDiscord.makeConfigUser(
            guildConfig.channelGrantMultipliers,
            guildConfig.replyGrant,
            guildConfig.reactionGrants,
        )
    )
)

/**
 *
 * @param guildConfig
 * @returns {{replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}}}
 */
export const makeUserConfigFromGuildConfig = (guildConfig) => makeConfigUser(
    makeDiscord.makeConfigUser(
        guildConfig.channelGrantMultipliers,
        guildConfig.replyGrant,
        guildConfig.reactionGrants
    )
)

/**
 *
 * @param roundConfig
 * @returns {{replyGrant: number, channelGrantMultipliers: {default: number}, reactionGrants: {default: number}}}
 */
export const makeUserConfigFromRoundConfig = (roundConfig) => makeConfigUser(
    makeDiscord.makeConfigUser(
        roundConfig.channelGrantMultipliers,
        roundConfig.replyGrant,
        roundConfig.reactionGrants
    )
)
