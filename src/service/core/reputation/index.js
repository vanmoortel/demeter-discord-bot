import clone from 'lodash.clonedeep'
import * as ss from 'simple-statistics'
import Moment from 'moment'
import logger from '../winston/index.js'
import {quadraticFunding} from '../../discord/reputation/index.js'
import {makeCore} from '../data/index.js'
import {addRemoveReputationRole} from '../../discord/reputation/reputationRole/index.js'
import {makeRound, makeRoundConfigFromGuildConfig} from '../index.js'

/**
 * Check if sender is different than receiver and quantity >= 0
 * @param sender - sender ID
 * @param receiver - receiver ID
 * @param quantity - Reputation granted
 * @returns {boolean}
 */
export const checkGrant = (sender, receiver, quantity) => sender !== receiver && quantity >= 0

/**
 * Return all received grants, each grant is bring back bellow the maximum of the user reputation multiply by min reputation decay
 * @param grants - Grant list for this round({receiverUuid: {senderUuid: grant }})
 * @param receiverUuid - Receiver Unique identifier
 * @param users - Users from database
 * @param minReputationDecay - Min reputation decay by round
 * @param shift - How much round in the past(used for reputation computation)
 * @returns {{senderUuid: normalizedGrant}|*}
 */
export const normalizeReceivedGrant = (grants, receiverUuid, users, minReputationDecay, shift) => {
    try {
        const grantReceive = {...grants[receiverUuid]}
        if (!grantReceive || !Object.keys(grantReceive)?.length) return {}

        logger.debug('Retrieve for one receiver all receiver and normalize their grant...')
        for (const sender in grantReceive) {
            const userReputations = users[sender]?.reputations
            if (!userReputations){
                logger.error(`User ${sender} is undefined !`)
                continue
            }
            if (userReputations?.length < shift + 1){
                logger.error(`User ${sender} only have ${userReputations?.length} round but shift = ${shift} !`)
                continue
            }

            const reputation = userReputations[userReputations?.length - shift - 1]
            let sumGrant = 0

            if (reputation === 0) {
                grantReceive[sender] = 0
                continue
            }
            if (reputation > 0){
                for (const grant in grants) {
                    sumGrant += grants[grant][sender] || 0
                }
            }
            grantReceive[sender] = sumGrant <= reputation * minReputationDecay
                ? grantReceive[sender]
                : grantReceive[sender]/(sumGrant/(reputation*minReputationDecay))
        }
        logger.debug('Retrieve for one receiver all receiver and normalize their grant done.')
        return grantReceive
    } catch (e) {
        logger.error(e)
        return {}
    }
}

/**
 * Return all sent grants, each grant is bring back bellow the maximum of the user reputation multiply by min reputation decay
 * @param grants - Grant list for this round({receiverUuid: {senderUuid: grant }})
 * @param senderUuid - Sender Unique identifier
 * @param users - Users from database
 * @param minReputationDecay - Min reputation decay by round
 * @param shift - How much round in the past(used for reputation computation)
 * @returns {{receiverUuid: normalizedGrant}|*}
 */
export const normalizeSentGrant = (grants, senderUuid, users, minReputationDecay, shift) => {
    try {
        const grantSent = {}
        let sumGrant = 0
        const userReputations = users[senderUuid]?.reputations

        if (!userReputations){
            logger.error(`User ${senderUuid} is undefined !`)
            return {}
        }
        if (userReputations?.length < shift + 1){
            logger.error(`User ${senderUuid} only have ${userReputations?.length} round but shift = ${shift} !`)
            return {}
        }

        const reputation = userReputations[userReputations?.length - shift - 1]
        if (!reputation) return {}

        logger.debug('Retrieve and sum all grants sent by this sender...')
        for (const receiver in grants) {
            if (!grants[receiver][senderUuid]) continue
            grantSent[receiver] = grants[receiver][senderUuid]
            sumGrant += grants[receiver][senderUuid]
        }
        logger.debug('Retrieve and sum all grants sent by this sender done.')

        logger.debug('Normalize all grants sent by this sender...')
        for (const receiver in grantSent)
            grantSent[receiver] = sumGrant <= reputation * minReputationDecay
                ? grantSent[receiver]
                : grantSent[receiver]/(sumGrant/(reputation*minReputationDecay))
        logger.debug('Normalize all grants sent by this sender done.')

        return grantSent
    } catch (e) {
        logger.error(e)
        return {}
    }
}

