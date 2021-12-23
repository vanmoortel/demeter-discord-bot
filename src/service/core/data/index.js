export const makeCore = {
    /**
     * Round configuration, default is defined by guild config, but admin can customize it for each round.
     * @param defaultReputation - Default user reputation, can't be below this amount
     * @param roundDuration - Each round has a duration of a fixed amount of days.
     * @param minReputationDecay - At the end of each round, all members will grant a determined percent of their total reputation.
     * @param maxReputationDecay - At the end of each round, all members will have a determined percent of their total reputation burned in addition ton min reputation decay
     * @returns {{rolePowerMultipliers: {default: number}, reactionGrants: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultipliers: {default: number}, discordMatching: number, roundDuration: number}}
     */
    makeConfigRound: (
        defaultReputation = 1,
        roundDuration = 14,
        minReputationDecay = 0.05,
        maxReputationDecay = 0.2,
    ) => ({
        defaultReputation,
        roundDuration,
        minReputationDecay,
        maxReputationDecay,
    }),
    /**
     * User
     * @param reputations - An array with reputation of each round
     * @returns {{reputations: *[]}}
     */
    makeUser: (reputations = []) => ({
        reputations,
    }),
    /**
     * A round of a determined duration
     * @param grants - Object with receiverUuid as key and value is an object with as key senderUuid and value quantity grant{receiverUuid: {senderUuid: grant }}
     * @param mints - Object with receiverUuid as key and value is an object with as key senderUuid and value quantity grant{receiverUuid: {senderUuid: mint }}
     * @returns {{grants: {}, mints: {}}}
     */
    makeRound: (
        grants = {},
        mints = {},
    ) => ({
        grants,
        mints
    }),
}