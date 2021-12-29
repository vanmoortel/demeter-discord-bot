import {COMMANDS_NAME} from "../index.js";
import logger from "../../../core/winston/index.js";
import {fetchReaction} from "../../util/helperDiscord.js";
import {findUserUuidByDiscordId} from "../../user/index.js";

/**
 * Select one user based on their reputation
 * @param discordIdList - List of user Discord ID who react to the message
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
const giveawayWeighted = async (discordIdList, interaction, guildUuid, db, mutex) => {
    try {

        logger.debug('Get all users...')
        const userUuidList = discordIdList
            ?.map(id => findUserUuidByDiscordId(id, db?.data[guildUuid]?.users))
            ?.filter(Boolean)
        logger.debug('Get all users done.')

        logger.debug('Sum all of reputation...')
        const sum = userUuidList
            ?.map(u => db?.data[guildUuid]?.users[u]?.reputations[db?.data[guildUuid]?.users[u]?.reputations?.length - 1])
            ?.reduce((a, n) => a + n)
        logger.debug('Sum all of reputation done.')

        logger.debug('Pick one member weighted by reputation...')
        let random = Math.random() * sum
        for(let i = 0; i < userUuidList?.length; i++){
            const userUuid = userUuidList[i]
            const reputation = db?.data[guildUuid]?.users[userUuid]?.reputations[db?.data[guildUuid]?.users[userUuid]?.reputations?.length - 1]
            if (random < reputation){
                await interaction?.channel
                    ?.send({content: `Congratulations <@!${db?.data[guildUuid]?.users[userUuid]?.discordId}>, you won the giveaway!`})
                    ?.catch(() => logger.error('Send message failed.'))
                break
            }
            random -= reputation
        }
        logger.debug('Pick one member weighted by reputation done.')

        await interaction
            ?.reply({content: 'Done !', ephemeral: true})
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
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processGiveaway = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.GIVEAWAY.name) return false

        const messageUrl = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.GIVEAWAY.MESSAGE.name)?.value || ''
        const weighted = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.GIVEAWAY.WEIGHTED.name)?.value || false

        let messageId = messageUrl?.split('/')
        const channelId = messageId ? messageId[messageId.length - 2] : ''
        messageId = messageId ? messageId[messageId.length - 1] : ''

        if(!messageId){
            await interaction
                ?.reply({content: 'Please provide the message url...', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        logger.debug('Retrieve message...')
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
        logger.debug('Retrieve message done.')

        logger.debug('Fetch all reaction from this message...')
        const reactions = await fetchReaction(message, {})
        logger.debug('Fetch all reaction from this message done.')

        logger.debug('Keep only distinct sender...')
        const discordIdList = reactions?.map((r) => r.senderDiscordId)?.filter((v, i, a) => a.indexOf(v) === i)
        logger.debug('Keep only distinct sender done.')

        if (weighted && await giveawayWeighted(discordIdList, interaction, guildUuid, db, mutex)) return true
        if (!weighted){
            const rng = (min, max) => {
                min = Math.ceil(min)
                max = Math.floor(max)
                return Math.floor(Math.random() * (max - min)) + min
            }
            await interaction?.channel
                ?.send({content: `Congratulations <@!${discordIdList[rng(0, discordIdList?.length)]}>, you won the giveaway!`})
                ?.catch(() => logger.error('Send message failed.'))

            await interaction
                ?.reply({content: 'Done !', ephemeral: true})
                ?.catch(() => logger.error('Reply interaction failed.'))
            return true
        }

        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}