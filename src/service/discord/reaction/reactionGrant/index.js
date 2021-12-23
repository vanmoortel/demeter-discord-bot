import logger from '../../../core/winston/index.js'
import {checkCreateUserDiscord} from '../../user/index.js'
import {checkGrant} from '../../../core/reputation/index.js'

/**
 * Add a grant when a user react to a message
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const grantAdd = async (messageReaction, user, guildUuid, db, mutex) => {
    try {
        if (messageReaction?.message?.author?.id === messageReaction?.client?.user?.id) return false

        const receiverDiscordId = messageReaction?.message?.author?.id
        const senderDiscordId = user?.id
        const roundLength = db?.data[guildUuid]?.rounds?.length
        let sender = {}
        let receivers = {}
        if(!receiverDiscordId || !senderDiscordId || !roundLength)return true

        logger.debug('Reaction grant saved...')
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create sender...')
            sender = await checkCreateUserDiscord(senderDiscordId, db?.data[guildUuid], messageReaction?.message?.guild)
            if (!sender) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create sender done.')

            if (db?.data[guildUuid]?.config?.channelPantheons[messageReaction?.message?.channel?.id]
                && messageReaction?.message?.mentions?.members){

                logger.debug('Retrieve or create all mention...')
                for (const discordId of messageReaction?.message?.mentions?.members?.keys()) {
                    const receiver = await checkCreateUserDiscord(discordId, db?.data[guildUuid], messageReaction?.message?.guild)
                    if (receiver) receivers = {...receivers, ...receiver}
                }
                logger.debug('Retrieve or create all mention done.')

            } else {
                logger.debug('Retrieve or create message author...')
                const receiver = await checkCreateUserDiscord(receiverDiscordId, db?.data[guildUuid], messageReaction?.message?.guild)
                if (receiver) receivers = receiver
                logger.debug('Retrieve or create message author done.')
            }

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
        let quantity = userConfig?.reactionGrants[messageReaction?.emoji?.name] || userConfig?.reactionGrants['default']
        quantity *= userConfig?.channelGrantMultipliers[messageReaction?.message?.channel?.id] || userConfig?.channelGrantMultipliers['default']
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

        logger.info('Reaction grant saved done.')

        return true
    } catch (e) {
        logger.error(e)
        return true
    }
}

/**
 * Remove a grant when a user react to a message
 * @param messageReaction - Discord message reaction
 * @param user - Discord user author of this reaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const grantRemove = async (messageReaction, user, guildUuid, db, mutex) => {
    try {
        if (messageReaction?.message?.author?.id === messageReaction?.client?.user?.id) return false

        const receiverDiscordId = messageReaction?.message?.author?.id
        const senderDiscordId = user?.id
        const roundLength = db?.data[guildUuid]?.rounds?.length
        let sender = {}
        let receivers = {}
        if(!receiverDiscordId || !senderDiscordId || !roundLength)return true

        logger.debug('Reaction grant removed...')
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Retrieve or create sender...')
            sender = await checkCreateUserDiscord(senderDiscordId, db?.data[guildUuid], messageReaction?.message?.guild)
            if (!sender) return true
            db.data[guildUuid].users = {...db?.data[guildUuid]?.users, ...sender}
            logger.debug('Retrieve or create sender done.')

            if (db?.data[guildUuid]?.config?.channelPantheons[messageReaction?.message?.channel?.id]
                && messageReaction?.message?.mentions?.members){

                logger.debug('Retrieve or create all mention...')
                for (const discordId of messageReaction?.message?.mentions?.members?.keys()) {
                    const receiver = await checkCreateUserDiscord(discordId, db?.data[guildUuid], messageReaction?.message?.guild)
                    if (receiver) receivers = {...receivers, ...receiver}
                }
                logger.debug('Retrieve or create all mention done.')

            } else {
                logger.debug('Retrieve or create message author...')
                const receiver = await checkCreateUserDiscord(receiverDiscordId, db?.data[guildUuid], messageReaction?.message?.guild)
                if (receiver) receivers = receiver
                logger.debug('Retrieve or create message author done.')
            }

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

        logger.debug('Compute quantity to remove based on user config...')
        let quantity = userConfig?.reactionGrants[messageReaction?.emoji?.name] || userConfig?.reactionGrants['default']
        quantity *= userConfig?.channelGrantMultipliers[messageReaction?.message?.channel?.id] || userConfig?.channelGrantMultipliers['default']
        logger.debug('Compute quantity to remove based on user config done.')

        await mutex.runExclusive(async () => {
            await db.read()

            let guildDb = db?.data[guildUuid]

            const roundLength = guildDb?.rounds?.length

            logger.debug('Remove reputation granted to receivers...')
            for (const receiver in receivers){
                if (!checkGrant(Object.keys(sender)[0], receiver, quantity)) continue
                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver] ||= {}
                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver][Object.keys(sender)[0]] ||= 0

                db.data[guildUuid].rounds[roundLength - 1]
                    .grants[receiver][Object.keys(sender)[0]] = Math.max(0, db?.data[guildUuid]?.rounds[roundLength - 1]
                    ?.grants[receiver][Object.keys(sender)[0]] - quantity)

            }
            logger.debug('Remove reputation granted to receivers done.')

            await db.write()
        })
        logger.info('Reaction grant removed done.')

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
export const processReactionGrant = async (messageReaction, user, isRemove, guildUuid, db, mutex) => {
    try {
        if (!isRemove && await grantAdd(messageReaction, user, guildUuid, db, mutex)) return true
        if (isRemove && await grantRemove(messageReaction, user, guildUuid, db, mutex)) return true

        return false
    } catch (e) {
        logger.error(e)
        await messageReaction.message.channel.send('Something went wrong...')
        return true
    }
}