/**
 * Return all grants, each grant is bring back bellow the maximum of the user reputation multiply by min reputation decay
 * @param grants - Grant list for this round({receiverUuid: {senderUuid: grant }})
 * @param users - Users from database
 * @param minReputationDecay - Min reputation decay by round
 * @param shift - How much round in the past(used for reputation computation)
 * @returns {{receiverUuid: {senderUuid: normalizedGrant }}|*}
 */
export const normalizeAllGrant = (grants, users, minReputationDecay, shift) => {
    try {
        const normalizedGrants = clone(grants)
        const usersSum = {}

        logger.debug('For each user sum how much they sent...')
        for (const receiver in grants) {
            for (const sender in grants[receiver]) {
                usersSum[sender] ||= 0
                usersSum[sender] += grants[receiver][sender]
            }
        }
        logger.debug('For each user sum how much they sent done.')

        logger.debug('Normalize all grant...')
        for (const receiver in grants) {
            for (const sender in grants[receiver]) {
                const userReputations = users[sender]?.reputations
                if (!userReputations){
                    logger.error(`User ${sender} is undefined !`)
                    continue
                }
                if (userReputations?.length < shift + 1){
                    logger.error(`User ${sender} only have ${userReputations?.length} round but shift = ${shift} !`)
                    continue
                }

                const reputation = userReputations[userReputations?.length - shift - 1]
                if (reputation === 0 || grants[receiver][sender] === 0) {
                    normalizedGrants[receiver][sender] = 0
                    continue
                }

                normalizedGrants[receiver][sender] = usersSum[sender] <= reputation * minReputationDecay
                    ? grants[receiver][sender]
                    : grants[receiver][sender]/(usersSum[sender]/(reputation*minReputationDecay))
            }
        }
        logger.debug('Normalize all grant done.')

        return normalizedGrants
    } catch (e) {
        logger.error(e)
        return {}
    }
}

/**
 * Distribute user reputation based on received, mint, Quadratic funding
 * @param _guildDb - In-memory database
 * @param shift - How much round in the past(used to retrieve correct user reputation)
 * @param discord - Discord service(contain Discord client)
 * @returns {Promise<{usersMatched: {}, usersReceived: {}, users, usersMinted: {}}|{}>}
 */
