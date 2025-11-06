import { LabelBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder, TextInputBuilder, ChannelSelectMenuBuilder, ChannelType, ModalComponentData, SelectMenuDefaultValueType, ModalSubmitInteraction } from "discord.js";
import guildManager from "../../utils/database/guildManager.js";
import parseHumanTime from "../../utils/dates/parseHumanTime.js";
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messageBuilders/basic.js";
import core from "../../utils/core.js";
import { DateTime } from "luxon";
import { GuildSignupChannels, pricingLimits, time24HRS, ValueOf } from "@sessionsbot/shared";
import logtail from "../../utils/logs/logtail.js";
import { db } from "../../utils/database/firebase.js";
import { FieldValue } from "firebase-admin/firestore";


export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName(`signup-channels`)
        .setDescription(`Adjust your servers Session Signup Channels and posting times.`)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild || PermissionFlagsBits.Administrator)
    ,
    // Command Execution:
    execute: async (interaction:CommandInteraction) => {
        // Interaction data:
        const { guildId } = interaction
        if (!interaction.channel) return interaction.reply(`Sorry, I can't collect responses here! Try again from a Text Channel..`);

        // Guild data:
        const getGuild = await guildManager.readGuildDoc(guildId)
        if(!getGuild.success) throw 'Failed to fetch guild for cmd!';
        let guildData = getGuild.data
        const guildTimeZone = guildData.configuration.timeZone;
        let signupChannels = () => Object.entries(guildData?.configuration?.signupChannels || {}).map(([channelId, data]) => {
            const timeObj = data.signupPostTime;
            const postTimeUtcSeconds = Math.floor(DateTime.now().setZone(guildTimeZone).set({hour: timeObj.hours, minute: timeObj.minuets, second: 0, millisecond: 0}).toSeconds());
            return [channelId, postTimeUtcSeconds];
        });

        // Build/send initial response:
        const signupChannelSections = () => {
            let r = [];
            for(const [chanId, postTimeSec] of signupChannels()){
                r.push(
                    new TextDisplayBuilder({content: `### 📄 - <#${chanId}> \n**Daily Post Time:** <t:${postTimeSec}:t>`}),
                    new ActionRowBuilder({
                        components: <any>[
                            new ButtonBuilder({
                                style: ButtonStyle.Secondary,
                                custom_id: `EDIT-POST-CHANNEL:${chanId}`,
                                label: `📄 Edit`
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Secondary,
                                custom_id: `EDIT-POST-TIME:${chanId}`,
                                label: `⏰ Edit`
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Danger,
                                custom_id: `DELETE-SIGNUP-CHANNEL:${chanId}`,
                                label: `✖ Delete`
                            })
                        ]
                    })
                
                )
                r.push(new SeparatorBuilder())
            }
            return r;
        }
        const initMsg = async (fetch?:boolean) => {
            if(fetch){
                const freshData = await guildManager.readGuildDoc(guildId);
                if(freshData.success) guildData = freshData.data;
            }
            return new ContainerBuilder({
            accent_color: core.colors.getOxColor('warning'),
            components: <any>[
                new TextDisplayBuilder({content: `## ⚙️ Signup Channels \nBelow are your server's currently configured Session Signup Channels.`}),
                new SeparatorBuilder(),
                ...signupChannelSections(),
                new ActionRowBuilder({
                    type: ComponentType.ActionRow,
                    components: <any>[
                        new ButtonBuilder({
                            style: ButtonStyle.Success, 
                            type: ComponentType.Button,
                            label: `➕`,
                            custom_id: 'ADD-SIGNUP-CHANNEL'
                        }),
                        new ButtonBuilder({
                            style: ButtonStyle.Link, 
                            type: ComponentType.Button,
                            label: `💻 Edit Online`,
                            url: core.urls.mainSite + '/dashboard?action=edit-signup-channels',
                            disabled: signupChannels.length >= pricingLimits.FREE_PLAN.MAX_SIGNUP_CHANNELS
                        })
                    ]
                }),
                new SeparatorBuilder(),
                defaultFooterText(),
            ]
        })
        } 
        await interaction.reply({
            components: [(await initMsg())],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });

        // Update signup channels list utility:
        const updateInitMsg = async () => {
            await interaction.editReply({
                components: [(await initMsg(true))]
            }).catch((e) => logtail.warn(`Failed to update signup channels list during cmd interaction - See details`, {e, interaction}));
        }
        
        // Create response collector:
        const reply = await interaction.fetchReply();
        const collector = reply.createMessageComponentCollector({
            idle: 120_000,
            filter: (i) => i.user.id == interaction.user.id,
        })

        // On response collection:
        collector.on('collect', async (newInteraction) => {
            const [customId, channelId] = newInteraction.customId.split(':');
            collector.resetTimer({idle: 60_000});

            //+ Util: Send Modal has Timed Out Msg:
            const sendModalTimeout = async () => {
                await newInteraction.followUp({
                    components: [new ContainerBuilder({accent_color: core.colors.getOxColor('error'), components: <any>[
                        new TextDisplayBuilder({content: `**⏰ Uh oh! You ran out of time/failed to submit a question!**`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `-# Don't worry, you can try again by using the </${interaction.commandName}:${interaction.commandId}> command. \n\n-# If you dismissed the question, just ignore this message.`}),
                        new SeparatorBuilder(),
                        defaultFooterText({showHelpLink: true})
                    ]})],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                });
            }

            //+ Util: Send Invalid Modal Field Value Msg:
            const sendInvalidFieldMsg = async (i:ModalSubmitInteraction, title:string, desc:string) => {
                await i.reply({
                    components: [new ContainerBuilder({accent_color: core.colors.getOxColor('error'), components: <any>[
                        new TextDisplayBuilder({content: `**⚠️ ${title}**`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `> ${desc}`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: <any>[
                                new ButtonBuilder({
                                    label: `🔄 Try Again`,
                                    style: ButtonStyle.Link,
                                    url: reply.url
                                })
                            ]
                        }),
                        new SeparatorBuilder(),
                        defaultFooterText({showHelpLink: true})
                    ]})],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                });
            }

            // If editing an existing signup post time - Open Form:
            if(customId == 'EDIT-POST-TIME'){
                const curPostTime = guildData.configuration.signupChannels[channelId].signupPostTime;
                const curValue = DateTime.now().setZone(guildTimeZone).set({hour: curPostTime.hours, minute: curPostTime.minuets, second:0, millisecond:0}).toFormat(`h:mm a`)

                // Build/Show modal:
                const modal = new ModalBuilder({
                    title: `Edit Signup Channel - Post Time`,
                    custom_id: `EDIT-POST-TIME-MODAL:${channelId}`,
                    components: <any>[ 
                        new LabelBuilder({
                            label: 'New Post Time',
                            description: 'Please enter the new daily time you would like sessions to be posted at.',
                            component: {
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Short,
                                custom_id: 'NEW-TIME-INPUT',
                                placeholder: `In 2 hours, 3pm, 3:00pm, 15:00, etc`,
                                value: curValue,
                                required: true
                            }
                        })
                    ]
                });
                await newInteraction.showModal(modal);

                // Await submission:
                newInteraction.awaitModalSubmit({idle: 60_000, time: 0})
                .then(async (i) => { 
                    // Modal Submitted:
                    const inputtedTime = i?.fields.getTextInputValue('NEW-TIME-INPUT');
                    const result = parseHumanTime(inputtedTime, guildTimeZone);
                    
                    if(result){
                        // Valid submission/result:
                        const {hour:hours, minute:minuets} = result.toObject()
                        const formattedSave:time24HRS = {hours, minuets};
                        const discordPostTime = Math.floor(result.toSeconds());

                        // Update db & respond:
                        const save = await guildManager.updateGuildDocField(guildId, `configuration.signupChannels.${channelId}.signupPostTime`, formattedSave);
                        if(!save.success) throw 'Failed to save new time to database! - /signup-channels';
                        
                        // Send Success & Update List:
                        const editInitRsp = updateInitMsg();
                        const respond = i.reply({
                            components: [new ContainerBuilder({accent_color: core.colors.getOxColor('success'), components: <any>[
                                new TextDisplayBuilder({content: `**✅ Success!** \n> You have successfully updated <#${channelId}>'s daily post time to <t:${discordPostTime}:t>.`}),
                                new SeparatorBuilder(),
                                defaultFooterText()
                            ]})],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                        });
                        const msgSends = Promise.all([editInitRsp, respond]);
                        return await msgSends;

                    }else{
                        // Invalid submission/result:
                        await sendInvalidFieldMsg(
                            i, 
                            `Uh oh! Seems like you entered an invalid time..`, 
                            `Make sure you enter a full time string such as: \n- \`9 AM\` \n- \`3 in the afternoon\` \n- \`Midnight\` \n*(these are just some examples)*`
                        );
                    }
                    
                })
                .catch(async () => { // Modal submission/await error:
                    await sendModalTimeout();
                })
         
            }


            // If editing an existing signup channel - Open Form:
            if(customId == 'EDIT-POST-CHANNEL'){

                // Build modal:
                const modal = new ModalBuilder({
                    title: `Edit - Signup Channel`,
                    custom_id: `EDIT-POST-CHANNEL-MODAL:${channelId}`,
                    components: <any>[ 
                        new LabelBuilder({
                            label: 'Select Channel',
                            description: 'Please select the text channel where you would like new sessions to be posted within.',
                            component: {
                                type: ComponentType.ChannelSelect,
                                custom_id: `NEW-CHANNEL-INPUT`,
                                channel_types: [ChannelType.GuildText],
                                max_values: 1, min_values: 1,
                                default_values: [{type: SelectMenuDefaultValueType.Channel, id: channelId}],
                                required: true
                            }
                        })
                    ]
                })
                
                // Show modal:
                await newInteraction.showModal(modal);

                // Await submission:
                newInteraction.awaitModalSubmit({idle: 60_000, time: 0})
                .then(async (i) => { // Modal Submitted:
                    const selectedChannels = i?.fields.getSelectedChannels('NEW-CHANNEL-INPUT').map((cn) => cn.id);
                    
                    if(selectedChannels[0]){ 
                        // Valid submission:
                        await db.collection('guilds').doc(guildId).update({
                            [`configuration.signupChannels.${channelId}`]: FieldValue.delete(),
                            [`configuration.signupChannels.${selectedChannels[0]}`]: guildData.configuration.signupChannels[channelId],
                        })
                        const editInitRsp = updateInitMsg();
                        const respond = i.reply({
                            components: [new ContainerBuilder({accent_color: core.colors.getOxColor('success'), components: <any>[
                                new TextDisplayBuilder({content: `**✅ Success!** \n> You have successfully replaced <#${channelId}> with <#${selectedChannels[0]}> as a Signup Channel.`}),
                                new SeparatorBuilder(),
                                defaultFooterText()
                            ]})],
                            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                        });
                        return await Promise.all([editInitRsp, respond])
                    }else{
                        // Invalid submission/result:
                        await sendInvalidFieldMsg(
                            i, 
                            `Uh oh! Seems like you entered an invalid channel..`, 
                            `Make sure you select a valid Text Channel for sessions to be posted within.`
                        );
                    }
                    
                })
                .catch(async (e) => { // Modal submission/await error:
                    await sendModalTimeout();
                })
         
            }

            // If creating/adding new signup channel - Open Form:
            if(customId == 'ADD-SIGNUP-CHANNEL'){
                // Build/show modal form:
                const modal = new ModalBuilder({
                    title: `📄 New - Signup Channel`,
                    custom_id: 'ADD-SIGNUP-CHANNEL-MODAL',
                    components: <any>[
                        new LabelBuilder({
                            label: 'Text Channel',
                            description: `Select a text channel where you want Sessions Bot to post new sessions.`,
                            component: {
                                type: ComponentType.ChannelSelect,
                                custom_id: 'NEW-SIGNUP-CHANNEL-ID',
                                channel_types: [ChannelType.GuildText],
                                min_values: 1, max_values: 1,
                                required: true,
                                placeholder: 'Designate a channel for session signups..'
                            }
                        }),
                        new LabelBuilder({
                            label: 'Post Time',
                            description: `Enter the daily time scheduled sessions are posted/released to this channel.`,
                            component: {
                                type: ComponentType.TextInput,
                                style: TextInputStyle.Short,
                                min_length: 2, max_length: 25,
                                custom_id: 'NEW-SIGNUP-CHANNEL-TIME',
                                required: true,
                                placeholder: 'Ex: 9:00 AM, 7pm, midnight, 14:30',

                            }
                        })
                    ]
                })
                await newInteraction.showModal(modal);

                // Await modal/form submission:
                newInteraction.awaitModalSubmit({idle: 60_000, time: 0})
                .then(async (i) => { // Modal Submitted:
                    // Get Inputs / Pricing Plan Check:
                    const unparsedTime = i.fields.getTextInputValue('NEW-SIGNUP-CHANNEL-TIME');
                    const parsedTime = parseHumanTime(unparsedTime, guildTimeZone);
                    if(!parsedTime) // Invalid time provided - start over
                        return await sendInvalidFieldMsg(i, `Uh oh! Seems like you entered an invalid post time..`, `Make sure you enter a full time string such as: \n- \`9 AM\` \n- \`3 in the afternoon\` \n- \`Midnight\` \n*(these are just some examples)*`);
                    const {hour:hours, minute:minuets} = parsedTime.toObject()
                    const newChannel = i.fields.getSelectedChannels('NEW-SIGNUP-CHANNEL-ID').map((cn) => cn)[0];
                    if(!newChannel.id) // Invalid time provided - start over
                        return await sendInvalidFieldMsg(i, `Uh oh! Seems like you entered an invalid Text Channel..`, `Make sure you select a valid *Text Channel* for your sessions to be posted within.`);
                    const allowedMoreSignupChannels = !(signupChannels().length >= pricingLimits.FREE_PLAN.MAX_SIGNUP_CHANNELS)
                    if(!allowedMoreSignupChannels) return i.reply({flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, components: <any>[
                        new ContainerBuilder({accent_color: core.colors.getOxColor('error'), components: <any>[
                            new TextDisplayBuilder({content: `**😦 Uh Oh, You've reached your maximum Signup Channels!** \n> Unfortunately with your current [pricing plan](${core.urls.pricing}) you have reached the maximum amount of Signup Channels you can configure.. \n\n-# Consider upgrading today to support the Sessions Bot Team. ♥`}),
                            new SeparatorBuilder(),
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({
                                        style: ButtonStyle.Link,
                                        label: '💳 Pricing Plans',
                                        url: core.urls.pricing
                                    })
                                ]
                            }),
                            new SeparatorBuilder(),
                            defaultFooterText({showHelpLink:true})
                        ]})
                    ]});

                    // Save new signup channel to db:
                    await db.collection('guilds').doc(guildId).update({
                        [`configuration.signupChannels.${newChannel.id}`]: <ValueOf<GuildSignupChannels>>{
                            name: newChannel.name,
                            signupPostTime: {hours, minuets},
                            topMessageId: null
                        }
                    })

                    // Send success/update list:
                    const editInitRsp = updateInitMsg();
                    const respond = i.reply({
                        components: [new ContainerBuilder({accent_color: core.colors.getOxColor('success'), components: <any>[
                            new TextDisplayBuilder({content: `**✅ Success!** \n> You have successfully added <#${newChannel.id}> @ <t:${Math.floor(parsedTime.toSeconds())}:t> as a Signup Channel.`}),
                            new SeparatorBuilder(),
                            defaultFooterText()
                        ]})],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                    });
                    return await Promise.all([editInitRsp, respond])

                })
                .catch(async (e) => { // Modal Failed/Idled:
                    await sendModalTimeout();
                })
            }

            
            // If deleting an existing Signup Channel:
            if(customId == 'DELETE-SIGNUP-CHANNEL'){
                // Send confirmation msg:
                newInteraction.reply({
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                    components: <any>[
                        new ContainerBuilder({
                            accent_color: core.colors.getOxColor('error'),
                            components: <any>[
                                new TextDisplayBuilder({content: `**☑️ Please Confirm - Remove this Signup Channel** \n-# **INFO:** This will **NOT** delete the actual Discord channel, just removes it from signup channel configuration.`}),
                                new SeparatorBuilder(),
                                new ActionRowBuilder({
                                    components: <any>[
                                        new ButtonBuilder({
                                            label: '⬅ Cancel',
                                            custom_id: `CN-DELETE-CHANNEL:${channelId}`,
                                            style: ButtonStyle.Secondary
                                        }),
                                        new ButtonBuilder({
                                            label: '🗑️ Confirm',
                                            custom_id: `CF-DELETE-CHANNEL:${channelId}`,
                                            style: ButtonStyle.Danger
                                        })
                                    ]
                                }),
                                new SeparatorBuilder()
                            ]
                        })
                    ]
                })

                // Await response/confirmation:
                const reply = await newInteraction.fetchReply();
                const confirmCollector = reply.createMessageComponentCollector({
                    idle: 60_000, 
                    filter:(i)=> i.message.id == reply.id && i.user.id == reply.interactionMetadata.user.id, 
                    componentType: ComponentType.Button,
                    max: 1,
                })
                
                // On confirmation response:
                confirmCollector.on('collect', async (i) => {
                    await i.deferReply();
                    const [customId, targetChId] = i.customId.split(':');

                    if(customId == 'CF-DELETE-CHANNEL'){ 
                        // Confirmed - delete
                        await db.collection('guilds').doc(guildId).update({
                            [`configuration.signupChannels.${targetChId}`]: FieldValue.delete()
                        });
                        // Delete Confirm Prompt:
                        const delConfirm = newInteraction.deleteReply().catch((e)=>{});
                        const delIntRsp = i.deleteReply().catch((e)=>{});
                        const updateList = updateInitMsg();
                        return await Promise.all([delConfirm, delIntRsp, updateList]);
                        
                    }else if(customId == 'CN-DELETE-CHANNEL'){
                        // Canceled - delete msgs:
                        const delConfirm = newInteraction.deleteReply().catch((e)=>{});
                        const delIntRsp = i.deleteReply().catch((e)=>{});
                        confirmCollector.stop('canceled');
                        return Promise.all([delConfirm, delIntRsp])
                    }
                })

                // On confirmation timeout:
                confirmCollector.on('end', async (i, r) => {
                    newInteraction.deleteReply().catch((e) => {})
                })
            }


        })
        
        collector.on('end', async (c, r) => {
            // Update/Disable Message:
            await interaction.editReply({
                components: <any>[
                    new ContainerBuilder({
                        accent_color: core.colors.getOxColor('error'),
                        components: <any>[
                            new TextDisplayBuilder({content: `### ⏰ Message Timed Out! \n> You took a little too long to respond... To try again just use reuse the </${interaction.commandName}:${interaction.commandId}> command.`}),
                            new SeparatorBuilder(),
                            defaultFooterText()
                            
                        ]
                    })
                ]
            }).catch((e) => {return});
        })


    }
}