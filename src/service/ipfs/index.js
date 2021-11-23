import * as IPFS from 'ipfs-core'
import all from 'it-all'
import { concat as uint8ArrayConcat  } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import logger from "../winston/index.js"

/**
 * Create an IPFS client
 * @returns {Promise<null|IPFS>}
 */
const createIPFS = async () => {
    try {
        return await IPFS.create()
    } catch (e) {
        logger.error(e)
        return null
    }
}

/**
 * Persist json object to IPFS and return hash
 * @param ipfs - IPFS client
 * @param dataJson - JSON to persist
 * @returns {Promise<string|null>}
 */
export const persistJSON = async (ipfs, dataJson) => {
    try {
        const {cid} = await ipfs.add(Buffer.from(JSON.stringify(dataJson)))
        return cid.toString()
    }catch (e) {
        logger.error(e)
        return null
    }
}

/**
 * Load a JSON file store on IPFS
 * @param ipfs - IPFS client
 * @param hash - Hash of the JSON file
 * @returns {Promise<null|any>}
 */
export const loadJSON = async (ipfs, hash) => {
    try {
        const jsonString = uint8ArrayToString(uint8ArrayConcat(await all(ipfs.cat(hash))))
        return JSON.parse(jsonString)
    }catch (e) {
        logger.error(e)
        return null
    }
}

export default createIPFS