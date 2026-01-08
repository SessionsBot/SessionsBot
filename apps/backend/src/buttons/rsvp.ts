import { ButtonInteraction } from "discord.js";

export default {
    data: {
        customId: 'rsvp'
    },
    execute: async (i: ButtonInteraction) => {
        console.info('Button interaction received!')
        await i.reply('Interaction received!')
    }
}