import { AutocompleteInteraction, ChatInputCommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, TextDisplayBuilder } from "discord.js";
import { AUTOCOMPLETE_TIMEZONES } from "../../utils/dates/timezones.js";
import { DateTime } from "luxon";
import core from "../../utils/core.js";
import { defaultFooterText, genericErrorMsg, invalidInputMsg } from "../../utils/bot/messageBuilders/basic.js";
import logtail from "../../utils/logs/logtail.js";
import { db } from "../../utils/database/firebase.js";

const timeZoneOptions = AUTOCOMPLETE_TIMEZONES;

class setTimezoneCooldown {
    private currentCooldowns = new Map<string, DateTime>()
    public waitMinuets = 0.5
    public add(guildId:string){
        const end = DateTime.now().plus({minute: this.waitMinuets})
        this.currentCooldowns.set(guildId, end)
    }
    public allowed(guildId:string){
        const cooldownEnd = this.currentCooldowns.get(guildId)
        if(!cooldownEnd) return true;
        const isAllowed = (cooldownEnd.diffNow('seconds').seconds.valueOf() <= 0)
        
        return isAllowed;
    }
    public remaining(guildId:string){
        const cooldownEnd = this.currentCooldowns.get(guildId)
        return cooldownEnd ? cooldownEnd.toRelative({unit: ["minutes", "seconds"], style: "short"}) : "No Cooldown!";
    }
}
const cooldown = new setTimezoneCooldown();

export default {

    // Command Definition:
    data: new SlashCommandBuilder()
        .setName(`time-zone`)
        .setDescription(`Adjust your servers preferred time zone.`)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild || PermissionFlagsBits.Administrator)
        .addStringOption(new SlashCommandStringOption()
            .setAutocomplete(true)
            .setRequired(true)
            .setDescription('The timezone to be used within your server, for date related things.')
            .setName('time-zone')
        )
    ,

    // Input Autocomplete
    autocomplete: async (interaction:AutocompleteInteraction) => {
        const focusedValue = interaction.options.getFocused(true);
        const {name, value} = focusedValue;
        
        if(name == 'time-zone'){
            const filtered = timeZoneOptions
                .filter(tz => tz.name.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 25);
            await interaction.respond(filtered);
        }
    },

    // Command Execution:
    execute: async (interaction:ChatInputCommandInteraction) => { try {
        // Check Cooldown:
        if(!cooldown.allowed(interaction.guildId)){
            return await interaction.reply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [genericErrorMsg({title: '⏰ Sorry! You have to wait...', reasonDesc: `Unfortunately to prevent abuse, you have to wait at least ${cooldown.waitMinuets} mins before switching your server's time zone again... \n-# **TIME REMAINING:** *${cooldown.remaining(interaction.guildId)}*`})]
            })
        }

        // Confirm Input
        const chosen = interaction.options.get('time-zone').value as string;
        if(!chosen || !Intl.supportedValuesOf('timeZone').includes(chosen)) {
            return await interaction.reply({
                components: [invalidInputMsg({inputTitle: 'Timezone'})],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });
        }
        
        // Save new Timezone in DB:
        await db.collection('guilds').doc(interaction.guildId).update({
            [`configuration.timeZone`]: chosen
        })

        // Respond Success:
        cooldown.add(interaction.guildId);
        const timeZoneOffset = DateTime.now().setZone(chosen).offsetNameLong;
        const UtcSecsInZone = DateTime.now().setZone(chosen).toFormat('h:mm a');
        await interaction.reply({
            components: [new ContainerBuilder({
                accent_color: core.colors.getOxColor('success'),
                components: <any>[
                    new TextDisplayBuilder({content: `### 🌍 - Server Timezone Saved!`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `**Selected:**\n> ${timeZoneOffset} \n**Current Time:** *(in zone)* \n> \`${UtcSecsInZone}\``}),
                    new SeparatorBuilder(),
                    defaultFooterText()
                ]
            })],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });

       
    

    } catch(e) { // Cmd Errored:
        // Log & Respond:
        logtail.warn(`[/] Time zone cmd failed execution - See details..`, {e, interaction})
        throw e; // sends default err
    }},
}