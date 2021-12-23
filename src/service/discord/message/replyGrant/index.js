import logger from '../../../core/winston/index.js'
import {checkCreateUserDiscord} from '../../user/index.js'
import {checkGrant} from '../../../core/reputation/index.js'

/**
 * When a user reply to a message, grant the author of this message
 * @param message - Discord message
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<null|boolean>}
 */
export const processReplyGrant = async (message, guildUuid, db, mutex) => {
    try {
        if (!guildUuid || message?.author?.id === message?.client?.user?.id || !message?.reference?.messageId) return true

        const messageOrig = await message?.channel?.messages
            ?.fetch(message?.reference?.messageId)
            ?.catch(() => null)
        if (!messageOrig?.author?.id || messageOrig?.author?.id === message?.client?.user?.id) return null

        const receiverDiscordId = messageOrig?.author?.id
        const senderDiscordId = message.author?.id
        const roundLength = db?.data[guildUuid]?.rounds?.length
        let sender = {}
        let receivers = {}
        if(!receiverDiscordId || !senderDiscordId || !roundLength)return true

        logger.debug('Reply grant saved...')
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create sender...')
            sender = await checkCreateUserDiscord(senderDiscordId, db?.data[guildUuid], message?.guild)
            if (!sender) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create sender done.')

            logger.debug('Retrieve or create message author...')
            const receiver = await checkCreateUserDiscord(receiverDiscordId, db?.data[guildUuid], message?.guild)
            if (!receiver) return true
            receivers = receiver
            logger.debug('Retrieve or create message author done.')

            logger.info('Add new/existing user to DB...')
            if (!Object.keys(receivers)?.length) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...receivers, ...sender}
            logger.info('Add new/existing user to DB done.')

            await db.write()
        })

        logger.debug('Remove sender grant himself...')
        if (!sender) return true
        delete receivers[Object.keys(sender)[0]]
        if (!Object.keys(receivers)?.length) return true
        logger.debug('Remove sender grant himself done.')

        await db.read()
        let guildDb = db?.data[guildUuid]
        const userConfig = guildDb?.users[Object.keys(sender)[0]]?.config

        logger.debug('Compute quantity to grant based on user config...')
        let quantity = userConfig?.replyGrant
        quantity *= userConfig?.channelGrantMultipliers[message?.channel?.id] || userConfig?.channelGrantMultipliers['default']
        logger.debug('Compute quantity to grant based on user config done.')

        await mutex.runExclusive(async () => {
            await db.read()

            let guildDb = db?.data[guildUuid]
            const roundLength = guildDb?.rounds?.length

            logger.debug('Add reputation to receivers...')
            for (const receiver in receivers){
                if (!checkGrant(Object.keys(sender)[0], receiver, quantity)) continue
                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver] ||= {}

                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver][Object.keys(sender)[0]] ||= 0

                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver][Object.keys(sender)[0]] += quantity
            }
            logger.debug('Add reputation to receivers done.')

            await db.write()
        })

        logger.info('Reply grant saved done.')

        return false
    } catch (e) {
        logger.error(e)
        await message.channel.send('Something went wrong...')
        return true
    }
}