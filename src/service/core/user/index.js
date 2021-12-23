import logger from '../winston/index.js'
import {makeUser, makeUserConfigFromGuildConfig, makeUserConfigFromRoundConfig} from '../index.js'
import {makeCore} from '../data/index.js'
import {createUserDiscord} from '../../discord/user/index.js'

/**
 * Update the DB based on condition
 * @param userUuid - User unique identifier
 * @param guildUuid - Guild unique identifier
 * @param condFunc - Function to test some condition and return true if need to update
 * @param modifierFunc - Function to return an updated database
 * @param db - in-memory database
 * @param mutex - Mutex to access database safely
 * @returns {Promise<boolean>}
 */
export const basicSetter = async (userUuid, guildUuid, condFunc, modifierFunc, db, mutex) => {
    try {
        if(!await condFunc()) return false

        mutex.runExclusive(async () => {
            await db.read()

            db.data[guildUuid].users[userUuid] = await modifierFunc(db.data[guildUuid].users[userUuid])

            await db.write()
        })

        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}

/**
 * Reset user config with guild config
 * @param userUuid - User unique identifier
 * @param guildUuid - Guild unique identifier
 * @param db - In-memory database
 * @param mutex - Mutex to access the database safely
 * @returns {Promise<boolean>}
 */
export const setGuildDefault = async (userUuid, guildUuid, db, mutex) => basicSetter(
    userUuid,
    guildUuid,
    async () => true,
    (user) => {
        user.config = makeUserConfigFromGuildConfig(db.data[guildUuid].config)
        return user
    }, db, mutex)

/**
 * Create a new user with reputation for old past round to 0 and now to default reputation
 * @param roundConfig - Config of the current round
 * @param roundLength - How much round already exist(used for reputations)
 * @param discord - Contain user discord id and guild discord
 * @returns {Promise<null|User>}>}
 */
export const createUser = async (roundConfig, roundLength, discord) => {
    try {
        logger.debug('Create new user...')
        const user = makeUser(
            makeCore.makeUser([
                ...Array(roundLength - 1).fill(0),
                roundConfig?.defaultReputation
            ]),
            await createUserDiscord(discord),
            undefined,
            undefined,
            makeUserConfigFromRoundConfig(roundConfig)
        )
        logger.info('Create new user done.')

        return user
    } catch (e) {
        logger.error(e)
        return null
    }
}
