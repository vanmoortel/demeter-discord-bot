import logger from '../../../core/winston/index.js'

/**
 * Add or remove a role based on reaction
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param isRemove - True if the author remove his reaction, false if the author react
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const addRemoveRole = async (messageReaction, user, guildUuid, isRemove, db, mutex) => {
    try {
        await db.read()

        if (!db?.data[guildUuid]?.reactionRoles[messageReaction?.message?.id]
            || !db?.data[guildUuid]?.reactionRoles[messageReaction?.message?.id][messageReaction?.emoji?.name]) return false

        const member = await messageReaction?.message?.guild?.members
            ?.fetch(user?.id)
            ?.catch(() => null)
        if (!member) return true

        if (!isRemove)
            member?.roles
                ?.add(db?.data[guildUuid]?.reactionRoles[messageReaction?.message?.id][messageReaction?.emoji?.name])
                ?.catch(() => logger.error('Failed to add role.'))
        else
            member?.roles
                ?.remove(db?.data[guildUuid]?.reactionRoles[messageReaction?.message?.id][messageReaction?.emoji?.name])
                ?.catch(() => logger.error('Failed to remove role.'))

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
export const processReactionRole = async (messageReaction, user, isRemove, guildUuid, db, mutex) => {
    try {

        if (await addRemoveRole(messageReaction, user, isRemove, guildUuid, db, mutex)) return true

        return false
    } catch (e) {
        logger.error(e)
        await messageReaction.message.channel.send('Something went wrong...')
        return true
    }
}