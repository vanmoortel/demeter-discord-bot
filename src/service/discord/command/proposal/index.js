import {COMMANDS_NAME} from '../index.js'
import logger from '../../../core/winston/index.js'
import {makeDiscord} from '../../data/index.js'
import {ACTION} from '../../proposal/index.js'
import {checkCreateUserDiscord} from '../../user/index.js'

/**
 * Start a vote to start a proposal
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
const startProposal = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.PROPOSAL.START.name)?.options
        if (!options) return false

        logger.debug('Check if proposal is disabled...')
        if (!db?.data[guildUuid]?.config?.minReputationToStartProposal
            || !db?.data[guildUuid]?.config?.minReputationToConfirmProposal
            || !db?.data[guildUuid]?.config?.channelProposal) {
            await interaction
                ?.reply({content: 'Proposal is disabled.', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        logger.debug('Check if proposal is disabled done.')

        const messageUrl = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.START.MESSAGE.name)?.value || ''
        const duration = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.START.DURATION.name)?.value || 1
        const mintUser = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.START.MINT_USER.name)?.value
        const mintAmount = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.START.MINT_AMOUNT.name)?.value
        let messageId = messageUrl?.split('/')
        const channelId = messageId ? messageId[messageId.length - 2] : ''
        messageId = messageId ? messageId[messageId.length - 1] : ''

        if (!messageUrl.startsWith('https://discord.com/channels/') || !messageId || !duration || duration < 1) {
            await interaction
                ?.reply({content: 'Please provide message url and duration...', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Retrieve message and check length...')
        const channel = await interaction?.guild?.channels
            ?.fetch(channelId)
            ?.catch(() => null)
        const message = await channel?.messages
            ?.fetch(messageId)
            ?.catch(() => null)
        if (!message) {
            await interaction
                ?.reply({content: 'Something went wrong...', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        if (message?.content?.length > 1500) {
            await interaction
                ?.reply({
                    content: `Your proposal is too long ${message?.content?.length}/1500 characters.`,
                    ephemeral: true
                })
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        logger.debug('Retrieve message and check length done.')

        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Check if not already started...')
            if (db?.data[guildUuid]?.discordProposals[message.id]) {
                await interaction
                    ?.reply({
                        content: `There is already a vote for this proposal.`,
                        ephemeral: true
                    })
                    ?.catch(() => logger.error('Reply interaction failed.'))
                return true
            }
            logger.debug('Check if not already started done.')

            logger.debug('Post start message...')
            let startContent = message?.content
            if (mintUser && mintAmount)
                startContent += `\n\nThis proposal will be open to vote for ${duration} days and will mint ${mintAmount} reputations to <@!${mintUser}>`
            else
                startContent += `\n\nThis proposal will be open to vote for ${duration} days.`

            startContent += '\n\nDo you want to start a vote for the following proposal?'

            const startMessage = await channel
                ?.send(startContent)
                ?.catch(() => null)
            if (!startMessage) {
                await interaction
                    ?.reply({content: 'Something went wrong...', ephemeral: true})
                    ?.catch(() => logger.error('Reply interaction failed.'))
                return true
            }

            await startMessage
                ?.react('✅')
                ?.catch(() => logger.error('Failed to react start proposal.'))
            await startMessage
                ?.react('❌')
                ?.catch(() => logger.error('Failed to react start proposal.'))
            logger.debug('Post start message done.')

            logger.debug('Retrieve or create sender...')
            const sender = await checkCreateUserDiscord(message?.author?.id, db?.data[guildUuid], interaction?.guild)
            if (!sender) {
                await interaction
                    ?.reply({content: 'Something went wrong...', ephemeral: true})
                    ?.catch(() => logger.error('Reply interaction failed.'))
                return true
            }
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create author sender.')

            let receiver = null
            if (mintUser && mintAmount) {
                logger.debug('Retrieve or create receiver...')
                receiver = await checkCreateUserDiscord(mintUser, db?.data[guildUuid], interaction?.guild)
                if (!receiver) {
                    await interaction
                        ?.reply({content: 'Something went wrong...', ephemeral: true})
                        ?.catch(() => logger.error('Reply interaction failed.'))
                    return true
                }
                db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...receiver}
                logger.debug('Retrieve or create receiver done.')
            }

            logger.debug('Create proposal...')
            let proposal = makeDiscord.makeDiscordProposal(
                '',
                '',
                Object.keys(sender)[0],
                duration,
                startMessage.id,
            )
            if (mintUser && mintAmount)
                proposal.actions.push({
                    type: ACTION.MINT,
                    receiverUuid: Object.keys(receiver)[0],
                    amount: mintAmount
                })
            db.data[guildUuid].discordProposals[message.id] = proposal

            await db.write()
        })
        logger.debug('Create proposal done.')

        await interaction
            ?.reply({content: 'Done.', ephemeral: true})
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
 * Start a vote to mute someone
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
const startMute = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.PROPOSAL.MUTE.name)?.options
        if (!options) return false

        logger.debug('Check if vote to mute is disabled...')
        if (!db?.data[guildUuid]?.config?.minReputationToMute) {
            await interaction
                ?.reply({content: 'Mute is disabled.', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        logger.debug('Check if vote to mute is disabled done.')

        const userDiscordId = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.MUTE.USER.name)?.value || ''
        const duration = options?.find(o => o.name === COMMANDS_NAME.PROPOSAL.MUTE.DURATION.name)?.value || 1

        if (!userDiscordId || !duration || duration < 1) {
            await interaction
                ?.reply({content: 'Please provide user and duration...', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Check if not already in vote...')
            db.data[guildUuid].discordMutedUsers ||= {}
            if (db?.data[guildUuid]?.discordMutedUsers[userDiscordId]
                && !db?.data[guildUuid]?.discordMutedUsers[userDiscordId]?.startDate) {
                await interaction
                    ?.reply({
                        content: `There is already a vote to mute this user.`,
                        ephemeral: true
                    })
                    ?.catch(() => logger.error('Reply interaction failed.'))
                return true
            }
            logger.debug('Check if not already in vote done.')

            logger.debug('Post vote mute message...')
            const voteMuteMessage = await interaction.channel
                ?.send(`Do you want to mute <@!${userDiscordId}> for ${duration} minutes?`)
                ?.catch(() => null)
            if (!voteMuteMessage) {
                await interaction
                    ?.reply({content: 'Something went wrong...', ephemeral: true})
                    ?.catch(() => logger.error('Reply interaction failed.'))
                return true
            }

            await voteMuteMessage
                ?.react('✅')
                ?.catch(() => logger.error('Failed to react start proposal.'))
            await voteMuteMessage
                ?.react('❌')
                ?.catch(() => logger.error('Failed to react start proposal.'))
            logger.debug('Post start message done.')

            logger.debug('Create proposal...')
            let mute = makeDiscord.makeDiscordMute(
                '',
                duration,
                voteMuteMessage.id
            )
            db.data[guildUuid].discordMutedUsers[userDiscordId] = mute

            await db.write()
        })
        logger.debug('Create proposal done.')

        await interaction
            ?.reply({content: 'Done.', ephemeral: true})
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
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processProposal = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.PROPOSAL.name) return false

        if (!guildUuid) return true

        if (await startProposal(interaction, guildUuid, db, mutex)) return true
        if (await startMute(interaction, guildUuid, db, mutex)) return true

        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}