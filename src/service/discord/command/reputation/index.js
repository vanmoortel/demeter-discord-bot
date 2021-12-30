import Moment from 'moment'
import {Permissions} from 'discord.js'
import {COMMANDS_NAME} from '../index.js'
import {checkGrant, distributeReputation} from '../../../core/reputation/index.js'
import {checkCreateUserDiscord} from '../../user/index.js'
import {loadReactionReply} from '../../util/helperDiscord.js'
import {makeRound, makeRoundConfigFromGuildConfig, makeUserConfigFromGuildConfig} from '../../../core/index.js'
import {makeCore} from '../../../core/data/index.js'
import logger from '../../../core/winston/index.js'

/**
 * Print member sorted by reputation for last round
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
const reputationTop = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.TOP.name)?.options

        const start = options?.find(o => o.name === COMMANDS_NAME.REPUTATION.TOP.START.name)?.value || 0

        if (start < 0) {
            await interaction
                ?.reply(`Need to be > 0`)
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Sort user by reputation...')
        const users = Object.values(db.data[guildUuid].users)
            .sort((a, b) => b.reputations[b.reputations.length - 1] - a.reputations[a.reputations.length - 1])
        logger.debug('Sort user by reputation done.')

        await interaction
            ?.reply({
                content: users
                    .slice(start, start + 20)
                    .map((u, i) => `${i + start + 1} - <@!${u.discordId}> => ${new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(u.reputations[u.reputations.length - 1])} reputations`)
                    .join('\n'),
                ephemeral: true
            })
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
 * Recompute reputation history without erase old grant
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const recomputeReputation = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.RECOMPUTE_REPUTATION.name)?.options

        if (!options) return false

        let useGuildConfig = options.find(o => o.name === COMMANDS_NAME.REPUTATION.RECOMPUTE_REPUTATION.USE_GUILD_CONFIG.name)?.value

        await interaction
            ?.reply({
                content: 'Processing...(This can be quite long if there are many rounds/grants)',
                ephemeral: true
            })
            ?.catch(() => logger.error('Reply interaction failed.'))

        await mutex.runExclusive(async () => {
            await db.read()

            if (useGuildConfig)
                db.data[guildUuid].rounds = db.data[guildUuid].rounds
                    .map(r => ({...r, config: makeRoundConfigFromGuildConfig(db.data[guildUuid].config)}))

            for (const round in db.data[guildUuid].rounds) {
                if (!db.data[guildUuid].rounds[parseInt(round)].endDate) break

                logger.debug(`Distribute reputation round ${round}...`)
                const {users} = await distributeReputation(
                    db.data[guildUuid],
                    db.data[guildUuid].rounds.length - parseInt(round) - 1,
                    {client: interaction.client})
                if (!users) throw Error(`Failed to distribute reputation round ${round}.`)
                logger.debug(`Distribute reputation round ${round} done.`)

                logger.debug(`Update reputation round ${round}...`)
                for (const user in db.data[guildUuid].users) {
                    db.data[guildUuid].users[user].reputations[parseInt(round) + 1] = users[user]
                }
                logger.debug(`Update reputation round ${round} done.`)
            }
            await db.write()
        })

        await interaction?.channel
            ?.send('Done !')
            ?.catch(() => logger.error('Send message failed.'))
        return true
    } catch (e) {
        logger.error(e)
        await interaction?.channel
            ?.send('Something went wrong...')
            ?.catch(() => logger.error('Send message failed.'))
        return true
    }
}

/**
 * Reload Discord history and compute round based on reaction and grants(ATTENTION this will erase all rounds and reputation)
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const fetchHistory = async (interaction, guildUuid, db, mutex) => {
    try {
        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.REPUTATION.FETCH_HISTORY.name)?.options

        if (!options) return false

        let startDate = options.find(o => o.name === COMMANDS_NAME.REPUTATION.FETCH_HISTORY.START_DATE.name)?.value
        if (!startDate) return true

        startDate = Moment(startDate, 'DD/MM/YYYY').startOf('day')

        await interaction
            ?.reply({
                content: 'Loading...(This can be quite long if there are many messages)',
                ephemeral: true
            })
            ?.catch(() => logger.error('Reply interaction failed.'))

        logger.debug('Load reactions and replies...')
        const [reactions, replies] = await loadReactionReply(
            startDate,
            interaction.guild,
            db.data[guildUuid]?.config?.channelPantheons
        )
        if (!reactions.length && !replies.length) {
            await interaction?.channel
                ?.send('Nothing found !')
                ?.catch(() => logger.error('Send message failed.'))
            return true
        }
        logger.debug('Load reactions and replies done.')

        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Erase all rounds...')
            db.data[guildUuid].rounds = []
            logger.debug('Erase all rounds done.')

            logger.debug('Erase reputations and config for all users...')
            for (const user in db.data[guildUuid].users)
                db.data[guildUuid].users[user].reputations = [db.data[guildUuid].config.defaultReputation]
                db.data[guildUuid].users[user].config = makeUserConfigFromGuildConfig(db.data[guildUuid].config)
            logger.debug('Erase reputations and config for all users done.')

            while (startDate.isBefore(Moment())) {
                logger.debug('Push new empty round...')
                const roundConfig = makeRoundConfigFromGuildConfig(db.data[guildUuid].config)
                db.data[guildUuid].rounds.push(makeRound(
                    makeCore.makeRound(),
                    startDate.toISOString(),
                    '',
                    roundConfig))
                logger.debug('Push new empty round done.')

                const endDate = Moment(startDate)
                    .add(roundConfig.roundDuration - 1, 'days')
                    .endOf('days')
                let grants = {}

                logger.debug('Process all reactions where sender/receiver is not demeter bot and during the round duration...')
                for (const reaction of reactions.filter(r =>
                    r.senderDiscordId !== interaction.client.user.id && r.receiverDiscordId !== interaction.client.user.id &&
                    r.date.isAfter(startDate) && r.date.isBefore(endDate))) {

                    const sender = await checkCreateUserDiscord(reaction.senderDiscordId, db.data[guildUuid], interaction.guild)
                    if (!sender) continue
                    db.data[guildUuid].users = {...db.data[guildUuid].users, ...sender}

                    const receiver = await checkCreateUserDiscord(reaction.receiverDiscordId, db.data[guildUuid], interaction.guild)
                    if (!receiver) continue
                    db.data[guildUuid].users = {...db.data[guildUuid].users, ...receiver}

                    const senderConfig = Object.values(sender)[0].config
                    let quantity = senderConfig.reactionGrants[reaction.emoji] || senderConfig.reactionGrants['default']
                    quantity *= senderConfig.channelGrantMultipliers[reaction.channel] || senderConfig.channelGrantMultipliers['default']

                    if (!checkGrant(Object.keys(sender)[0], Object.keys(receiver)[0], quantity)) continue

                    grants[Object.keys(receiver)[0]] ||= {}
                    grants[Object.keys(receiver)[0]][Object.keys(sender)[0]] ||= 0
                    grants[Object.keys(receiver)[0]][Object.keys(sender)[0]] += quantity

                }
                logger.debug('Process all reactions where sender/receiver is not demeter bot and during the round duration done.')

                logger.debug('Process all replies where sender/receiver is not demeter bot and during the round duration...')
                for (const reply of replies.filter(r =>
                    r.senderDiscordId !== interaction.client.user.id && r.receiverDiscordId !== interaction.client.user.id &&
                    r.date.isAfter(startDate) && r.date.isBefore(endDate))) {

                    const sender = await checkCreateUserDiscord(reply.senderDiscordId, db.data[guildUuid], interaction.guild)
                    if (!sender) continue
                    db.data[guildUuid].users = {...db.data[guildUuid].users, ...sender}

                    const receiver = await checkCreateUserDiscord(reply.receiverDiscordId, db.data[guildUuid], interaction.guild)
                    if (!receiver) continue
                    db.data[guildUuid].users = {...db.data[guildUuid].users, ...receiver}

                    const senderConfig = Object.values(sender)[0].config
                    let quantity = senderConfig.replyGrant
                    quantity *= senderConfig.channelGrantMultipliers[reply.channel] || senderConfig.channelGrantMultipliers['default']

                    if (!checkGrant(reply.senderDiscordId, reply.receiverDiscordId, quantity)) continue

                    grants[Object.keys(receiver)[0]] ||= {}
                    grants[Object.keys(receiver)[0]][Object.keys(sender)[0]] ||= 0
                    grants[Object.keys(receiver)[0]][Object.keys(sender)[0]] += quantity
                }
                logger.debug('Process all replies where sender/receiver is not demeter bot and during the round duration done.')

                logger.debug('Update round with grants and end date...')
                db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1].grants = grants
                db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1].endDate = endDate.isAfter(Moment()) ? undefined : endDate.toISOString()
                logger.debug('Update round with grants and end date done.')

                logger.debug('Check if this round is ended to distribute reputation...')
                if (endDate.isBefore(Moment())) {
                    const {users} = await distributeReputation(db.data[guildUuid], 0, {client: interaction.client})
                    for (const user in db.data[guildUuid].users)
                        db.data[guildUuid].users[user].reputations.push(users[user])
                }
                logger.debug('Check if this round is ended to distribute reputation done.')

                logger.debug('Set next start date...')
                startDate = Moment(startDate).add(roundConfig.roundDuration, 'days')
                logger.debug('Set next start date done.')
            }

            await db.write()
        })

        await interaction?.channel
            ?.send('Done !')
            ?.catch(() => logger.error('Send message failed.'))
        return true
    } catch (e) {
        logger.error(e)
        await interaction?.channel
            ?.send('Something went wrong...')
            ?.catch(() => logger.error('Send message failed.'))
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
export const processReputation = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.REPUTATION.name) return false

        if (!guildUuid) return true

        const isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            || interaction.member.roles.cache.has(db.data[guildUuid]?.config?.adminRole)

        if (isAdmin) {
            if (await recomputeReputation(interaction, guildUuid, db, mutex)) return true
            if (await fetchHistory(interaction, guildUuid, db, mutex)) return true
        }

        if (await reputationTop(interaction, guildUuid, db, mutex)) return true

        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}