export const distributeReputation = async (_guildDb, shift = 0, discord) => {
    try {
        const guildDb = clone(_guildDb)
        const roundLength = guildDb?.rounds?.length
        const roundNow = guildDb?.rounds[roundLength - 1 - shift]
        const grants = normalizeAllGrant(roundNow?.grants, guildDb?.users, roundNow?.config?.minReputationDecay, shift)
        let usersReceived = {}
        let usersMatched = {}
        let usersMinted = {}
        let users = {}

        logger.debug('Compute reputation standard deviation and total burn for reputation decay...')
        let reputationFiltered = Object.values(guildDb?.users)
            .map(u => u?.reputations[roundLength - 1 - shift])
            .filter(Boolean)
            .filter(r => r > roundNow?.config?.defaultReputation) // Filter AFK (= 0 reputation or min reputation)
        const reputationSd = reputationFiltered?.length
            ? ss.sampleStandardDeviation(reputationFiltered)
            : roundNow?.config?.defaultReputation
        const diffMinMax = roundNow?.config?.maxReputationDecay - roundNow?.config?.minReputationDecay
        const totalBurn = [...Object.values(guildDb?.users)
            .map(u => u?.reputations[roundLength - 1 - shift]
                ? Math.max(roundNow?.config?.defaultReputation, u?.reputations[roundLength - 1 - shift])
                : 0)
            .map(r => r * (roundNow?.config?.minReputationDecay + (diffMinMax*(Math.tan(Math.pow(Math.min(1, r / (reputationSd * 4)), 5))/Math.tan(1)))))
            , 0].reduce((a, n) => a + n)
        logger.debug('Compute reputation standard deviation and total burn for reputation decay done.')

        if (discord) {
            logger.debug('Compute Quadratic funding for Discord...')
            const _usersMatched = await quadraticFunding(totalBurn, roundNow?.config, grants, guildDb?.users, shift, guildDb?.guildDiscordId, discord)
            for(const u in _usersMatched){
                usersMatched[u] ||= 0
                usersMatched[u] += _usersMatched[u]
            }
            logger.debug('Compute Quadratic funding for Discord done.')
        }

        for (const user in guildDb?.users) {
            const userReputations = guildDb?.users[user]?.reputations
            // Get previous reputation, if not 0 can't be lower than defaultReputation
            const userOldReputation = userReputations[roundLength - 1 - shift]
                ? Math.max(roundNow?.config?.defaultReputation, userReputations[roundLength - 1 - shift])
                : 0
            users[user] ||= 0
            users[user] += userOldReputation

            // Compute reputation received.(normalized)
            usersReceived[user] = [...Object.values(grants[user]||[]), 0]
                .reduce((p, n) => p + n)
            users[user] += usersReceived[user]

            // Compute mint received.
            usersMinted = [...Object.values(roundNow?.mints[user]||[]), 0]
                .reduce((p, n) => p + n)
            users[user] += usersMinted

            // Add reputation Quadratic funding
            users[user] += usersMatched[user] || 0

            // Get the diff between the user reputation and 10x the median(can't be lower than 1)
            const pctDiffMedian10 = Math.min(1, userOldReputation / (reputationSd * 10))
            // Apply the min reputation decay and more if the user is near the 10x median => tan(X^5)/tan(1)
            users[user] -= userOldReputation * (roundNow?.config?.minReputationDecay + (diffMinMax*(Math.tan(Math.pow(pctDiffMedian10, 5))/Math.tan(1))))

            // Cant be below defaultReputation
            users[user] = Math.max(roundNow?.config?.defaultReputation, users[user])
        }

        return {users, usersReceived, usersMatched, usersMinted}
    } catch (e) {
        logger.error(e)
        return {}
    }
}

/**
 * Check if round is ended and distribute reputation
 * @param db - In-memory database
 * @param mutex - Mutex to access database safely
 * @param discord - Discord service(contain Discord client)
 * @returns {Promise<boolean>}
 */
export const checkEndRound = async (db, mutex, discord) => {
    try {
        await mutex.runExclusive(async () => {
            await db.read()

            logger.debug('Check for all guild if round ended...')
            for(const guildUuid in db?.data){
                const lastRound = db?.data[guildUuid]?.rounds?.length === 0
                    ? null
                    : db?.data[guildUuid]?.rounds[db?.data[guildUuid]?.rounds?.length - 1]

                if (!lastRound){
                    logger.error(`Guild ${guildUuid} don't have any round!`)
                    continue
                }

                const endDate = Moment(lastRound?.startDate)
                    .add(lastRound?.config?.roundDuration-1, 'days')
                    .endOf('days')
                if(endDate.isAfter(Moment())) continue

                logger.info(`Guild ${guildUuid} round is ended...`)

                logger.debug('Distribute Reputation...')
                const {users} = await distributeReputation(db?.data[guildUuid], 0, discord)
                for(const user in db?.data[guildUuid]?.users){
                    db?.data[guildUuid]?.users[user]?.reputations.push(users[user])
                }
                logger.debug('Distribute Reputation done.')

                logger.debug('End round...')
                db.data[guildUuid].rounds[db.data[guildUuid].rounds.length - 1].endDate = endDate.toISOString()
                db.data[guildUuid].rounds.push(makeRound(
                    makeCore.makeRound(),
                    Moment(lastRound?.startDate)
                        .add(lastRound?.config?.roundDuration, 'days')
                        .toISOString(),
                    '',
                    makeRoundConfigFromGuildConfig(db?.data[guildUuid]?.config)
                    )
                )
                logger.debug('End round done.')

                if (discord){
                    logger.debug('Check Reputation Role...')
                    await addRemoveReputationRole(true, db?.data[guildUuid]?.users, db?.data[guildUuid]?.reputationRoles, db?.data[guildUuid]?.guildDiscordId, discord)
                    logger.debug('Check Reputation Role done.')
                }

                logger.info(`Guild ${guildUuid} round is ended done.`)
            }

            await db.write()
        })
        logger.debug('Check for all guild if round ended done.')
        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}
