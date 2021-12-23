import Moment from 'moment'
import logger from '../../core/winston/index.js'
import {fetchReaction} from '../util/helperDiscord.js'
import {findUserUuidByDiscordId} from '../user/index.js'

export const ACTION = {
    MINT: 'mint'
}

/**
 * Check if there is a proposal expired and should be ended
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @param discord - Discord object with client {client: Client}
 * @returns {Promise<boolean>}
 */
export const checkEndProposal = async (db, mutex, discord) => {
    try {
        await mutex.runExclusive(async () => {
            await db.read()
            logger.debug('Check for all guild if proposal ended...')
            for (const guildUuid in db?.data) {
                const proposals = db?.data[guildUuid]?.discordProposals

                logger.debug('Retrieve channel proposal...')
                if (!db?.data[guildUuid]?.config?.channelProposal) continue
                const channel = await discord?.client?.channels
                    ?.fetch(db?.data[guildUuid]?.config?.channelProposal)
                    ?.catch(() => null)
                if (!channel){
                    logger.debug('Retrieve channel proposal failed.')
                    continue
                }
                logger.debug('Retrieve channel proposal done.')

                for (const proposalId in proposals) {
                    const proposal = proposals[proposalId]
                    const endDate = Moment(proposal?.startDate).add(proposal?.duration, 'days')
                    console.log({proposal})
                    if (proposal?.endDate || endDate?.isAfter(Moment()))
                        continue

                    logger.debug('Retrieve proposal message...')
                    const proposalMessage = await channel?.messages
                        ?.fetch(proposal?.proposalMessageId)
                        ?.catch(() => null)
                    if (!proposalMessage) {
                        delete db.data[guildUuid].discordProposals[proposalId]
                        continue
                    }
                    logger.debug('Retrieve proposal message done.')

                    logger.debug('Fetch all reaction from this message...')
                    const reactions = await fetchReaction(proposalMessage, {})
                    logger.debug('Fetch all reaction from this message done.')

                    logger.debug('Sum all reputation in favor and against...')
                    let sumFor = 0
                    let sumForCount = 0
                    let sumAgainst = 0
                    let sumAgainstCount = 0
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
                        if (reaction.emoji === '✅'){
                            sumFor += user?.reputations[user?.reputations.length - 1] / multiple
                            sumForCount += 1 / multiple
                        }
                        if (reaction.emoji === '❌'){
                            sumAgainst += user?.reputations[user?.reputations.length - 1] / multiple
                            sumAgainstCount += 1 / multiple
                        }
                    }
                    logger.debug('Sum all reputation in favor and against done.')

                    logger.debug('End proposal and update proposal message...')
                    await proposalMessage
                        ?.edit(proposalMessage?.content.split('\n\n').slice(0, -1).join('\n\n')
                            + `\n\nThe vote is closed.`)
                        ?.catch(() => logger.error('Failed to update confirm proposal message.'))
                    db.data[guildUuid].discordProposals[proposalId].endDate = endDate.toISOString()
                    db.data[guildUuid].discordProposals[proposalId].inFavor = sumFor
                    db.data[guildUuid].discordProposals[proposalId].against = sumAgainst
                    logger.debug('Update proposal message done.')

                    const content = `✅ ${sumForCount} members(${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(sumFor)} reputations)\n`
                        + `❌ ${sumAgainstCount} members(${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(sumAgainst)} reputations)\n`

                    logger.debug('Check if enough reputation voted...')
                    if ((sumFor + sumAgainst) < db?.data[guildUuid]?.config?.minReputationToConfirmProposal){
                        await proposalMessage
                            ?.reply(content + `The proposal is aborted, there were not enough voters, only ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                                .format(sumFor + sumAgainst)} reputations out of the ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                                .format(db?.data[guildUuid]?.config?.minReputationToConfirmProposal)} reputations needed.`)
                            ?.catch(() => logger.error('Failed to update confirm proposal message.'))

                        continue
                    }
                    logger.debug('Check if enough reputation voted done.')

                    logger.debug('Check if proposal is accepted...')
                    if (sumFor < sumAgainst){
                        await proposalMessage
                            ?.reply(content + `The proposal is rejected, ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                                .format(sumAgainst)} reputations against for ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                                .format(sumFor)} reputations in favor.`)
                            ?.catch(() => logger.error('Failed to update confirm proposal message.'))

                        continue
                    }
                    logger.debug('Check if proposal is accepted done.')

                    await proposalMessage
                        ?.reply(content + `The proposal is accepted, ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                            .format(sumFor)} reputations in favor for ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2})
                            .format(sumAgainst)} reputations against.`)
                        ?.catch(() => logger.error('Failed to update confirm proposal message.'))

                    if (!proposal?.actions?.length){
                        continue
                    }

                    logger.debug('Execute actions...')
                    for(const action of proposal?.actions){
                        if (action?.type === ACTION.MINT){
                            db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1]
                                .mints[action.receiverUuid] ||= {}
                            db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1]
                                .mints[action.receiverUuid][proposal.authorUuid] ||= 0
                            db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1]
                                .mints[action.receiverUuid][proposal.authorUuid] += action?.amount
                        }
                    }
                    logger.debug('Execute actions done.')
                }
            }
            logger.debug('Check for all guild if proposal ended done.')

            await db.write()
        })
        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}