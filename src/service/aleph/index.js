import logger from "../winston/index.js"
import {aggregates, ethereum, store} from "aleph-js"
import {loadJSON, persistJSON} from "../ipfs/index.js"

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
 * Persist lowDB in-memory to IPFS with Aleph pinning
 * @param wallet - Aleph wallet for submit last database hash and pin IPFS
 * @param db - LowDB in-memory database
 * @param mutex - Mutex to prevent concurrent modification
 * @param ipfs - IPFS client
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<boolean>}
 */
export const persistDb = async (wallet, db, mutex, ipfs, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        let hash = null

        logger.debug('persistDB mutex...')
        mutex.runExclusive(async () => {
            db.read()

            hash = await persistJSON(ipfs, db.data)
            if (!hash) throw Error('Failed to persist database on IPFS')
            await aggregates.submit(wallet.address, aggregateKey, {hash}, { account: wallet, channel: 'TEST' })
        })
        logger.debug('persistDB mutex done.')

        // Wait propagation on Aleph
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const updatedAggregate = await aggregates.fetch_one(wallet.address, aggregateKey)
        if(hash !== updatedAggregate.hash) throw Error('Failed to persist new database hash in Aleph aggregate')

        // Pin IPFS file with Aleph
        await store.submit(wallet.address, {storage_engine: 'ipfs', file_hash: hash, account: wallet, channel: 'TEST'})

        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}

/**
 * Retrieve last persisted database to lowDB in-memory from IPFS with Aleph pinning
 * @param wallet - Aleph wallet for submit last database hash and pin IPFS
 * @param db - LowDB in-memory database
 * @param mutex - Mutex to prevent concurrent modification
 * @param ipfs - IPFS client
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<null|Low>}
 */
export const loadDb = async (wallet, db, mutex, ipfs, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        mutex.runExclusive(async () => {
            const { hash } = await aggregates.fetch_one(wallet.address, aggregateKey)
            if(!hash) throw Error('Failed to load database hash in Aleph aggregate')

            db.data = await loadJSON(ipfs, hash)
            if (!db.data) throw Error('Failed to load database on IPFS')

            db.write()
        })

        return db
    } catch (e) {
        logger.error(e)
        return null
    }
}

export default connectWallet