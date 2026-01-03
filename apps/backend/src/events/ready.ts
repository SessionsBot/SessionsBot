import { Events, ActivityType } from "discord.js";
import { ExtendedClient } from "../utils/types/extendedClient.js";
import core from "../utils/core.js";
import { useLogger } from "../utils/logs/logtail.js";
import { DateTime } from "luxon";
import tests from "../utils/tests.js";
import fetchEmojis from "../utils/bot/fetchEmojis.js";

const createLog = useLogger();

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client: ExtendedClient) {
		// Assign Fresh Client to Global Variables:
		core.botClient = client;

		// Fetch App Emojis to 'core':
		fetchEmojis();

		// Get Startup Timestamp:
		const startupTimestamp = DateTime.now().setZone('America/Chicago').toLocaleString(DateTime.DATETIME_SHORT)

		// Log Startup:
		createLog.for('Bot').info('[✅] Startup', { timestamp: startupTimestamp, clientTag: client?.user?.tag, botVersion: core.botVersion });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await tests.init();
			// await scheduleManager.onBotStartup();
		}, 1_500);

	},
};
