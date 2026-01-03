import type { Database } from "@sessionsbot/shared";
import * as z from "zod";

/** **API/Database Validation Schema** - Sessions Templates Table Row */
type fields = keyof Database['public']['Tables']['session_templates']['Row'];
export const API_SessionTemplateBodySchema = z.object(<Record<fields, any>>{
    guild_id: z.string(),
    id: z.nullish(z.string()),
    title: z.string(),
    description: z.nullish(z.string()),
    url: z.nullish(z.url()),
    starts_at_utc: z.string(),
    duration_ms: z.nullish(z.number()),
    time_zone: z.string(),
    rsvps: z.nullish(z.json()),
    rrule: z.nullish(z.string()),
    channel_id: z.string(),
    post_before_ms: z.number(),
    post_in_thread: z.boolean(),
    native_events: z.boolean(),
    last_post_utc: z.nullish(z.string()),
    next_post_utc: z.string(),
    expires_at_utc: z.nullish(z.string()),
})
/** **API/Database Data Interface** - Sessions Templates Table Row */
export type API_SessionTemplateBodyInterface = z.infer<typeof API_SessionTemplateBodySchema>;