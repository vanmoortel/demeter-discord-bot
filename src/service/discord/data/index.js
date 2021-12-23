export const makeDiscord = {
    /**
     * Grant configuration, default is defined by admin for a guild or specific round, but the user can customize it.
     * @param channelGrantMultipliers - Based on the channel, you can apply a multiplier to your reaction and reply grant.
     * @param replyGrant - When you reply to a message, you will automatically offer a defined quantity of reputation to the message's author.
     * @param reactionGrants - When you react to a message, you will automatically grant a determined amount of reputation based on the emoji you choose.
     * @returns {{reactionGrants: {default: number}, replyGrant: number, channelGrantMultipliers: {default: number}}}
     */
    makeConfigUser: (
        channelGrantMultipliers = {'default': 1},
        replyGrant = 2,
        reactionGrants = {'default': 1},
    ) => ({
        channelGrantMultipliers,
        replyGrant,
        reactionGrants
    }),

    /**
     * Round configuration, default is defined by guild config, but admin can customize it for each round.
     * @param discordMatching - At the end of each period, we use Quadratic Funding to distribute a certain amount of reputation.
     * @param rolePowerMultipliers - Here is the default multiplier applied to Quadratic Funding, depending on the role.
     * @param configUser - Default user config
     * @returns {{rolePowerMultipliers: {default: number}, reactionGrants: {default: number}, reputationDecay: number, replyGrant: number, channelGrantMultipliers: {default: number}, discordMatching: number, roundDuration: number}}
     */
    makeConfigRound: (
        discordMatching = 0.2,
        rolePowerMultipliers = {'default': 0},
        configUser = makeDiscord.makeConfigUser(),
    ) => ({
        discordMatching,
        rolePowerMultipliers,
        ...configUser,
    }),

    /**
     *
     * @param adminRole - Discord admin role
     * @param captchaRole - Discord role applied when user solve captcha
     * @param minReputationTransfer - Min reputation to transfer a message (0=disabled)
     * @param minReputationToStartProposal - Min reputation to start a vote to make a proposal (0=disabled)
     * @param minReputationToConfirmProposal - Min reputation to accept the result of a proposal (0=disabled)
     * @param channelProposal - Where to post the proposal vote
     * @param minReputationToMute - Min reputation to mute someone (0=disabled)
     * @param channelPantheons - Channel where the reputation grant when react is redirect to mention instead of author
     * @returns {{minReputationTransfer: number, minReputationToMute: number, channelPantheons: {}, adminRole: string, minReputationToStartProposal: number, minReputationToConfirmProposal: number, captchaRole: string, channelProposal: string}}
     */
    makeConfigGuild: (
        adminRole='',
        captchaRole='',
        minReputationTransfer=0,
        minReputationToStartProposal=0,
        minReputationToConfirmProposal=0,
        channelProposal='',
        minReputationToMute=0,
        channelPantheons = {},
        ) => ({
        adminRole,
        captchaRole,
        minReputationTransfer,
        minReputationToStartProposal,
        minReputationToConfirmProposal,
        channelProposal,
        minReputationToMute,
        channelPantheons,
    }),

    /**
     *
     * @param discordId - User discord id
     * @param displayName - User discord name
     * @returns {{discordId: string, displayName: string}}
     */
    makeUser: (
        discordId='',
        displayName = '',
        ) => ({
        discordId,
        displayName,
    }),

    /**
     * Discord proposal
     * @param startDate - When the vote start
     * @param endDate - When the vote end
     * @param authorUuid - User unique identifier of author of this proposal
     * @param duration - How much day
     * @param startMessageId - Discord message Id of vote to start a proposal
     * @param proposalMessageId - Discord message Id of proposal
     * @param inFavor - How much reputation in favor
     * @param against - How much reputation against
     * @param actions - Action to executue if proposal is accepted
     * @returns {{duration: number, inFavor: number, endDate: string, authorUuid: string, against: number, startMessageId: string, actions: *[], startDate: string, proposalMessageId: string}}
     */
    makeDiscordProposal: (
        startDate='',
        endDate='',
        authorUuid = '',
        duration = 3,
        startMessageId = '',
        proposalMessageId = '',
        inFavor = 0,
        against = 0,
        actions=[]
        ) => ({
        startDate,
        endDate,
        authorUuid,
        duration,
        startMessageId,
        proposalMessageId,
        inFavor,
        against,
        actions,
    }),

    /**
     *
     * @param startDate - When the user is muted
     * @param duration - How much minutes
     * @param voteMessageId - Message is of the vote
     * @returns {{duration: number, voteMessageId: string, startDate: string}}
     */
    makeDiscordMute: (
        startDate='',
        duration=0,
        voteMessageId='',
        ) => ({
        startDate,
        duration,
        voteMessageId,
    }),

    /**
     *
     * @param guildDiscordId - Guild Discord id
     * @param reactionRoles - For this message add role when user react {messageId: {reaction: role}}
     * @param reputationRoles - Add/remove this role if enough reputation {role: minReputation}
     * @param reactionTransfers - If user react transfer message to this channel {reaction: channel}
     * @param discordProposals - Discord proposals {sourceMessageId: DiscordProposal}
     * @param discordMutedUsers - User muted {userDiscordId: DiscordMute}
     * @returns {{discordMutedUsers: {}, reactionTransfers: {}, discordProposals: {}, reputationRoles: {}, guildDiscordId, reactionRoles: {}}}
     */
    makeGuild: (
        guildDiscordId,
        reactionRoles={},
        reputationRoles={},
        reactionTransfers={},
        discordProposals= {},
        discordMutedUsers= {},
        ) => ({
        guildDiscordId,
        reactionRoles,
        reputationRoles,
        reactionTransfers,
        discordProposals,
        discordMutedUsers
    })
}