import {aggregates, ethereum, store} from 'aleph-js'
const { createHash } = await import('crypto')
import fs from 'fs'
import logger from '../winston/index.js'
import {makeGuild} from '../index.js'
import {makeDiscord} from '../../discord/data/index.js'
const fsPromises = fs.promises


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
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<boolean>}
 */
export const persistDb = async (wallet, db, mutex, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        await db.read()

        logger.debug('Fetch guild db hashes...')
        const guildHashes = await aggregates
            .fetch_one(wallet.address, aggregateKey, { api_server: 'https://api2.aleph.im'})
            .catch(({response}) => {
                if (response && response.status === 404){
                    logger.info('No hash database found.')
                    return {}
                }
                return null
            })
        if(!guildHashes) throw Error('Failed to load database hash in Aleph aggregate')
        logger.debug('Fetch guild db hashes done.')

        let guildHashesUpdated = {}
        let isUpdated = false

        for(const guildUuid in db.data) {
            const buffer = Buffer.from(JSON.stringify(db.data[guildUuid]))
            guildHashesUpdated[guildUuid] = createHash('sha256').update(buffer).digest('hex')


            if (guildHashesUpdated[guildUuid] === guildHashes[guildUuid]) return true
            isUpdated = true
            logger.info(`${guildUuid} new DB detected`)

            logger.debug('Save database...')
            await fsPromises.writeFile(`backup/${guildUuid}.json`, buffer)
            await store
                .submit(wallet.address, {fileobject: buffer, account: wallet, api_server: 'https://api2.aleph.im'})
                .catch(() => logger.error('Failed to save Database on Aleph'))
            logger.debug('Save database done.')
        }

        if (!isUpdated) return true
        logger.debug('Push database hashes...')
            await aggregates
                .submit(wallet.address, aggregateKey, guildHashesUpdated, { account: wallet, channel: 'TEST', api_server: 'https://api2.aleph.im' })
                .catch(() => logger.error('Failed to save hashes database on Aleph'))
        logger.debug('Push database hashes done.')

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
 * @param aggregateKey - Name of the Aleph aggregate key containing last database hash
 * @returns {Promise<null|Low>}
 */
export const loadDb = async (wallet, db, mutex, aggregateKey=process.env.ALEPH_AGGREGATE_KEY) => {
    try {
        mutex.runExclusive(async () => {
            logger.debug('Fetch guild db hashes...')
            const guildHashes = await aggregates
                .fetch_one(wallet.address, aggregateKey, { api_server: 'https://api2.aleph.im'})
                .catch(({response}) => {
                    if (response && response.status === 404){
                        logger.info('No hash database found.')
                        return {}
                    }
                    return null
                })

            if(!guildHashes) throw Error('Failed to load database hash in Aleph aggregate')
            logger.debug('Fetch guild db hashes done.')

            for (const guildUuid in guildHashes) {
                const buffer = await store
                    .retrieve(guildHashes[guildUuid], { api_server: 'https://api2.aleph.im'})
                    .catch(() => null)
                if (!buffer) throw Error('Failed to load database on Aleph')

                db.data[guildUuid] = JSON.parse(buffer.toString())

                if (!db.data[guildUuid]) throw Error('Failed to load database on Aleph')
            }
            db.write()
        })

        return db
    } catch (e) {
        logger.error(e)
        return null
    }
}

export default connectWallet