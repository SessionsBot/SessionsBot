import { Events, ActivityType, Client, EventData } from "discord.js";
import core from "../utils/core/core.js";
import { useLogger } from "../utils/logs/logtail.js";
import tests from "../utils/tests.js";
import fetchEmojis from "../utils/bot/fetchEmojis.js";
import fetchSKUs from "../utils/bot/fetchSKUs.js";
import fetchCommands from "../utils/bot/fetchCommands.js";
import { initializeDataDeletionSchedule } from "../utils/schedules/automaticDeletions.js";
import { DateTime } from "luxon";
import { initializeTemplateCreationScheduler } from "../utils/schedules/templateCreations.js";
import { initializeEntitlementsSyncSchedule } from "../utils/schedules/syncEntitlements.js";

const createLog = useLogger();

export default <EventData>{
	name: "clientReady",
	once: true,
	async execute(client: Client) {
		// Assign Fresh Client to Global Variables:
		core.botClient = client;

		// Fetch App Emojis to 'core':
		fetchEmojis();
		// Fetch Guild Subscription SKUs to 'core':
		fetchSKUs();
		// Fetch App Commands to 'core':
		fetchCommands();

		// Log Startup:
		createLog.for('Bot').info('[✅] Startup', { clientTag: client?.user?.tag });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System(s):
		setTimeout(async () => {
			// Run Dev Tests (if dev env):
			await tests.init();
			// Initialize Auto-Session/Schedule Creation(s) Schedule:
			await initializeTemplateCreationScheduler()
			// Initialize Auto-Deletion Schedule:
			initializeDataDeletionSchedule()
			// Initialize Auto Entitlement(s) Database Synchronization:
			initializeEntitlementsSyncSchedule()
		}, 1_500);

	},
};
