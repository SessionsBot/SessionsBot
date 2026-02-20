import { Events, ActivityType } from "discord.js";
import { ExtendedClient } from "../utils/types/extendedClient.js";
import core from "../utils/core/core.js";
import { useLogger } from "../utils/logs/logtail.js";
import { DateTime } from "luxon";
import tests from "../utils/tests.js";
import fetchEmojis from "../utils/bot/fetchEmojis.js";
import fetchSKUs from "../utils/bot/fetchSKUs.js";
import fetchCommands from "../utils/bot/fetchCommands.js";
import { initializeDataDeletionSchedule } from "../utils/database/schedules/automaticDeletions.js";

const createLog = useLogger();

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client: ExtendedClient) {
		// Assign Fresh Client to Global Variables:
		core.botClient = client;

		// Fetch App Emojis to 'core':
		fetchEmojis();
		// Fetch Guild Subscription SKUs to 'core':
		fetchSKUs();
		// Fetch App Commands to 'core':
		fetchCommands();

		// Log Startup:
		createLog.for('Bot').info('[✅] Startup', { clientTag: client?.user?.tag, botVersion: core.botVersion });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System(s):
		setTimeout(async () => {
			// Run Dev Tests (if dev env):
			await tests.init();
			// Initialize Auto-Deletion Schedule:
			initializeDataDeletionSchedule()
		}, 1_500);

	},
};
