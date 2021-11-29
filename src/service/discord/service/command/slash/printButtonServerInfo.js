import logger from "../../../../winston/index.js";
import {MessageActionRow, MessageButton} from "discord.js";
import {BUTTON_SERVER_INFO} from "../button/serverInfo.js";
import {ApplicationCommandOptionTypes} from "../../../../../utils/discordConstant.js";

export const PRINT_BUTTON_SERVER_INFO = {type: ApplicationCommandOptionTypes.SUB_COMMAND, name: 'button-server-info', description: 'Print button to show server info'}

/**
 * Print the button to show the server information
 * @param interaction - Discord interaction
 * @returns {Promise<boolean>}
 */
export const printButtonServerInfo = async (interaction) => {
    try {
        if (interaction?.options?.data[0]?.name !== PRINT_BUTTON_SERVER_INFO.name) return false

        await interaction.reply({content: 'Done !', ephemeral: true})
        await interaction.channel.send({content: 'You can click on one of the following buttons to view the server configuration \n\n', components: [new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.ADMIN_ROLE.customId)
                        .setLabel(BUTTON_SERVER_INFO.ADMIN_ROLE.label)
                        .setStyle(BUTTON_SERVER_INFO.ADMIN_ROLE.style),
                ),new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.DISCORD_MATCHING.customId)
                        .setLabel(BUTTON_SERVER_INFO.DISCORD_MATCHING.label)
                        .setStyle(BUTTON_SERVER_INFO.DISCORD_MATCHING.style),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.ROUND_DURATION.customId)
                        .setLabel(BUTTON_SERVER_INFO.ROUND_DURATION.label)
                        .setStyle(BUTTON_SERVER_INFO.ROUND_DURATION.style),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.REPUTATION_DECAY.customId)
                        .setLabel(BUTTON_SERVER_INFO.REPUTATION_DECAY.label)
                        .setStyle(BUTTON_SERVER_INFO.REPUTATION_DECAY.style),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.ROLE_POWER.customId)
                        .setLabel(BUTTON_SERVER_INFO.ROLE_POWER.label)
                        .setStyle(BUTTON_SERVER_INFO.ROLE_POWER.style),
                ),new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.REPLY_GRANT.customId)
                        .setLabel(BUTTON_SERVER_INFO.REPLY_GRANT.label)
                        .setStyle(BUTTON_SERVER_INFO.REPLY_GRANT.style),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.REACTION_GRANT.customId)
                        .setLabel(BUTTON_SERVER_INFO.REACTION_GRANT.label)
                        .setStyle(BUTTON_SERVER_INFO.REACTION_GRANT.style),
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId(BUTTON_SERVER_INFO.CHANNEL_GRANT_MULTIPLIER.customId)
                        .setLabel(BUTTON_SERVER_INFO.CHANNEL_GRANT_MULTIPLIER.label)
                        .setStyle(BUTTON_SERVER_INFO.CHANNEL_GRANT_MULTIPLIER.style),
                )]})
        return true
    } catch (e) {
        logger.error(e)
        await interaction.reply({content: 'Something went wrong...', ephemeral: true})
        return true
    }
}
