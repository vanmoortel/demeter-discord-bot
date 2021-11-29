import logger from "../../../../winston/index.js";
import {printServerInfo} from "./serverInfo.js";

/**
 * Process all button interaction
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processButton = async (interaction, db, mutex) => {
    try {
        if (!interaction.customId) return false

        if (await printServerInfo(interaction, db)) return true

        return false
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}