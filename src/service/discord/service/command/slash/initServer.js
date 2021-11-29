import logger from "../../../../winston/index.js";
import { guild, configServer } from "../../../../../utils/helperDatabase.js";
import {ApplicationCommandOptionTypes} from "../../../../../utils/discordConstant.js";

export const INIT_SERVER = {type: ApplicationCommandOptionTypes.SUB_COMMAND, name: 'init-server', description: 'Initialize the server', options:[{
    type: ApplicationCommandOptionTypes.ROLE, name: 'admin-role', description: 'Set admin role', required: true
}]}

/**
 * Initialize the guild with an admin role
 * @param interaction - Discord interaction
 * @param db - in-memory database
 * @param mutex - mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const initServer = async (interaction, db, mutex) => {
    try {
        if (interaction?.options?.data[0]?.name !== INIT_SERVER.name) return false
        await mutex.runExclusive(async () => {
            await db.read()

            if (db.data[interaction.guildId]) db.data[interaction.guildId].config
                .adminRole = interaction.options.data[0].options[0].value
            else db.data[interaction.guildId] = guild(configServer(interaction.options.data[0].options[0].value))

            await db.write()
        })

        await interaction.reply({content: 'Done !', ephemeral: true})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}