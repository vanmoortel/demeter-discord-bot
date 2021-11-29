import logger from "../winston/index.js"
import {aggregates, ethereum, store} from "aleph-js"
const { createHash } = await import('crypto')

/**
 * Connect wallet for Aleph decentralized storage
 * @param privateKey - private key of the ethreum wallet with few ALEPH
 * @returns {Promise<null|{public_key: *, address: *, mnemonics: *, private_key: *, source: string, type: string, signer: *}>}
 */
const connectWallet = async (privateKey=process.env.PRIVATE_KEY) => {
    try {
        return await ethereum.import_account({private_key: privateKey})
    } catch (e) {
        logger.error(e)
        return null
    }
}

/**
 * Persist lowDB in-memory to Aleph only if the data changed
 * @param wallet - Aleph wallet for submit last database hash and database itself
 * @param db - LowDB in-memory database
 * @param mutex - Mutex to prevent concurrent modification
 * @param ipfs - IPFS client
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<boolean>}
 */
export const persistDb = async (wallet, db, mutex, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        await db.read()
        const buffer = Buffer.from(JSON.stringify(db.data))
        const hashUpdated = createHash('sha256').update(buffer).digest('hex')

        const { hash } = await aggregates.fetch_one(wallet.address, aggregateKey, { api_server: 'https://api2.aleph.im'})
        if(!hash) throw Error('Failed to load database hash in Aleph aggregate')

        if (hashUpdated === hash) return true
        logger.debug('New DB detected')

        await store.submit(wallet.address, {fileobject: buffer, account: wallet, api_server: 'https://api2.aleph.im'})

        await aggregates.submit(wallet.address, aggregateKey, {hash: hashUpdated}, { account: wallet, channel: 'TEST', api_server: 'https://api2.aleph.im' })

        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}

/**
 * Retrieve last persisted database to lowDB in-memory from Aleph
 * @param wallet - Aleph wallet to retrieve last database hash
 * @param db - LowDB in-memory database
 * @param mutex - Mutex to prevent concurrent modification
 * @param ipfs - IPFS client
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<null|Low>}
 */
export const loadDb = async (wallet, db, mutex, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        mutex.runExclusive(async () => {
            const { hash } = await aggregates.fetch_one(wallet.address, aggregateKey, { api_server: 'https://api2.aleph.im'})
            if(!hash) throw Error('Failed to load database hash in Aleph aggregate')

            const buffer = await store.retrieve(hash, { api_server: 'https://api2.aleph.im'})

            db.data = JSON.parse(buffer.toString())
            if (!db.data) throw Error('Failed to load database on Aleph')

            db.write()
        })

        return db
    } catch (e) {
        logger.error(e)
        return null
    }
}

export default connectWallet