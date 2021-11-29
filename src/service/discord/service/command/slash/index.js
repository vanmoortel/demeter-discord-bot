import logger from "../../../../winston/index.js"
import {INIT_SERVER, initServer} from './initServer.js'
import {configServer, CONFIG_SERVER} from "./configServer.js";
import {printButtonServerInfo, PRINT_BUTTON_SERVER_INFO} from "./printButtonServerInfo.js";

export const COMMAND = {
    INIT_SERVER,
    CONFIG_SERVER,
    PRINT_BUTTON_SERVER_INFO
}

/**
 * Process all slash command
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const processSlashCommand = async (interaction, db, mutex) => {
    try {
        const serverDb = db.data[interaction.guildId]

        if(!serverDb){
            if(await initServer(interaction, db, mutex))return true
            await interaction.reply({content: 'Please initialize the server first(/demeter init-server)', ephemeral: true})
            return true
        }

        const isAdmin = serverDb && interaction.member.roles.cache.has(serverDb.config.adminRole)

        if (isAdmin){
            if(await configServer(interaction, db, mutex))return true
            if(await printButtonServerInfo(interaction))return true
        }

        return false;
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}