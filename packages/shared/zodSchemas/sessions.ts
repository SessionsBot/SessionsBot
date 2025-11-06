import z, { string, stringFormat } from "zod";
import {GuildSessionData, rsvpSchema} from '@sessionsbot/shared'

export const sessionSchema = z.object({
    title: z.string('Please provide a valid title.')
        .trim()
        .min(1, 'Title must be at least 1 character.')
        .max(30, 'Title cannot exceed 30 characters.')
        .regex(
            /^[a-zA-Z0-9]/gm,
            "Title can only include letters (a-Z) and numbers (0-9)."
        ),
    description: z.string('Please provide a valid description.')
        .trim()
        .min(5, 'Description must be at least 5 character.')
        .max(150, 'Description cannot exceed 150 characters.')
        .regex(
            /^[a-zA-Z0-9]/gm,
            "Description can only include letters (a-Z) and numbers (0-9)."
        ),
    url: z.url('Please enter a valid location URL (e.g. "https://google.com").')
        .trim()
        .startsWith('https://', 'The url must start with "https://".'),
    rsvps: z.object(rsvpSchema).optional(),
    signup: z.object({
        channelId: z.string().optional(),
        threadId: z.string().optional(),
        messageId: z.string().optional(),
    }).optional(),
    startsAt: z.object({
        hours: z.preprocess(
            (val) => (typeof val === "string" ? Number(val) : val),
            z.number().max(24, 'Cannot exceed 24 hours.'),
        ),
        minuets: z.preprocess(
            (val) => (typeof val === "string" ? Number(val) : val),
            z.number().max(60, 'Cannot exceed 60 minuets.'),
        ),
        discordTimestamp: z.string(),
    }).optional(),
    createdAt: z.date().optional(),
    state: z.enum(["scheduled", "postponed", "canceled"], 'Please provide a valid session state.')
})