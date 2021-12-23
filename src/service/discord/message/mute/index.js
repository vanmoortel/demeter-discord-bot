import Moment from 'moment'
import logger from '../../../core/winston/index.js'

/**
 * Remove message if user is muted
 * @param message - Discord message
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processMute = async (message, guildUuid, db, mutex) => {
    try {
        if (!guildUuid || message?.author?.id === message?.client?.user?.id || !db?.data[guildUuid]?.discordMutedUsers) return false

        logger.debug('Check if muted...')
        if (!db?.data[guildUuid]?.discordMutedUsers[message?.author?.id]
            || Moment(db?.data[guildUuid]?.discordMutedUsers[message?.author?.id]?.startDate).add(db?.data[guildUuid]?.discordMutedUsers[message?.author?.id]?.duration, 'minutes')?.isBefore(Moment()))
            return false
        await message
            ?.delete()
            ?.catch(() => logger.error('Failed to delete message of muted user.'))
        logger.debug('Check if muted done.')

        return true
    } catch (e) {
        logger.error(e)
        await message.channel.send('Something went wrong...')
        return true
    }
}