import {Permissions} from 'discord.js'
import logger from '../../../../core/winston/index.js'
import {COMMANDS_NAME} from '../../index.js'


/**
 * Unmute someone
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const unmute = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.USER.name) return false

        const options = interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.USER.UNMUTE.name)?.options

        if (!options) return false

        if (!guildUuid) return true

        const isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            || interaction.member.roles.cache.has(db.data[guildUuid]?.config?.adminRole)
        if (!isAdmin) return true

        const user = options?.find(o => o?.name === COMMANDS_NAME.USER.UNMUTE.USER.name)?.value
        if (!user) return true

        await mutex.runExclusive(async () => {
            await db.read()
            db.data[guildUuid].discordMutedUsers ||= {}
            delete db.data[guildUuid].discordMutedUsers[user]
            await db.write()
        })

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