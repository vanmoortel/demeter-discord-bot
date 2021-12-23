import logger from '../../../core/winston/index.js'

/**
 * Add or remove a discord role based on user reputation
 * @param isAdd - If true add role or remove role
 * @param users - List of user in DB
 * @param reputationRoles - Add/remove this role if enough reputation {role: minReputation}
 * @param guildDiscordId - Guild Discord Id
 * @param client - Client Discord
 * @returns {Promise<{}|boolean>}
 */
export const addRemoveReputationRole = async (isAdd, users, reputationRoles, guildDiscordId, {client}) => {
    try {
        logger.debug('Fetch guild...')
        const guild = await client?.guilds
            ?.fetch(guildDiscordId)
            ?.catch(() => null)
        if(!guild) return {}
        logger.debug('Fetch guild done.')

        logger.debug('Update role base on reputation for all users...')
        for (const user of Object.values(users)){
            const roleToAdd = Object.keys(reputationRoles)
                ?.filter(role => reputationRoles[role] <= user?.reputations[user?.reputations?.length - 1])
            if (!roleToAdd?.length) continue

            const member = await guild?.members
                ?.fetch(user?.discordId)
                ?.catch(() => null)
            if (!member)continue

            for (const role of roleToAdd){
                if (isAdd) {
                    if (member?.roles?.cache?.has(role)) continue
                    await member?.roles
                        ?.add(role)
                        ?.catch(() => logger.error(`Failed to add role ${role} to ${member?.id}`))
                } else {
                    if (!member?.roles?.cache?.has(role)) continue
                    await member?.roles
                        ?.remove(role)
                        ?.catch(() => logger.error(`Failed to remove role ${role} of ${member?.id}`))
                }
            }
        }
        logger.debug('Update role base on reputation for all users done.')
        return true
    } catch (e) {
        logger.error(e)
        return false
    }
}