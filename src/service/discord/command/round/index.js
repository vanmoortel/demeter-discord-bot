import {Permissions} from 'discord.js'
import {makeRound, makeRoundConfigFromGuildConfig} from '../../../core/index.js'
import {configRound} from './configRound/index.js'
import {COMMANDS_NAME} from '../index.js'
import logger from '../../../core/winston/index.js'

/**
 * When a guild is added no round is added by default, with this command you can start the first round
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const startFirstRound = async (interaction, guildUuid, db, mutex) => {
    try {
        if (!interaction?.options?.data
                ?.find(d => d?.name === COMMANDS_NAME.ROUND.START_FIRST.name)) return false

        logger.debug('Check if already one round...')
        if(db.data[guildUuid]?.rounds?.length) return true
        logger.debug('Check if already one round done.')

        logger.debug('Create first round...')
        await mutex.runExclusive(async () => {
            await db.read()
            db.data[guildUuid].rounds = [
                makeRound(
                    undefined,
                    undefined,
                    undefined,
                    makeRoundConfigFromGuildConfig(db.data[guildUuid].config)
                )
            ]
            await db.write()
        })
        logger.debug('Create first round done.')

        await interaction
            ?.reply({content: 'Done !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    } catch (e) {
        logger.error(e)
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processRound = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.ROUND.name) return false

        if (!guildUuid) return true

        const isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            || interaction.member.roles.cache.has(db.data[guildUuid]?.config?.adminRole)
        if (!isAdmin)return true

        if(await configRound(interaction, guildUuid, db, mutex)) return true
        if(await startFirstRound(interaction, guildUuid, db, mutex)) return true

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