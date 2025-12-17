import { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, SectionBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } from "discord.js"
import core from "../../core.js"
import { DateTime } from "luxon"
import logtail from "../../logs/logtail.js";
// import getSessionDayPath from "../../database/utils/getSessionDayPath.js";

/** Creates a signup panel msg container from a session id, data, and optional accent color. */
export const createSessionSignupContainer = (guildId: string, guildDocData: GuildDocData, sessionId: string, sessionData: GuildSessionData) => {
    try {
        const accentColor = Number(guildDocData.configuration?.accentColor) || null;

        // Get day-path string from discord timestamp:
        const dayPathString = getSessionDayPath(guildDocData.configuration.timeZone, sessionData.startsAt.discordTimestamp)

        // Get Session Occurrence Date:
        const sessionOccursDate = DateTime.fromSeconds(Number(sessionData?.startsAt?.discordTimestamp));
        if (!sessionOccursDate.isValid) throw 'sessionOccursDate is INVALID!'
        const sessionAlreadyOccurred = sessionOccursDate.diffNow().valueOf() <= 0;

        // Auto build rsvp sections:
        const RsvpSections = () => {
            let response = [];
            const rsvpRoles = Object.entries(sessionData.rsvps)

            const mapAssignedUsers = (users: string[]) => users?.length ? '> ' + users.map(user => `<@${user}>`).join(`\n > `) : '> No RSVPs';
            const availabilityText = (role: ValueOf<SessionRsvps>) => {
                if (role.users.length >= role.capacity || sessionAlreadyOccurred) return '`UNAVAILABLE🔴';
                else return 'AVAILABLE🟢';
            };
            const capacityText = (role: ValueOf<SessionRsvps>) => `${role?.users?.length || 0}/${role?.capacity}`
            const roleAvailable = (role: ValueOf<SessionRsvps>) => {
                if (sessionAlreadyOccurred || role.users.length >= role.capacity) return false;
                else return true;
            }

            for (const [index, role] of rsvpRoles) {
                response.push(new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**${role.emoji} ${role.name}**\ *\`(${capacityText(role)})\`* \n${mapAssignedUsers(role?.users || [])}` })
                    ],
                    accessory: {
                        style: ButtonStyle.Secondary,
                        custom_id: `RSVP:${dayPathString}:${sessionId}:${index}`,
                        type: ComponentType.Button,
                        label: roleAvailable(role) ? '✅' : '⛔',
                        disabled: roleAvailable(role) ? false : true
                    }
                }))
                response.push(new SeparatorBuilder())
            }

            return response
        }

        // Session location button:
        const sessionLocationButton = () => sessionData?.url ?
            new ButtonBuilder({
                style: ButtonStyle.Link,
                url: core.urls.mainSite,
                label: '🎯 Location'
            }) : null


        // Build Message:
        const build = new ContainerBuilder({
            accent_color: accentColor ? accentColor : null,
            components: <any>[
                // Session Details:
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `## 📌 ${sessionData?.title}\ \n-# ${sessionData?.description}` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `### ⏰ Starts at:\ \n > <t:${Math.floor(sessionOccursDate.toSeconds())}:d> | <t:${Math.floor(sessionOccursDate.toSeconds())}:t> ` }),
                new SeparatorBuilder(),

                // RSVP Sections:
                ...RsvpSections(),

                // Action Buttons:
                new ActionRowBuilder({
                    components: [
                        sessionLocationButton(),
                        new ButtonBuilder({
                            style: ButtonStyle.Link,
                            url: core.urls.mainSite + '/sessions/GUILD_ID/DISCORD_TIMESTAMP',
                            label: '💻 View Online'
                        })
                    ].filter(Boolean) as ButtonBuilder[]
                }),

                new SeparatorBuilder(),
            ]
        })

        // Return Built Message:
        return { build };

    } catch (err) {
        // Log & return failure:
        const sessionDayPath = getSessionDayPath(guildDocData?.configuration?.timeZone);
        const sessionData = guildDocData?.sessionTimeline?.sessionDayPath?.[sessionId];
        logtail.warn(`[⚠] Failed to build session signup container for guild! - see details`, { sessionData, err })
        return new ErrorResult(`Failed to build message!`, err);
    }
}
