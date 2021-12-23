import Moment from 'moment'
import logger from '../../../core/winston/index.js'
import {fetchReaction} from '../../util/helperDiscord.js'
import {findUserUuidByDiscordId} from '../../user/index.js'
import {ACTION} from '../../proposal/index.js'

/**
 * Add/remove vote to start a proposal, check if there is enough reputation to start this proposal
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const startProposal = async (messageReaction, user, guildUuid, db, mutex) => {
    try {
        if (messageReaction?.emoji?.name !== '✅' && messageReaction?.emoji?.name !== '❌') return false

        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Check if this message is a start proposal...')
            const proposalId = Object.keys(db?.data[guildUuid]?.discordProposals)
                ?.find(p => db?.data[guildUuid]?.discordProposals[p]?.startMessageId === messageReaction?.message?.id
                    && !db?.data[guildUuid]?.discordProposals[p].proposalMessageId)
            const proposal = db?.data[guildUuid]?.discordProposals[proposalId]
            if (!proposal) return true
            logger.debug('Check if this message is a start proposal done.')

            logger.debug('Fetch all reaction from this message...')
            const reactions = await fetchReaction(messageReaction?.message, {})
            logger.debug('Fetch all reaction from this message done.')

            logger.debug('Sum all reputation in favor and against...')
            let sumFor = 0
            let sumAgainst = 0
            for (const reaction of reactions){
                const userUuid = findUserUuidByDiscordId(reaction.senderDiscordId, db?.data[guildUuid]?.users)
                const user = userUuid
                    ? db?.data[guildUuid]?.users[userUuid]
                    : {
                        reputations: [
                            db?.data[guildUuid]?.rounds[db?.data[guildUuid]?.rounds?.length - 1]?.config?.defaultReputation
                        ]
                    }
                const multiple = reactions?.filter(r => r.senderDiscordId === reaction.senderDiscordId)?.length
                if (reaction.emoji === '✅')
                    sumFor += user?.reputations[user?.reputations.length - 1]/multiple
                if (reaction.emoji === '❌')
                    sumAgainst += user?.reputations[user?.reputations.length - 1]/multiple
            }
            logger.debug('Sum all reputation in favor and against done.')

            if (sumAgainst >= db?.data[guildUuid]?.config?.minReputationToStartProposal){
                await messageReaction?.message
                    ?.edit(messageReaction?.message?.content.split('\n\n').slice(0, -2).join('\n\n')
                        +`\n\nMore than ${db?.data[guildUuid]?.config?.minReputationToStartProposal} reputations voted against the proposal, the proposal will not be put to vote.`)
                    ?.catch(() => logger.error('Failed to update start proposal message.'))
                delete db.data[guildUuid].discordProposals[proposalId]
                await db.write()
                return true
            }

            if (sumFor < db?.data[guildUuid]?.config?.minReputationToStartProposal) return true

            logger.debug('Update start proposal message and post proposal...')
            const channel = await messageReaction?.client?.channels
                ?.fetch(db?.data[guildUuid]?.config?.channelProposal)
                ?.catch(() => null)
            if (!channel){
                logger.error('Failed to fetch proposal channel.')
                return true
            }

            const startDate = Moment()
            const endDate = Moment(startDate).add(proposal?.duration, 'days')
            let content = messageReaction?.message?.content.split('\n\n').slice(0, -2).join('\n\n')
            const actionMint = proposal?.actions?.find(a =>  a.type === ACTION.MINT)

            if (actionMint)
                content += `\n\nThis proposal will mint ${actionMint.amount} reputations to <@!${db?.data[guildUuid]?.users[actionMint.receiverUuid]?.discordId}>`
            content += `\n\nYou have until ${endDate?.format('dddd, MMMM Do YYYY, h:mm')} to vote.`

            await messageReaction?.message
                ?.edit(messageReaction?.message?.content.split('\n\n').slice(0, -2).join('\n\n')
                    +`\n\nThe proposal has reached the minimum ${db?.data[guildUuid]?.config?.minReputationToStartProposal} reputations in favor and will therefore be submitted to the vote in the ${channel}.`)
                ?.catch(() => logger.error('Failed to update start proposal message.'))

            const proposalMessage = await channel
                ?.send(content)
                ?.catch(() => null)
            if(!proposalMessage) {
                logger.error('Failed to post proposal.')
                return true
            }
            await proposalMessage
                ?.react('✅')
                ?.catch(() => logger.error('Failed to react start proposal.'))
            await proposalMessage
                ?.react('❌')
                ?.catch(() => logger.error('Failed to react start proposal.'))

            db.data[guildUuid].discordProposals[proposalId].startDate = startDate.toISOString()
            db.data[guildUuid].discordProposals[proposalId].proposalMessageId = proposalMessage.id

            await db.write()
            logger.debug('Update start proposal message and post proposal done.')
        })

        return true
    } catch (e) {
        logger.error(e)
        return true
    }
}

/**
 * Add/remove vote to mute someone, check if there is enough reputation to mute
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const mute = async (messageReaction, user, guildUuid, db, mutex) => {
    try {
        if (messageReaction?.emoji?.name !== '✅' && messageReaction?.emoji?.name !== '❌') return false

        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Check if this message is a vote to mute...')
            db.data[guildUuid].discordMutedUsers ||= {}
            const userDiscordId = Object.keys(db?.data[guildUuid]?.discordMutedUsers)
                ?.find(u => db?.data[guildUuid]?.discordMutedUsers[u]?.voteMessageId === messageReaction?.message?.id)
            const vote = db?.data[guildUuid]?.discordMutedUsers[userDiscordId]
            if (!vote) return true
            logger.debug('Check if this message is a vote to mute done.')

            logger.debug('Fetch all reaction from this message...')
            const reactions = await fetchReaction(messageReaction?.message, {})
            logger.debug('Fetch all reaction from this message done.')

            logger.debug('Sum all reputation in favor and against...')
            let sumFor = 0
            let sumAgainst = 0
            for (const reaction of reactions){
                const userUuid = findUserUuidByDiscordId(reaction.senderDiscordId, db?.data[guildUuid]?.users)
                const user = userUuid
                    ? db?.data[guildUuid]?.users[userUuid]
                    : {
                        reputations: [
                            db?.data[guildUuid]?.rounds[db?.data[guildUuid]?.rounds?.length - 1]?.config?.defaultReputation
                        ]
                    }
                const multiple = reactions?.filter(r => r.senderDiscordId === reaction.senderDiscordId)?.length
                if (reaction.emoji === '✅')
                    sumFor += user?.reputations[user?.reputations.length - 1]/multiple
                if (reaction.emoji === '❌')
                    sumAgainst += user?.reputations[user?.reputations.length - 1]/multiple
            }
            logger.debug('Sum all reputation in favor and against done.')

            if (sumAgainst >= db?.data[guildUuid]?.config?.minReputationToMute){
                await messageReaction?.message
                    ?.edit(`More than ${db?.data[guildUuid]?.config?.minReputationToMute} reputations voted against the sanction to mute <@!${userDiscordId}>.`)
                    ?.catch(() => logger.error('Failed to update vote to mute message.'))
                delete db.data[guildUuid].discordMutedUsers[userDiscordId]
                await db.write()
                return true
            }

            if (sumFor < db?.data[guildUuid]?.config?.minReputationToMute) return true

            logger.debug('Update vote mute message and enable in DB...')

            await messageReaction?.message
                ?.edit(`More than ${db?.data[guildUuid]?.config?.minReputationToMute} reputations voted in favor the sanction to mute <@!${userDiscordId}>, he will not be able to speak for ${vote?.duration} minutes..`)
                ?.catch(() => logger.error('Failed to update vote to mute message.'))

            db.data[guildUuid].discordMutedUsers[userDiscordId].startDate = Moment().toISOString()

            await db.write()
            logger.debug('Update vote mute message and enable in DB done.')
        })

        return true
    } catch (e) {
        logger.error(e)
        return true
    }
}

/**
 *
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param isRemove - True if the author remove his reaction, false if the author react
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processProposal = async (messageReaction, user, isRemove, guildUuid, db, mutex) => {
    try {

        await startProposal(messageReaction, user, guildUuid, db, mutex)
        await mute(messageReaction, user, guildUuid, db, mutex)

        return false
    } catch (e) {
        logger.error(e)
        await messageReaction.message.channel.send('Something went wrong...')
        return true
    }
}