import Moment from 'moment'
import {Collection} from 'discord.js'
import logger from '../../core/winston/index.js'

/**
 * Fetch information about reply message
 * @param reply - Message Discord
 * @param channel - Channel Discord
 * @returns {Promise<null|{date: moment.Moment, channel: Snowflake, receiverDiscordId: Snowflake, senderDiscordId: Snowflake}>}
 */
export const fetchReply = async (reply, channel) => {
    try {
        if (!reply?.reference?.messageId) return null

        const message = await channel?.messages
            ?.fetch(reply?.reference?.messageId)
            ?.catch(() => null)
        if (!message?.author?.id) return null

        return {
            date: Moment(reply?.createdAt),
            senderDiscordId: reply?.author?.id,
            receiverDiscordId: message?.author?.id,
            channel: channel?.id
        }
    } catch (e) {
        logger.error(e)
        return null
    }
}

/**
 * Fetch all reactions from a message
 * @param message - Message Discord
 * @param channelPantheons - Channel where the reputation grant when react is redirect to mention instead of author
 * @returns {Promise<*[{date: moment.Moment, channel: Snowflake, emoji: string, receiverDiscordId: Snowflake, senderDiscordId: Snowflake}]>}
 */
export const fetchReaction = async (message, channelPantheons) => {
    try {
        let reactions = []
        for (const reaction of message?.reactions?.cache?.values()) {
            let lastUserId = false
            do {
                const users = await reaction?.users
                    ?.fetch(lastUserId ? {after: lastUserId, limit: 100} : {limit: 100})
                    ?.catch(() => {
                        logger.error('Failed to retrieve users reaction.')
                        return new Collection()
                    })
                lastUserId = users?.size === 100 && users?.last()?.id
                if (channelPantheons[message?.channel?.id] && message?.mentions?.members) {
                    for (const receiver of message?.mentions?.members?.keys()) {
                        reactions.push(...users
                            ?.filter(Boolean)
                            ?.filter(u => u.id !== message.client.user.id)
                            ?.map(user => ({
                                date: Moment(message?.createdAt),
                                senderDiscordId: user?.id,
                                receiverDiscordId: receiver,
                                emoji: reaction?.emoji?.name,
                                channel: message?.channel?.id
                            })))
                    }
                } else
                    reactions.push(...users
                        ?.filter(Boolean)
                        ?.filter(u => u.id !== message.client.user.id)
                        ?.map(user => ({
                            date: Moment(message?.createdAt),
                            senderDiscordId: user?.id,
                            receiverDiscordId: message?.author?.id,
                            emoji: reaction?.emoji?.name,
                            channel: message?.channel?.id
                        })))
            } while (lastUserId)
        }
        return reactions
    } catch (e) {
        logger.error(e)
        return []
    }
}

/**
 * Load all replies and reactions from all visible channel
 * @param startDate - Moment start for fetching
 * @param guild - Guild Discord
 * @param channelPantheons - Channel where the reputation grant when react is redirect to mention instead of author
 * @returns {Promise<*[Reaction][Reply]>}
 */
export const loadReactionReply = async (startDate, guild, channelPantheons) => {
    try {
        const channels = await guild?.channels
            ?.fetch()
            ?.catch(() => new Collection())
        let reactions = []
        let replies = []

        for (const channel of channels?.values()) {
            if (channel.type !== 'GUILD_TEXT') continue

            logger.debug(`Start load reaction and reply from ${channel.name}`)
            let lastMessageId = channel?.lastMessageId
            let lastDate = ''
            let lastMessage = await channel.messages
                .fetch(lastMessageId)
                .catch(() => null)
            if (!lastMessageId || !lastMessage || startDate.isAfter(Moment(lastMessage?.createdAt))) continue

            let reply = await fetchReply(lastMessage, channel)
            if (reply) replies.push(reply)
            let _reactions = await fetchReaction(lastMessage, channelPantheons)
            if (_reactions?.length) reactions.push(..._reactions)
            while (lastMessageId) {
                logger.debug(`### ${reactions.length} reactions, ${replies.length} replies ###\n${channel.name} ${lastDate}`)

                const messages = await channel?.messages
                    ?.fetch({limit: 100, before: lastMessageId})
                    ?.catch(() => new Collection())
                lastMessageId = messages?.size === 100 && messages?.last()?.id
                for (const message of messages.values()) {
                    lastDate = message?.createdAt
                    if (startDate.isAfter(Moment(message?.createdAt))) {
                        lastMessageId = false
                        break
                    }
                    reply = await fetchReply(message, channel)
                    if (reply) replies.push(reply)
                    _reactions = await fetchReaction(message, channelPantheons)
                    if (_reactions?.length) reactions.push(..._reactions)
                }
            }
        }

        return [reactions, replies]
    } catch (e) {
        logger.error(e)
        return [[], []]
    }
}
