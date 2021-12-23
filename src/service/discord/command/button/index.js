import {Permissions} from 'discord.js'
import {captchaComponents} from '../../button/captcha/index.js'
import {guildInfoComponents} from '../../select/guildInfo/index.js'
import logger from '../../../core/winston/index.js'
import {COMMANDS_NAME} from '../index.js'
import {userInfoComponents} from '../../select/userInfo/index.js'

/**
 * Print the captcha button
 * @param interaction - Discord interaction
 * @returns {Promise<boolean>}
 */
export const printButtonCaptcha = async (interaction) => {
    try {
        if (!interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.BUTTON.CAPTCHA.name)) return false

        await interaction
            ?.reply({content: 'Done !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        await interaction.channel.send({content: 'I\'m not a robot\n\n', components: captchaComponents})
        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}


/**
 * Print the button to show the guild information
 * @param interaction - Discord interaction
 * @returns {Promise<boolean>}
 */
export const printButtonGuildInfo = async (interaction) => {
    try {
        if (!interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.BUTTON.GUILD_INFO.name)) return false

        await interaction
            ?.reply({content: 'Done !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        await interaction.channel.send({content: 'You can select on one of the following options to view the guild configuration \n\n', components: guildInfoComponents})
        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}


/**
 * Print the button to show the user information
 * @param interaction - Discord interaction
 * @returns {Promise<boolean>}
 */
export const printButtonUserInfo = async (interaction) => {
    try {
        if (!interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.BUTTON.USER_INFO.name)) return false

        await interaction
            ?.reply({content: 'Done !', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        await interaction.channel.send({content: 'You can select on one of the following options to view your information \n\n', components: userInfoComponents})
        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processPrintButton = async (interaction, guildUuid, db, mutex) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.BUTTON.name) return false

        if (!guildUuid) return true

        const isAdmin = interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            || interaction.member.roles.cache.has(db.data[guildUuid]?.config?.adminRole)

        if (!isAdmin) return true

        if (await printButtonCaptcha(interaction)) return true
        if (await printButtonGuildInfo(interaction)) return true
        if (await printButtonUserInfo(interaction)) return true

        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}