import logger from '../../core/winston/index.js'
import {printGuildInfo} from './guildInfo/index.js'
import {printUserInfo} from './userInfo/index.js'

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processSelect = async (interaction, guildUuid, db, mutex) => {
    try {
        if (!interaction.customId) return false

        if (await printGuildInfo(interaction, guildUuid, db)) return true
        if (await printUserInfo(interaction, guildUuid, db)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}