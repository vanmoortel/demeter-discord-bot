import logger from '../winston/index.js'

/**
 * Update the DB based on condition
 * @param guildUuid - Guild unique identifier
 * @param condFunc - Function to test some condition and return true if need to update
 * @param modifierFunc - Function to return an updated database
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const basicSetter = async (guildUuid, condFunc, modifierFunc, db, mutex) => {
    try {
        if(!await condFunc()) return false

        mutex.runExclusive(async () => {
            await db.read()

            db.data[guildUuid] = await modifierFunc(db.data[guildUuid])

            await db.write()
        })

        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}


/**
 * Update the guild round duration
 * @param duration - round duration
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setDuration = async (duration, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => duration > 0,
    (guildDb) => {
        guildDb.config.roundDuration = duration
        return guildDb
    }, db, mutex)

/**
 * Update the guild min reputation decay
 * @param decay - reputation decay
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMinReputationDecay = async (decay, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => decay >= 0 && decay <= 1 && decay <= db.data[guildUuid].config.maxReputationDecay,
    (guildDb) => {
        guildDb.config.minReputationDecay = decay
        return guildDb
    }, db, mutex)

/**
 * Update the guild max reputation decay
 * @param decay - reputation decay
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMaxReputationDecay = async (decay, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => decay >= 0 && decay <= 1 && decay >= db.data[guildUuid].config.minReputationDecay,
    (guildDb) => {
        guildDb.config.maxReputationDecay = decay
        return guildDb
    }, db, mutex)

/**
 * Update the guild default reputation
 * @param reputation - How much reputation will receive a new member
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setDefaultReputation = async (reputation, guildUuid, db, mutex) => basicSetter(
    guildUuid,
    async () => reputation >= 0,
    (guildDb) => {
        guildDb.config.defaultReputation = reputation
        return guildDb
    }, db, mutex)