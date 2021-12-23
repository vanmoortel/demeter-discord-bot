import logger from '../../core/winston/index.js'

/**
 * Discord quadratic funding
 * @param totalBurn - How much was burn during this round
 * @param roundConfig - Config of current round
 * @param grants - Normalized grants of current round
 * @param users - Users from DB
 * @param shift - How much round in the past(used to retrieve correct user reputation)
 * @param guildId - Guild discordId
 * @param client - Discord client
 * @returns {Promise<{}|{[string]: number}>}
 */
export const quadraticFunding = async (totalBurn, roundConfig, grants, users, shift = 0, guildId, {client}) => {
    try {
        let usersPower = {}
        let usersRoleMultipliers = {}
        let usersMatched = {}
        let grantsSum = 0
        const guild = await client?.guilds
            ?.fetch(guildId)
            ?.catch(() => null)
        if(!guild) return {}

        logger.debug('Fetch all role multiplier...')
        for (const user in users) {
            if (Object.keys(roundConfig?.rolePowerMultipliers)?.length > 1){
                usersRoleMultipliers[user] = roundConfig?.rolePowerMultipliers['default']

                if (!users[user]?.discordId)  continue

                const member = await guild?.members
                    ?.fetch(users[user]?.discordId)
                    ?.catch(() => null)
                if (!member) continue

                // Take max multiplier for this user
                for (const role in roundConfig?.rolePowerMultipliers){
                    if (role === 'default') continue
                    usersRoleMultipliers[user] = Math.max(
                        usersRoleMultipliers[user],
                        member?.roles?.cache?.has(role)
                            ? roundConfig?.rolePowerMultipliers[role]
                            : 0)
                }
            }
        }
        logger.debug('Fetch all role multiplier done.')

        logger.debug('Compute power for QR...')
        for (const receiver in grants) {
            let sqrtPowerReceived = 0
            for (const sender in grants[receiver]) {
                const userReputations = users[sender]?.reputations

                if (!userReputations){
                    logger.error(`User ${sender} is undefined !`)
                    continue
                }

                // If user reputation is 0 or sent 0 skip this one
                if (!grants[receiver][sender] || !userReputations[userReputations?.length - 1 - shift])
                    continue

                // Take the last 10 round to compute seniority
                const sliceStart = Math.max(0, userReputations?.length - shift - 10)
                const sliceEnd = userReputations?.length - shift
                // Round-weighted average reputation
                // Sum multiply reputation by how much round in the past
                let seniority = userReputations
                    ?.slice(sliceStart, sliceEnd)
                    ?.map((r, i) => r * (userReputations?.length - i))
                    ?.reduce((a, n) => a+n)
                // Divide by sum of round amount(eg: 10+9+8+7+6+5+4+3+2+1)
                seniority /= userReputations
                    ?.slice(sliceStart, sliceEnd)
                    ?.map((_, i) => i + 1)
                    ?.reduce((a, n) => a+n)
                // Divide by reputation now
                seniority /= userReputations[userReputations?.length - 1 - shift]

                // Compute Role multiplier
                let roleMultiplier = usersRoleMultipliers[sender]

                // Square root of grant received multiply by the seniority and role multiplier of the sender
                sqrtPowerReceived += Math.sqrt(grants[receiver][sender] * seniority * roleMultiplier)
                grantsSum += grants[receiver][sender]
            }

            usersPower[receiver] = Math.pow(sqrtPowerReceived, 2)
        }
        logger.debug('Compute power for QR done.')

        logger.debug('Distribute Discord Grant...')
        // Compute inflation based on sum of user grants
        const discordMatching = roundConfig?.discordMatching + totalBurn
        const powerSum = [...Object.values(usersPower), 0].reduce((p, n) => p + n)
        if (powerSum > 0) {
            for(const receiver in usersPower) {
                usersMatched[receiver] = discordMatching * (usersPower[receiver] / powerSum)
            }
        }
        logger.debug('Distribute Discord Grant done.')

        return usersMatched
    } catch (e) {
        logger.error(e)
        return {}
    }
}