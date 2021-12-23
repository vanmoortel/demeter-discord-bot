import {fetchReaction} from '../../util/helperDiscord.js'
import logger from '../../../core/winston/index.js'

/**
 * Transfer one message to another channel if enough reputation react
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param isRemove - True if the author remove his reaction, false if the author react
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const transferMessage = async (messageReaction, user, isRemove, guildUuid, db, mutex) => {
    try {
        await db.read()
        if(!db?.data[guildUuid]?.reactionTransfers[messageReaction?.emoji?.name]
            || !db?.data[guildUuid]?.config?.minReputationTransfer)return true

        logger.debug('Fetch all reactions...')
        const reactions = await fetchReaction(messageReaction?.message, false)
        if (!reactions?.length)return true

        const discordIdList = reactions
            .filter(r => r?.emoji === messageReaction?.emoji?.name)
            .map(r => r?.senderDiscordId)
        logger.debug('Fetch all reactions done.')

        logger.debug('Check if enough reputation...')
        if(db?.data[guildUuid]?.config?.minReputationTransfer > [...Object.values(db?.data[guildUuid]?.users)
            .filter(u => discordIdList?.includes(u?.discordId))
            .map(u => u?.reputations[u?.reputations?.length - 1]), 0]
            .reduce((a, n) => a + n))return true
        logger.debug('Check if enough reputation done.')

        logger.debug('Transfer message...')
        const channel = await messageReaction?.message?.guild?.channels
            ?.resolve(db?.data[guildUuid]?.reactionTransfers[messageReaction?.emoji?.name])
            ?.catch(() => null)
        if (!channel) return true

        const message = await messageReaction?.message?.channel?.messages
            ?.fetch(messageReaction?.message?.id)
            ?.catch(() => null)
        if (!message) return true

        await channel
            ?.send(`${message?.author} :\n${message?.content}`, message?.attachments && message?.attachments?.size ?  [...message?.attachments?.values()] : {})
            ?.catch(() => logger.error('Failed to transfer message.'))
        await message?.channel
            ?.send(`${message?.author}, your message has been transferred by the community to ${channel}.`)
            ?.catch(() => logger.error('Failed to send notification transfer.'))
        await message
            ?.delete()
            ?.catch(() => logger.error('Failed to remove original message.'))
        logger.debug('Transfer message done.')

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
export const processReactionTransfer = async (messageReaction, user, isRemove, guildUuid, db, mutex) => {
    try {
        if (await transferMessage(messageReaction, user, isRemove, guildUuid, db, mutex)) return true

        return false
    } catch (e) {
        logger.error(e)
        await messageReaction.message.channel.send('Something went wrong...')
        return true
    }
}