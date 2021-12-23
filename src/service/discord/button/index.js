import logger from '../../core/winston/index.js'
import {printCaptcha} from './captcha/index.js'
import {processSelect} from '../select/index.js'

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @param salt - Salt to generate a hash to hide the correct button
 * @returns {Promise<boolean>}
 */
export const processButton = async (interaction, guildUuid, db, mutex, salt) => {
    try {
        if (!interaction.customId) return false

        if (await printCaptcha(interaction, guildUuid, db, salt)) return true
        if (await processSelect(interaction, guildUuid, db)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}