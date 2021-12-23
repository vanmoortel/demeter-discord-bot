import {COMMANDS_NAME} from '../index.js'
import logger from '../../../core/winston/index.js'
import {configUser} from './configUser/index.js'
import {unmute} from './unmute/index.js'

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const processUser = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.USER.name) return false

        if(await configUser(interaction, guildUuid, db, mutex))return true
        if(await unmute(interaction, guildUuid, db, mutex))return true

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