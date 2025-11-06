import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, ContainerBuilder, DMChannel, Interaction, InteractionContextType, Message, MessageFlags, MessagePayload, PermissionFlagsBits, ReplyOptions, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import guildManager from "../../utils/database/guildManager.js";
import threadWithFallback from "../../utils/bot/threadWithFallback.js";
import core, { get0xColor, urls } from "../../utils/core.js";
import { treeifyError } from 'zod'
import { defaultFooterText, invalidInputMsg } from "../../utils/bot/messageBuilders/basic.js";
import { GuildSessionData, sessionSchema } from "@sessionsbot/shared";
import { DateTime } from "luxon";
import parseHumanTime from "../../utils/dates/parseHumanTime.js";
import logtail from "../../utils/logs/logtail.js";


export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName(`new-session`)
        .setDescription('Create a new session for TODAY. Looking to schedule later? Use the web dashboard..')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild || PermissionFlagsBits.CreateEvents)
        .setContexts(InteractionContextType.Guild)
    ,
    // Command Execution:
    execute: async (cmdInteraction:CommandInteraction) => {
        // Defer Reply:
        await cmdInteraction.deferReply({flags: MessageFlags.Ephemeral}).catch(()=>{})

        // Creation/Draft Steps:
        type CreateStep = 'S-TITLE' | 'S-DESC' | 'S-TIME' | 'S-LOCATION' | 'S-RSVPS';
        let currentStep:CreateStep = 'S-TITLE';
        let sesLocation = {confirmed: false, enabled: false};
        let sessionDraft = {} as GuildSessionData;

        // Get Guild Data:
        const { guildId, user } = cmdInteraction
        const getGuild = await guildManager.fetchGuildData(guildId);
        if(!getGuild.success) throw ['Failed to fetch guild for cmd!', getGuild];
        const {docData, guildFetch:guild} = getGuild.data;
        const guildTimeZone = docData.configuration.timeZone;
        const guildCurTimeString = () => DateTime.now().setZone(docData.configuration.timeZone).toFormat('h:mm a')

        // Create Private Thread/DM:
        const thread = await threadWithFallback(cmdInteraction.guild, cmdInteraction.user, cmdInteraction.channel);

        // Send Redirect Msg to Interaction Channel:
        const isThread = typeof thread != typeof DMChannel
        if(isThread){
            await cmdInteraction.editReply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [new ContainerBuilder({accent_color: get0xColor('blue'), components: <any>[
                    new TextDisplayBuilder({content: `### 📄 Thread Created - Sessions Draft`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `Hi <@${user.id}>, I've created a **private thread** for us to draft this new session! \n\nPlease join me in <#${thread.id}> to draft and post this session.`}),
                    new SeparatorBuilder(),
                    defaultFooterText()
                ]})]
            })
        }else{
            await cmdInteraction.editReply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [new ContainerBuilder({accent_color: get0xColor('blue'), components: <any>[
                    new TextDisplayBuilder({content: `### 📩 DM Sent - Sessions Draft`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `Hi <@${user.id}>, I've sent you a *personal DM* for us to draft this new session! There was **no suitable place** for me to create a private thread? *([check permissions](${urls.docs.requiredBotPermissions}))* \n\nPlease join me in <#${thread.id}> to draft and post this session.`}),
                    new SeparatorBuilder(),
                    defaultFooterText()
                ]})]
            })
        }

        const utils = {
            msgs: {
                validInput: (inputTitle:string, content:string) => {
                    return new ContainerBuilder({
                        accent_color: core.colors.getOxColor('success'),
                        components: <any>[
                            new TextDisplayBuilder({content: `✔  Valid - ${inputTitle || 'Input'}: \n> ${content}`})
                        ]
                    })
                },

                invalidInput: (inputName:string, inputRes:string, details:{errorMap:{[inputName:string]:string[]}} ) => {
                    let r:ContainerBuilder[] = []
                    r.push(
                        new ContainerBuilder({
                            accent_color: core.colors.getOxColor('error'),
                            components: <any>[
                                new TextDisplayBuilder({content: `✖  Invalid - ${inputName || 'Input'}: \n> ${inputRes}`})
                            ]
                        }),
                        invalidInputMsg({v2:{errorMap: details.errorMap}}),
                        new ContainerBuilder({accent_color:get0xColor('error'), components: <any>[
                            new TextDisplayBuilder({content: `-# To try again: Just send another message \n-# To cancel: Say "stop" or "cancel"`})
                        ]})
                    )                    
                    return r;
                },

                fieldQuestion: (number:number, title:string, details:string) => {
                    return new ContainerBuilder({
                        accent_color: get0xColor('warning'),
                        components: <any>[
                            new TextDisplayBuilder({content: `### ❓ - ${title}`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `${details}`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `-# Please respond within 60 seconds. \n-# [Need Help?](${urls.support.serverInvite})`}),
                        ]
                    })
                },

                sessionDraft: () => {
                    const rsvpSections = () => {
                        return new TextDisplayBuilder({content: `> *Not Set*`})
                    }
                    const timestampString = sessionDraft?.startsAt?.discordTimestamp ? `<t:${sessionDraft?.startsAt?.discordTimestamp}:t>` : null;
                    return new ContainerBuilder({
                        accent_color: core.colors.getOxColor('blue'),
                        components: <any>[
                            new TextDisplayBuilder({content: `### 📄 - Session Draft \n-# You're creating a new session for today.`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `**Title**: \n> ${sessionDraft?.title||'*Not Set*'} \n**Description**: \n> ${sessionDraft?.description||'*Not Set*'} \n**Starts At**: \n> ${ timestampString ||'*Not Set*'} \n**Location**: \n> ${ sessionDraft.url ||'*Not Set*'} \n**RSVPs**:`}),
                            rsvpSections(),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content:`-# To Cancel: Say "stop" or "cancel"`})
                        ]
                    })
                }
            },

            refreshDraft: async () => {
                await draftMsg.edit({
                    components: [utils.msgs.sessionDraft()]
                });
            },

            updateQuestion: async (number:number, title:string, details:string) => {
                await questionMsg.edit({
                    components: [utils.msgs.fieldQuestion(number, title, details)]
                });
            }
        }

        // Send hello:
        await thread.send({
            flags: MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder({accent_color: get0xColor('success'), components: <any>[
                    new TextDisplayBuilder({content: `**Hi <@${user.id}>**, this is where we'll setup your new session for today! \n-# Looking to schedule sessions for a different day or don't enjoy the Discord setup style? Feel free to use your [bot dashboard](${core.urls.mainSite+'/dashboard'}).`})
                ]}),
            ]
        })

        // Send new draft:
        const draftMsg = await thread.send({
            flags: MessageFlags.IsComponentsV2,
            components: [utils.msgs.sessionDraft()],
        })
        let questionMsg = null as Message;

        // Simulate Typing - Send Q1 - Title:
        currentStep = 'S-TITLE';
        await thread.sendTyping();
        setTimeout(async ()=>
            questionMsg = await thread.send({
                components: <any>[utils.msgs.fieldQuestion(
                    1,
                    'Session Title',
                    "**Please provide a brief title for this session.** \n*(Max: 30 characters)*"
                )],
                flags: MessageFlags.IsComponentsV2
            })
        ,1_000)

        // Create Response Collector:
        const refreshed = await thread.fetch();
        const collector = refreshed.createMessageCollector({idle: 65_000, filter: (i) => i.author.id == user.id});
        const yesKeywords = ['yes', 'y', 'ye'];
        const noKeywords = ['no', 'n', 'none']

        collector.on('collect', async (colInteraction) => {
            const resContent = colInteraction.content;
            collector.resetTimer({
                idle: 65_000,
                time: 65_000
            })

            // If canceling:
            const abortKeywords = ['stop', 'cancel', 'abort', 'end'];
            const strippedResWord = resContent.trim().toLowerCase().split(' ')[0]
            if(abortKeywords.includes(strippedResWord)){ // Aborted
                await colInteraction.reply({flags: MessageFlags.IsComponentsV2, components: <any>[
                    new ContainerBuilder({
                        accent_color: get0xColor('error'),
                        components: <any>[
                            new TextDisplayBuilder({content: `### 🗑️ Session Draft - Aborted!`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `> This thread will be deleted in 30 seconds.. `}),
                            new SeparatorBuilder(),
                            defaultFooterText()
                        ]
                    })
                ]});
                collector.stop('aborted')
                return setTimeout(async () => {
                    await thread.delete().catch(()=>{});
                }, 30_000)
            }


            // Setting Title:
            if(currentStep == 'S-TITLE'){
                // Validate title:
                const parsed = sessionSchema.pick({"title":true}).safeParse({title: resContent})
                if(parsed.success){ // valid input
                    // Update Draft:
                    sessionDraft.title = parsed.data.title;

                    // Update Draft/Advance Question - Q2 Desc:
                    await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [
                            utils.msgs.validInput('Title', parsed.data.title),
                            utils.msgs.sessionDraft(),
                            utils.msgs.fieldQuestion(
                                2,
                                "Session Description",
                                "**Please provide a description for this session.** \n*(Max: 150 characters)*"
                            )
                        ],
                    })
                    return currentStep = 'S-DESC';

                }else{ // invalid input
                    return await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [ ...utils.msgs.invalidInput('Title', resContent, {errorMap: {Title: treeifyError(parsed.error).properties.title.errors}} ) ]
                    })
                }
            }


            // Setting Description:
            if(currentStep == 'S-DESC'){
                // Validate Desc:
                const parsed = sessionSchema.pick({"description":true}).safeParse({description: resContent})
                if(parsed.success){ // valid input
                    // Update Draft:
                    sessionDraft.description = parsed.data.description;

                    // Update Draft/Advance Question - Q3 Starts At:
                    await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [
                            utils.msgs.validInput('Description', parsed.data.description),
                            utils.msgs.sessionDraft(),
                            utils.msgs.fieldQuestion(
                                3,
                                "Start Time",
                                `**Provide the start time for this session.**\n> Ex: "9 am", "In 2 hours", "midnight", etc. \n-# **MAKE SURE** this time hasn't already occurred today! \n-# Current Server Time: \`${guildCurTimeString()}\` `
                            )
                        ],
                    })
                    return currentStep = 'S-TIME';

                }else{ // invalid input
                    return await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [ ...utils.msgs.invalidInput('Description', resContent, {errorMap: {Description: treeifyError(parsed.error).properties.description.errors}} ) ]
                    })
                }
            }


            // Setting Start Time:
            if(currentStep == 'S-TIME'){
                // Validate Input Time:
                const parsed = parseHumanTime(resContent, guildTimeZone);
                const diffSeconds = parsed?.diffNow('seconds').seconds;
                // Get date/time properties
                const isFuture = diffSeconds > 0;   // True if future
                const isPast = diffSeconds < 0;     // True if in the past
                const isBeyondToday = parsed?.get('day') != DateTime.now()?.setZone(guildTimeZone)?.get('day');
                const discordTimestamp = Math?.floor(parsed?.toSeconds()) || 'null';
                
                if(!isFuture || !parsed || isBeyondToday || isPast) { // Invalid Input:
                    return await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [ ...utils.msgs.invalidInput('Session Time', resContent, {errorMap: {Session_Time: [`Invalid Start Time! Use a relative time such as: "3 pm", "in 2 hours", "at midnight", etc. \n-# Also, **make sure** this is a future time in your servers timezone ('${guildTimeZone}' | **\`${guildCurTimeString()}\`**).  `]}}) ]
                    })

                } else { // Valid Input:
                    // Update Draft:
                    sessionDraft.startsAt = {
                        hours: parsed.get('hour').valueOf(),
                        minuets: parsed.get('minute').valueOf(),
                        discordTimestamp: String(discordTimestamp)
                    }

                    // Update Draft/Advance Question - Q3 Starts At:
                    await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [
                            utils.msgs.validInput('Starts At', `<t:${discordTimestamp}:t>`),
                            utils.msgs.sessionDraft(),
                            utils.msgs.fieldQuestion(
                                4,
                                "Location *(optional)*",
                                `**Would you like to provide a website url location for this session?** \n> Say either: "Yes" or "No"`
                            )
                        ],
                    })
                    return currentStep = 'S-LOCATION';
                }

            }

            // Setting Location:
            if(currentStep == 'S-LOCATION'){
                // 1. Enable/Confirm - Session Location:
                if(!sesLocation.confirmed && !sesLocation.enabled && yesKeywords.includes(strippedResWord)){
                    // Valid - Replied 'Yes' - Enabling Session Location:
                    sesLocation = {confirmed: true, enabled: true};
                    // Send nested - url question:
                    return await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [
                            utils.msgs.validInput('Location', "Yes"),
                            utils.msgs.fieldQuestion(4, 'Location', `**Please provide the full url location for this session.** \nEx: "https://sessionsbot.fyi" *(include https)*`)
                        ]
                    })
                    

                } else if(!sesLocation.confirmed && !sesLocation.enabled && noKeywords.includes(strippedResWord)) {
                    // Valid - Replied 'No' - Skipping/Disabling Session Location:
                    sesLocation = {confirmed: true, enabled: false};
                    // Send next question:
                    return await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [
                            utils.msgs.validInput('Location', "No *(skip)*"),
                            utils.msgs.sessionDraft(),
                            utils.msgs.fieldQuestion(
                                5,
                                "RSVPs *(optional)*",
                                `**Would you like to enable RSVPing for this session?** \n> Say either: "Yes" or "No"`
                            )
                        ]
                    });
                        
                    
                } else if(!sesLocation.confirmed) {
                    // Invalid - Confirmation Input:
                    await colInteraction.reply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [...utils.msgs.invalidInput("Location - Confirmation", resContent, {errorMap:{Location_Confirmation: [`**Incorrect option provided**, please say either: \n\`Yes\` *(I want to provide a session url)* \nor \n\`No\` *(I don't want to provide a session url)*`]}})]
                    })
                }

                // 2. Validate URL Input - If Confirmed:
                if(sesLocation.confirmed && sesLocation.enabled){
                    const parsed = sessionSchema.pick({url:true}).safeParse({url: resContent})

                    if(parsed.success){ // valid location/url provided
                        // Update Draft - Advance Question:
                        sessionDraft.url = parsed.data.url;
                        // Send new Question:
                        await colInteraction.reply({
                            flags: MessageFlags.IsComponentsV2,
                            components: [
                                utils.msgs.validInput("Location", parsed.data.url),
                                utils.msgs.sessionDraft(),
                                utils.msgs.fieldQuestion(
                                    5,
                                    "RSVPs *(optional)*",
                                    `**Would you like to enable RSVPing for this session?** \n> Say either: "Yes" or "No"`
                                )
                            ]
                        })

                    } else{ // invalid location/url provided
                        // Send Invalid / Try Again Alert:
                        await colInteraction.reply({
                            flags: MessageFlags.IsComponentsV2,
                            components: [...utils.msgs.invalidInput('Location Url', resContent, {errorMap: {Location: treeifyError(parsed.error).properties.url.errors}})]
                        })
                    }

                }
            }




        })

        // On Collector Timeout:
        collector.on('end', async (cl, reason) => {
            if (reason == 'aborted') return;
            await refreshed.send({
                flags: MessageFlags.IsComponentsV2,
                components: [new ContainerBuilder({accent_color: core.colors.getOxColor('error'), components: <any>[
                    new TextDisplayBuilder({content: `### ⏰ - Time Expired!`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# Unfourtonetly, you ran out of time to respond to the questions within this thread. Due to timeout limitations you'll have to start the process over by reusing the </${cmdInteraction.commandName}:${cmdInteraction.commandId}> command. \n\n-# Otherwise, we always recommend using the [Web Dashboard](https://sessionsbot.fyi/dashboard) to create new sessions.`}),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                label: `🗑️ Delete this Thread`,
                                custom_id: 'DELETE-THREAD-LOCAL',
                                style: ButtonStyle.Secondary
                            })
                        ]
                    }),
                    new SeparatorBuilder(),
                    defaultFooterText({showHelpLink: true})
                ]})]
            }).catch(()=>{})
        })

    }
}