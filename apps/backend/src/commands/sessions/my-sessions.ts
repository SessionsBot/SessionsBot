import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder, InteractionContextType, MessageFlags, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import guildManager from "../../utils/database/guildManager";
import getSessionDayPath from "../../utils/database/utils/getSessionDayPath";
import core from "../../utils/core";
import sessionManager from "../../utils/database/sessionsManager";
import { RsvpResult } from "../../utils/types/rsvpResponses";
import { GuildDocData, GuildSessionData, GuildSignupChannels, ValueOf } from "@sessionsbot/shared";

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName(`my-sessions`)
        .setDescription(`View your currently assigned/rsvp-ed sessions for today.`)
        .setContexts(InteractionContextType.Guild)
    ,
    // Command Execution:
    execute: async (interaction:CommandInteraction) => {
        // Defer Reply:
        await interaction.deferReply({flags: MessageFlags.Ephemeral}).catch(e => {})

        // Fetch guild:
        const fetchGuild = await guildManager.fetchGuildData(interaction.guildId);
        const guildData = fetchGuild.success ? fetchGuild.data.docData : null;
        const guild = fetchGuild.success ? fetchGuild.data.guildFetch : null;
        if(!guild || !guildData) throw ['Failed to fetch guild for /my-sessions response', fetchGuild];
        // Setup/Vars:
        const guildId = interaction.guildId;
        const guildName = interaction.guild.name;
        const userId = interaction.user.id;


        // Components:
        const components = {
            header: () => {
                let r = [];
                r.push(
                    new TextDisplayBuilder({content: `## 📥 Assigned Sessions \n-# Currently assigned sessions for today:`}),
                    new SeparatorBuilder()
                )
                return r
            },

            signupChannels: (signupChannels:GuildSignupChannels) => {
                let c = [];
                let ids = Object.keys(signupChannels)
                
                if(ids.length){
                    c.push(
                        new TextDisplayBuilder({content: `### **📝 Signup Channels:** \n-# View available sessions for signup. \n${`> <#` + ids.join(`> \n> <#`) + `>`}`})    
                    )
                } else {
                    c.push(
                        new TextDisplayBuilder({content: `### **📝 Signup Channels NOT SETUP:** \n> This server currently doesn't have any signup channels configured! \nThis means that Sessions Bot has nowhere to send sessions! A server moderator/owner will have to configure this server first using the [web dashboard](${core.urls.mainSite+'/dashboard'}).`})    
                    )
                }

                c.push(
                    new SeparatorBuilder(),
                    components.footer
                )
                
                return [new ContainerBuilder({
                    accent_color: core.colors.getOxColor('success'),
                    components: [...c]
                })];
            },

            assignedSessions: (assignedSessions:[string, GuildSessionData][], todayDayString:string) => {
                let r = [];
                
                if(assignedSessions.length){
                    for(const [sesId, sesData] of assignedSessions.sort(([aId, aData],[bId, bData]) => (Number(aData?.startsAt?.discordTimestamp ?? 0)) - (Number(bData?.startsAt?.discordTimestamp ?? 0)) )) {
                        let [rsvpId, rsvpData] = Object.entries(sesData?.rsvps||{}).find(([rsvpId, rsvpData]) => rsvpData?.users.includes(userId));
                        const sessionLink = `https://discord.com/channels/${guildId}/${sesData.signup.threadId}/${sesData.signup.messageId}`
                        r.push(    
                            new TextDisplayBuilder({content: `### [📌  ${sesData.title}](${sessionLink}) \n**RSVP Role:** \n> ${rsvpData?.emoji} ${rsvpData?.name} \n**Starts At:** \n> <t:${sesData?.startsAt?.discordTimestamp}:t>`}),
                            new ActionRowBuilder({
                                components: <any>[
                                    new ButtonBuilder({
                                        style: ButtonStyle.Secondary,
                                        label: `❌ Remove`,
                                        custom_id: `UN-RSVP:${todayDayString}:${sesId}:${rsvpId}`
                                    }),
                                ]
                            }),
                            new SeparatorBuilder()
                        )
                    }
                } else { // no assigned sessions
                    r.push(
                        new TextDisplayBuilder({content: `> 🥺 No currently assigned sessions..`}),
                        new SeparatorBuilder()
                    )
                }
                

                return r;
            },

            footer: new TextDisplayBuilder({content: `-# ${core.emojiStrings.sessions} Powered by [Sessions Bot](${core.urls.mainSite})`})
        }

        // Msg Responses:
        const responses = {

            assignedSessionsList: (recentGuildData:GuildDocData) => {
                // Get Refreshed Data:
                const guildTimezone = recentGuildData?.configuration?.timeZone;
                const todayDayString = getSessionDayPath(guildTimezone) || 'UNKNOWN-DAY?';
                const todaysSessions = recentGuildData?.sessionTimeline[todayDayString] || {};
                const signupChannels = recentGuildData?.configuration?.signupChannels || {};
                const assignedSessions = Object.entries(todaysSessions).filter(([sesId, sesData]) =>
                    Object.entries(sesData?.rsvps || {}).some(([rsvpId, rsvpData]) => rsvpData?.users?.includes(userId))
                )
                return[
                    new ContainerBuilder({
                        accent_color: Number(recentGuildData.configuration.accentColor) || core.colors.getOxColor('blue'),
                        components: <any>[
                            ...components.header(),
                            ...components.assignedSessions(assignedSessions, todayDayString),
                        ]
                    }),
                    ...components.signupChannels(signupChannels)
                ]
            },
            
            removedRsvpResult: (result:RsvpResult['result'], sessionId:string, userId:string, sessionDiscordLink:string) => {
                // Get new msg contents:
                if(result == 'Success')
                return new ContainerBuilder({
                    accent_color: core.colors.getOxColor('success'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `### ✅ Success - Un-RSVP`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `**Details:** \n> You have successfully removed yourself as an RSVP from this session!`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    style: ButtonStyle.Secondary,
                                    label: '↩ My Sessions',
                                    custom_id: 'MY-SESSIONS'
                                })
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `-# Session Id: [${sessionId}](${sessionDiscordLink})`}),
                    ]
                })
                else // Failed to Undo RSVP Msg:
                return new ContainerBuilder({
                    accent_color: core.colors.getOxColor('error'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `### ❌ Failed - Un-RSVP`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `**Details:** \n> We were unable to remove you as an RSVP for the following reason: \n> \`${result}\` \n\nTip: *If you believe this is an error please contact support.*`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    style: ButtonStyle.Secondary,
                                    label: '↩ My Sessions',
                                    custom_id: 'MY-SESSIONS'
                                }),
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: '💬 Get Support',
                                    url: core.urls.support.serverInvite
                                }),
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `-# Session Id: [${sessionId}](${sessionDiscordLink})`}),
                    ]
                })

                
            }

        }


        // Send initial response:
        await interaction.editReply({
            components: [
                ...responses.assignedSessionsList(guildData),
            ],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })


        // Await further interaction:
        const reply = await interaction.fetchReply()
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            idle: 60_000 // 60s idle timeout
        })


        // On new interaction:
        collector.on('collect', async (newInteraction) => {
            collector.resetTimer()
            await newInteraction.deferUpdate().catch(()=>{});

            // If: Un/Removing an RSVP - UN-RSVP:XX-XX-XX:abc:abc...
            if(newInteraction.customId.startsWith('UN-RSVP')){
                // Parse interaction id data:
                const [, unRsvpDayString, sessionId, rsvpId] = newInteraction.customId.split(':');

                // Attempt to un-rsvp:                
                const unRsvpAttempt = await sessionManager.sessions.rsvps.remove(guildId, sessionId, unRsvpDayString, userId);
                const rsvpResult = unRsvpAttempt.result;

                const sessionLink = `https://discord.com/channels/${interaction.guildId}/${unRsvpAttempt?.data?.staleSessionData?.signup?.threadId}/${unRsvpAttempt?.data?.staleSessionData?.signup?.messageId}`

                await interaction.editReply({
                    components: [responses.removedRsvpResult(rsvpResult, sessionId, userId, sessionLink)]
                })
                
            }
            
            // If: Canceled/Going back to assigned sessions list - MY-SESSIONS
            if(newInteraction.customId == 'MY-SESSIONS'){
                const getData = await guildManager.readGuildDoc(newInteraction.guildId);
                const updatedData = getData.success ? getData.data : guildData;

                await interaction.editReply({
                    components: [...responses.assignedSessionsList(updatedData)]
                })
            }

            // newInteraction.update('');
        })
        

        // on collector timeout:
        collector.on('end', async (col, reason) => {
            await interaction.deleteReply().catch((e) => {});
        })

    }
}