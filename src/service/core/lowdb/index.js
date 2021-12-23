import {Low, Memory} from 'lowdb'
import logger from '../winston/index.js'

/**
 * Create an in-memory database, will be saved on IPFS
 * @param defaultData - Default data structure or old data from IPFS
 * @returns {Promise<null|Low>}
 */
const createDb = async (defaultData={}) => {
    try {
        const db = new Low(new Memory())

        await db.read()

        db.data ||= defaultData

        await db.write()

        return db
    } catch (e) {
        logger.error(e)
        return null
    }
}

export default createDb