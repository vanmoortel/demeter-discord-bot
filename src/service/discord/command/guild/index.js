import {COMMANDS_NAME} from "../index.js";
import logger from "../../../core/winston/index.js";
import {configGuild} from "./configGuild/index.js";
import moment from "moment";

/**
 * Get the last database saved and return link to the json guild
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @param clientWeb3 - Web3.storage client
 * @returns {Promise<boolean>}
 */
const printDbUrl = async (interaction, guildUuid, db, mutex, clientWeb3) => {
    try {
        if (!interaction?.options?.data
            ?.find(d => d?.name === COMMANDS_NAME.GUILD.DB_URL.name)) return false

        logger.debug('Fetch last directory...')
        let lastUpload = null
        try {
            for await (const upload of clientWeb3?.list()) {
                if (!lastUpload)lastUpload = upload
                if(moment(upload?.created)?.isAfter(moment(lastUpload?.created)))lastUpload = upload
            }
        }   catch (e) {
            logger.debug('Fetch last directory failed.')
        }
        if(!lastUpload) throw Error('Fetch last directory failed.')
        logger.debug('Fetch last directory done.')

        await interaction
            ?.reply({content: `https://${lastUpload?.cid}.ipfs.dweb.link/${guildUuid}.json`, ephemeral: true})
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

/**
 *
 * @param interaction - Discord interaction
 * @param guildUuid - Guild unique identifier
 * @param db - in-memory database
 * @param mutex - mutex to access database safely
 * @param clientWeb3 - Web3.storage client
 * @returns {Promise<boolean>}
 */
export const processGuild = async (interaction, guildUuid, db, mutex, clientWeb3) => {
    try {
        if (interaction?.commandName !== COMMANDS_NAME.GUILD.name) return false

        if (await printDbUrl(interaction, guildUuid, db, mutex, clientWeb3)) return true
        if (await configGuild(interaction, guildUuid, db, mutex)) return true

        return true
    } catch (e) {
        logger.error(e)
        await interaction
            ?.reply({content: 'Something went wrong...', ephemeral: true})
            ?.catch(() => logger.error('Reply interaction failed.'))
        return true
    }
}