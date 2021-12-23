import logger from '../../core/winston/index.js'
import {processReactionRole} from './reactionRole/index.js'
import {processReactionTransfer} from './reactionTransfer/index.js'
import {processReactionGrant} from './reactionGrant/index.js'
import {processProposal} from './reactionProposal/index.js'

/**
 *
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param isRemove - True if the author remove his reaction, false if the author react
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processReaction = async (messageReaction, user, isRemove, db, mutex) => {
    try {
        if (messageReaction?.partial) {
            await messageReaction
                ?.fetch()
                ?.catch(() => logger.error('Failed fetch partial message'))
        }
        logger.debug(`${messageReaction.message.guild.id}: [${user.username}] ${messageReaction.emoji.name} => [${messageReaction.message.author.username}] ${messageReaction.message.content}`)

        const guildUuid = Object.keys(db?.data)
            ?.find(uuid => db?.data[uuid]?.guildDiscordId === messageReaction?.message?.guild?.id)
        if (!guildUuid) return true

        await processReactionGrant(messageReaction, user, isRemove, guildUuid, db, mutex)
        await processReactionRole(messageReaction, user, isRemove, guildUuid, db, mutex)
        await processReactionTransfer(messageReaction, user, isRemove, guildUuid, db, mutex)
        await processProposal(messageReaction, user, isRemove, guildUuid, db, mutex)
        return true
    } catch (e) {
        logger.error(e)
        await messageReaction.message.channel.send('Something went wrong...')
        return true
    }
}