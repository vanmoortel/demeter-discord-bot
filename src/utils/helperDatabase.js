import Moment from "moment";

/**
 * Grant configuration, default is defined by admin, but the user can customize it.
 * @param channelGrantMultiplier - Based on the channel, you can apply a multiplier to your reaction and reply grant.
 * @param replyGrant - When you reply to a message, you will automatically offer a defined quantity of reputation to the message's author.
 * @param reactionGrant - When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.
 * @returns {{reactionGrant: {default: number}, replyGrant: number, channelGrantMultiplier: {default: number}}}
 */
export const configGrant = (
    channelGrantMultiplier = {'default': 0},
    replyGrant= 2,
    reactionGrant= {'default': 1},
) => ({
    channelGrantMultiplier,
    replyGrant,
    reactionGrant
})

/**
 * Round configuration, default is defined by admin, but admin can customize it for each round.
 * @param discordMatching - At the end of each period, we use Quadratic Funding to distribute a certain amount of reputation.
 * @param roundDuration - Each round has a duration of a fixed amount of days.
 * @param reputationDecay - At the end of each round, all members will grant a determined percent of their total reputation.
 * @param rolePowerMultiplier - Here is the default multiplier applied to Quadratic Funding, depending on the role.
 * @param _configGrant
 * @returns {{rolePowerMultiplier: {default: number}, reactionGrant: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultiplier: {default: number}, discordMatching: number, roundDuration: number}}
 */
export const configRound = (
    discordMatching = 100,
    roundDuration = 7,
    reputationDecay = 0.01,
    rolePowerMultiplier = {'default': 0},
    _configGrant = configGrant() // Pay attention to TDZ, yes ES6 sucks
) => ({
    discordMatching,
    roundDuration,
    reputationDecay,
    rolePowerMultiplier,
    ..._configGrant,
})

/**
 * Server configuration
 * @param adminRole - Discord role
 * @param _configRound
 * @returns {{rolePowerMultiplier: {default: number}, reactionGrant: {default: number}, reputationDecay: number, replyGrant: number, adminRole, channelGrantMultiplier: {default: number}, discordMatching: number, roundDuration: number}}
 */
export const configServer = (
    adminRole,
    _configRound=configRound()
) => ({
    adminRole,
    ..._configRound
})

/**
 * To perform the Quadratic Funding, we divide the time into rounds of the determined time.
 * @param config - Round configuration
 * @param startDate - Start date of this round
 * @param endDate - End date of this round
 * @param grants - List of all grants
 * @param mints - List of all mints
 * @returns {{grants: { receiverDiscordId: { senderDiscordId: 1 } }, mints: { receiverDiscordId: { senderDiscordId: 1 } }, endDate: string, config: {rolePowerMultiplier: {default: number}, reactionGrant: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultiplier: {default: number}, discordMatching: number, roundDuration: number}, startDate: string}}
 */
export const round = (
    config = configRound(),
    startDate = Moment().toISOString(),
    endDate = '',
    grants = {},
    mints = {}) => ({
    config,
    startDate,
    endDate,
    grants,
    mints
})

/**
 * Discord User
 * @param creationDate - Date when the user is created
 * @param wallet - Public key or ENS
 * @param reputation - Array of total reputation of each round
 * @param config - User configuration
 * @returns {{wallet: string, reputation: [number], creationDate: string, config: {reactionGrant: {default: number}, replyGrant: number, channelGrantMultiplier: {default: number}}}}
 */
export const user = (
    creationDate = Moment().toISOString(),
    wallet='',
    reputation=[],
    config=configGrant()
) => ({
    creationDate,
    wallet,
    reputation,
    config
})

/***
 *
 * @param config - Server configuration
 * @param creationDate - Creation date of this guild
 * @param rounds - Array of round
 * @param users - Array of users
 * @returns {{creationDate: string, config: {rolePowerMultiplier: {default: number}, reactionGrant: {default: number}, reputationDecay: number, replyGrant: number, adminRole, channelGrantMultiplier: {default: number}, discordMatching: number, roundDuration: number}, rounds: [round], users: [user]}}
 */
export const guild = (
    config=configServer(),
    creationDate=Moment().toISOString(),
    rounds=[],
    users=[]
) => ({
    creationDate,
    config,
    rounds,
    users
})