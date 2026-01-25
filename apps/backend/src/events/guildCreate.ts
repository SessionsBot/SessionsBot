import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, Events, Guild, TextDisplayBuilder } from "discord.js";
import { useLogger } from "../utils/logs/logtail";
import core from "../utils/core";
import sendWithFallback from "../utils/bot/messages/sendWithFallback";
import discordLog from "../utils/logs/discord";
import dbManager from "../utils/database/manager";
import createAuditLog, { AuditEvent } from "../utils/database/auditLog";

const createLog = useLogger();



/** Event - New guild added Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        // Log new guild added:
        createLog.for('Guilds').info(`➕ GUILD ADDED - ${guild.name} - ${guild.id}`);
        discordLog.events.guildAdded(guild);
        createAuditLog({
            event: AuditEvent.BotAdded,
            guild: guild.id,
            meta: undefined
        })

        // Add new guild to database:
        const result = await dbManager.guilds.add(guild);
        if (!result.success) {
            return createLog.for('Database').error('Failed to save/create - New Guild - SEE DETAILS', { result })
        }

        // Build/Send Welcome Message:
        const welcomeContainer = new ContainerBuilder({
            accent_color: core.colors.getOxColor('success'),
            components: <any>[
                new TextDisplayBuilder({ content: `## Thank you for using <@${core.botClient.user.id}> Bot! \n -# Click below to view your **Bot Dashboard** to get started with using Sessions Bot within this server.` }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            label: '💻 View Dashboard',
                            style: ButtonStyle.Link,
                            url: 'https://sessionsbot.fyi/dashboard'
                        })
                    ]
                })
            ]
        });
        const send = await sendWithFallback(guild.id, welcomeContainer);
        if (!send.success) {
            createLog.for('Bot').warn(`Failed to send "Welcome Message" for new guild! - ${guild.id}`, { sendResult: send });
        }
    }
}