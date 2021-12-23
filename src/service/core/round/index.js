import logger from '../winston/index.js'
import {makeRoundConfigFromGuildConfig} from '../index.js'

/**
 * Update the DB based on condition
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param condFunc - Function to test some condition and return true if need to update
 * @param modifierFunc - Function to return an updated database
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const basicSetter = async (roundId, guildUuid, condFunc, modifierFunc, db, mutex) => {
    try {
        if(!await condFunc()) return false

        mutex.runExclusive(async () => {
            await db.read()

            db.data[guildUuid].rounds[roundId] = await modifierFunc(db.data[guildUuid].rounds[roundId])

            await db.write()
        })

        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}

/**
 * Reset round configuration with guild configuration
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setGuildDefault = async (roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => true,
    (round) => {
        round.config = makeRoundConfigFromGuildConfig(db.data[guildUuid].config)
        return round
    }, db, mutex)

/**
 * Update for this round the round duration
 * @param duration - round duration
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setDuration = async (duration, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => duration > 0,
    (round) => {
        round.config.roundDuration = duration
        return round
    }, db, mutex)

/**
 * Update for this round the min reputation decay
 * @param decay - min reputation decay
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMinReputationDecay = async (decay, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => decay >= 0 && decay <= 1 && decay <= db.data[guildUuid].rounds[roundId].config.maxReputationDecay,
    (round) => {
        round.config.minReputationDecay = decay
        return round
    }, db, mutex)

/**
 * Update for this round the max reputation decay
 * @param decay - max reputation decay
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setMaxReputationDecay = async (decay, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => decay >= 0 && decay <= 1 && decay >= db.data[guildUuid].rounds[roundId].config.minReputationDecay,
    (round) => {
        round.config.maxReputationDecay = decay
        return round
    }, db, mutex)

/**
 * Update for this round the default reputation
 * @param reputation - How much reputation will receive a new member
 * @param roundId - round ID in array
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setDefaultReputation = async (reputation, roundId, guildUuid, db, mutex) => basicSetter(
    roundId,
    guildUuid,
    async () => reputation >= 0,
    (round) => {
        round.config.defaultReputation = reputation
        return round
    }, db, mutex)