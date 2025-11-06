import { ButtonInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";
import core, { get0xColor, urls } from "../utils/core.js";


export default {
    // Button Definition:
    data: {
        customId: 'DELETE-THREAD-LOCAL',
    },
    // Button Execution:
    execute: async (interaction:ButtonInteraction) => {
        
        const intChannel = interaction.channel;
        const isThread = intChannel.isThread();
        const isDeletable = intChannel.permissionsFor(core.botClient.user).has('ManageThreads');

        const successMsg = () => new ContainerBuilder({
            accent_color: get0xColor('success'),
            components: <any>[
                new TextDisplayBuilder({content:`**This thread will be deleted in 30 seconds!** \n-# Thanks for using [Sessions Bot](${urls.mainSite})!`})
            ]
        })
        const failedMsg = (reason:string) => new ContainerBuilder({
            accent_color: get0xColor('error'),
            components: <any>[
                new TextDisplayBuilder({content:`**Failed to schedule this thread for deletion!**\n-# Details:\n> ${reason}`})
            ]
        })

        if(isThread && isDeletable){

            setTimeout(async () => {
                await intChannel.delete().catch(()=>{})
            }, 30_000);

            await interaction.message.delete().catch(()=>{});
            
            await interaction.reply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [successMsg()]
            }).catch(()=>{})
        } else {
            await interaction.reply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [failedMsg(`It doesn't seem like I have the ability to delete this thread! Please manually delete this thread if you can..`)]
            }).catch(()=>{})
        }
    }
}