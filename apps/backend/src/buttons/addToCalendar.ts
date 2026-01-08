import { ButtonInteraction } from "discord.js";
import { supabase } from "../utils/database/supabase";

export default {
    data: {
        customId: 'ADD_TO_CAL'
    },
    execute: async (i: ButtonInteraction) => {
        console.info('Button interaction received!')
        const originGuildId = i.guildId;
        const originChannelId = i.message.channel.id;
        const originSignupMsg = i.message.id;
        // const session = await supabase.from('sessions')
        //     .select('*')
        //     .eq('guild_id', originGuildId)
        //     .eq('channel_id', originChannelId)
        //     .eq('signup_id', originSignupMsg)
        //     .maybeSingle()
        await i.reply('Interaction received! - Add to calendar!')
    }
}