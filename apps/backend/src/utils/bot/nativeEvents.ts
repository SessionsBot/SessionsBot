import { FullSessionData } from "@sessionsbot/shared";
import { DateTime } from "luxon";
import core from "../core/core";
import { URLS } from "../core/urls";
import { DiscordAPIError, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from "discord.js";
import { isBotPermissionError, sendPermissionAlert } from "./permissions/permissionsDenied";
import { getEventImage } from "./messages/images/eventImages";
import { useLogger } from "../logs/logtail";


// Logger Util:
const createLog = useLogger();

export async function createNativeEventForSession(opts: {
    /** The **Full Session Data** of this session to create a __Discord Event__ for. */
    session: FullSessionData,
    /** The **EXACT start date** of this session in UTC time zone */
    startDate: DateTime,
    /** The panel msg URL to connect to the event. */
    panelMsgUrl: string,
    /** Weather to show the SessionsBot watermark or not. */
    showWatermark: boolean,
}) {
    try {
        // Vars:
        const t = opts.session
        const sessionStart = opts.startDate
        // Fetch Guild:
        const guild = await core.botClient.guilds.fetch(t?.guild_id)
        if (!guild) throw `Failed to fetch guild for native event creation! - ${guild}`

        // Get Event Safe Dates:
        const baseStart = sessionStart > DateTime.utc()
            ? sessionStart
            : DateTime.utc().plus({ hour: 1 }).startOf("hour");
        const eventStart = baseStart
            .setZone(t.time_zone)
            .toJSDate();
        const eventEnd = t.duration_ms
            ? baseStart
                .plus({ milliseconds: t.duration_ms })
                .setZone(t.time_zone)
                .toJSDate()
            : baseStart
                .plus({ hour: 1 })
                .setZone(t.time_zone)
                .toJSDate();
        const eventDescription = () => {
            const raw = t?.description?.trim();
            const hasContent = raw && raw.length > 1;
            const showWatermark = opts.showWatermark
            const watermark = `${core.emojis.string('logo')} Powered by Sessions Bot | [Learn More](${URLS.website})`;
            if (!hasContent && !showWatermark) return null;
            if (!hasContent && showWatermark) return watermark;
            if (hasContent && !showWatermark) return raw;
            return `${raw}\n${watermark}`;
        }

        // Create Event Cover Image:
        const startInSZone = sessionStart?.setZone(t?.time_zone)
        const coverImg = await getEventImage({
            title: t?.title,
            botIconUrl: `https://sessionsbot.fyi/logo.png`,
            timeText: startInSZone.toFormat(`D - t '${startInSZone?.offsetNameShort || ''}'`),
            guildIconUrl: guild?.iconURL() ?? `https://sessionsbot.fyi/discord-grey.png`,
            showWatermark: opts.showWatermark
        })

        // Create Discord Native Event:
        const nativeEvent = await guild.scheduledEvents.create({
            name: t.title,
            description: eventDescription(),
            scheduledStartTime: eventStart,
            scheduledEndTime: eventEnd,
            entityType: GuildScheduledEventEntityType.External,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityMetadata: { location: t?.url ? t.url : opts.panelMsgUrl },
            image: coverImg ?? guild?.iconURL()
        })

        return class SuccessResult {
            static success: true = true
            static event: typeof nativeEvent = nativeEvent
        }
    } catch (err) {
        const guildId = opts?.session?.guild_id
        const sessionData = opts.session
        // Native Discord Event Creation - FAILED:
        if (err instanceof DiscordAPIError && err.code == 30038) {
            // Max Discord Events (100) - Reached:
            createLog.for('Bot').info('Failed to create a NATIVE DISCORD EVENT for a session - Max of 100 Reached!', { guildId, session: sessionData, error: err })
        }
        if (isBotPermissionError(err) && guildId) {
            // Bot Permission Failure:
            createLog.for('Bot').info('Failed to create a NATIVE DISCORD EVENT for a session - Perms Missing!', { guildId, session: sessionData, error: err })
            sendPermissionAlert(guildId, { leadingDesc: 'Failed to post a Discord Native Event tied to a session schedule! This error was due to bot permissions...' })
        } else {
            // Unknown Error:
            createLog.for('Unknown').error('Failed to create a NATIVE DISCORD EVENT for a session! - SEE DETAILS', { guildId, session: sessionData, error: err })
        }

        // Return Failure:
        return class ErrorResult {
            static success: false = false
            static err = err
        }
    }
}