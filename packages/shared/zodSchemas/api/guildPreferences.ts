import * as z from "zod";

export const API_GuildPreferencesDefaults = <Record<API_GuildPreferencesFields, any>>{
    accent_color: '#e7e77f',
    thread_message_title: "### 📅 Sessions for %day_sm%",
    thread_message_description: "-# You can view today's scheduled events/sessions by opening the __attached thread below__. 😊"
}

/** Guild/Server Preferences API Data Schema */
export const API_GuildPreferencesSchema = z.object({
    accent_color: z.string('Invalid - String Required').regex(/^#{1}[a-f0-9]{6}$/g, 'Invalid Hex Color!'),
    public_sessions: z.boolean(),
    calendar_button: z.boolean(),
    thread_message_title: z.string().startsWith('### ', 'Must start with "### "!').max(49, 'Cannot exceed 49 characters in total!').normalize().or(z.literal('DEFAULT')),
    thread_message_description: z.string().max(225, 'Cannot exceed 225 characters in total!').normalize().or(z.literal('DEFAULT'))
})

export type API_GuildPreferencesInterface = z.infer<typeof API_GuildPreferencesSchema>
export type API_GuildPreferencesFields = keyof API_GuildPreferencesInterface