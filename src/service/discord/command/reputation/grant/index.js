import Moment from 'moment'
import {checkCreateUserDiscord, findUserUuidByDiscordId} from '../../../user/index.js'
import logger from '../../../../core/winston/index.js'
import {COMMANDS_NAME} from '../../index.js'
import {checkGrant, normalizeReceivedGrant, normalizeSentGrant} from '../../../../core/reputation/index.js'

/**
 * Print for one user and a specific round, mint, grant sent and received normalized based on sender reputation
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
const grantList = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.GRANT_LIST.name)?.options

        if (!options) return false

        const guildDb = db?.data[guildUuid]

        const discordId = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_LIST.USER.name)?.value
        const shift = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_LIST.ROUND.name)?.value || 0

        logger.debug('Get round...')
        if (guildDb.rounds.length <= shift) {
            await interaction
                ?.reply(`Only ${guildDb.rounds.length} rounds available.`)
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        const round = guildDb.rounds[guildDb.rounds.length - 1 - shift]
        logger.debug('Get round done.')

        logger.debug('Get user...')
        const userUuid = findUserUuidByDiscordId(discordId, guildDb.users)
        if (!userUuid) {
            await interaction?.reply({
                content:
                    `<@!${discordId}>\n` +
                    `Round ${Moment(round.startDate).format('MMMM Do YYYY')} - ${shift
                        ? Moment(round.endDate).format('MMMM Do YYYY')
                        : Moment(round.startDate).add(round.config.roundDuration, 'days').format('MMMM Do YYYY')}\n\n` +
                    `👏 - 0 grant(s) sent: \n\n` +
                    `\n\n🎁 - 0 grant(s) received: \n\n` +
                    `\n\n🖨 - 0 mint(s): \n\n`, ephemeral: true
            })
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }
        logger.debug('Get user done.')

        logger.debug('Normalize all grants/mints...')
        const grantReceived = normalizeReceivedGrant(round.grants, userUuid, guildDb.users, round.config.minReputationDecay, shift)
        const grantSent = normalizeSentGrant(round.grants, userUuid, guildDb.users, round.config.minReputationDecay, shift)
        const mint = round.mints[userUuid] || {}
        logger.debug('Normalize all grants/mints done.')

        await interaction.reply({
                content:
                    `<@!${discordId}>\n` +
                    `Round ${Moment(round.startDate).format('MMMM Do YYYY')} - ${shift
                        ? Moment(round.endDate).format('MMMM Do YYYY')
                        : Moment(round.startDate).add(round.config.roundDuration, 'days').format('MMMM Do YYYY')}\n\n` +

                    `👏 - ${Object.keys(grantSent).length} grant(s) sent: \n` +
                    Object.keys(grantSent)
                        .sort((a, b) => grantSent[b] - grantSent[a])
                        .slice(0, 10)
                        .map((sender) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(grantSent[sender])} reputations to ${guildDb.users[sender]?.discordId
                            ? `<@!${guildDb.users[sender]?.discordId}>`
                            : (guildDb.users[sender]?.displayName || 'Missing member')}`).join('\n') +

                    `\n\n🎁 - ${Object.keys(grantReceived).length} grant(s) received: \n` +
                    Object.keys(grantReceived)
                        .sort((a, b) => grantReceived[b] - grantReceived[a])
                        .slice(0, 10)
                        .map((receiver) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(grantReceived[receiver])} reputations from ${guildDb.users[receiver]?.discordId
                            ? `<@!${guildDb.users[receiver]?.discordId}>`
                            : (guildDb.users[receiver]?.displayName || 'Missing member')}`).join('\n') +

                    `\n\n🖨 - ${Object.keys(mint).length} mint(s)\n` +
                    Object.keys(mint).map((receiver) => `${new Intl.NumberFormat('en-US', {maximumFractionDigits: 6}).format(mint[receiver])} reputations from ${guildDb.users[receiver]?.discordId
                        ? `<@!${guildDb.users[receiver]?.discordId}>`
                        : (guildDb.users[receiver]?.displayName || 'Missing member')}`).join('\n'), ephemeral: true
            }
        )

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
 * Update grant sent to one user for this round
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const grantSet = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.GRANT_SET.name)?.options

        if (!options) return false

        const receiverDiscordId = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_SET.USER.name)?.value
        const amount = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_SET.AMOUNT.name)?.value

        let sender = null
        let receiver = null
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create author command...')
            sender = await checkCreateUserDiscord(interaction.member.id, db?.data[guildUuid], interaction?.guild)
            if (!sender) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create author command done.')

            logger.debug('Retrieve or create receiver command...')
            receiver = await checkCreateUserDiscord(receiverDiscordId, db?.data[guildUuid], interaction?.guild)
            if (!receiver) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...receiver}
            logger.debug('Retrieve or create receiver command done.')

            await db.write()
        })
        if (!sender || !receiver) {
            logger.error('Failed to create users command.')
            return true
        }

        const senderUuid = Object.keys(sender)[0]
        const receiverUuid = Object.keys(receiver)[0]
        if (!senderUuid || !receiverUuid) {
            logger.error('Failed to create users command.')
            return true
        }

        if (!checkGrant(senderUuid, receiverUuid, amount)) {
            await interaction
                ?.reply({content: 'You can\'t grant yourself or give negative amount.', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Update grant quantity...')
        await mutex.runExclusive(async () => {
            await db.read()

            const roundLength = db.data[guildUuid].rounds.length

            db.data[guildUuid].rounds[roundLength - 1]
                .grants[receiverUuid] ||= {}

            db.data[guildUuid].rounds[roundLength - 1]
                .grants[receiverUuid][senderUuid] = quantity

            await db.write()
        })
        logger.debug('Update grant quantity done.')

        await interaction
            ?.reply({content: 'Update saved !', ephemeral: true})
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
 * Add more grant to one user for this round
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const grantAdd = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.GRANT_ADD.name)?.options

        if (!options) return false

        const receiverDiscordId = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_ADD.USER.name)?.value
        const amount = options.find(o => o.name === COMMANDS_NAME.REPUTATION.GRANT_ADD.AMOUNT.name)?.value
        if (!amount) return true

        let sender = null
        let receiver = null
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create author command...')
            sender = await checkCreateUserDiscord(interaction.member.id, db?.data[guildUuid], interaction?.guild)
            if (!sender) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create author command done.')

            logger.debug('Retrieve or create receiver command...')
            receiver = await checkCreateUserDiscord(receiverDiscordId, db?.data[guildUuid], interaction?.guild)
            if (!receiver) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...receiver}
            logger.debug('Retrieve or create receiver command done.')

            await db.write()
        })
        if (!sender || !receiver) {
            logger.error('Failed to create users command.')
            return true
        }

        const senderUuid = Object.keys(sender)[0]
        const receiverUuid = Object.keys(receiver)[0]
        if (!senderUuid || !receiverUuid) {
            logger.error('Failed to create users command.')
            return true
        }

        if (!checkGrant(senderUuid, receiverUuid, amount)) {
            await interaction
                ?.reply({content: 'You can\'t grant yourself or give negative amount.', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Add grant quantity...')
        await mutex.runExclusive(async () => {
            await db.read()

            const roundLength = db.data[guildUuid].rounds.length

            db.data[guildUuid].rounds[roundLength - 1]
                .grants[receiverUuid] ||= {}

            db.data[guildUuid].rounds[roundLength - 1]
                .grants[receiverUuid][senderUuid] ||= 0

            db.data[guildUuid].rounds[roundLength - 1]
                .grants[receiverUuid][senderUuid] += quantity

            await db.write()
        })
        logger.debug('Add grant quantity done.')

        await interaction
            ?.reply({content: 'Update saved !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        await interaction.channel.send(`<@!${interaction.member.id}> just offered some of his reputation to <@!${receiverDiscordId}>!`)

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
export const processGrant = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.REPUTATION.name) return false

        if (!guildUuid) return true

        if (await grantList(interaction, guildUuid, db, mutex)) return true
        if (await grantSet(interaction, guildUuid, db, mutex)) return true
        if (await grantAdd(interaction, guildUuid, db, mutex)) return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}