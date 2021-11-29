import logger from "../../../winston/index.js"
import { COMMAND, processSlashCommand } from "./slash/index.js";
import {processButton} from "./button/index.js";

/**
 * Process all command and button interaction
 * @param interaction - Discord interaction
 * @param db - In-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
const processCommand = async (interaction, db, mutex) => {
    try {
        if (interaction.commandName !== 'demeter' && interaction.type ===  2)return true

        await db.read()

        if(await processSlashCommand(interaction, db, mutex))return true

        if(await processButton(interaction, db, mutex))return true

    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}

/**
 * Create all commands
 * @param client - Client Discord
 * @param guildId - Discord guild id
 * @returns {Promise<void>}
 */
export const createCommand = async (client, guildId) => {
    try {
        await client.application.commands.create({
            name: 'demeter',description: 'Discord management', options: Object.values(COMMAND)
        }, guildId)
    } catch (e) {
        logger.error(e)
    }
}

export default processCommand