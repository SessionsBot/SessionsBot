import { BaseInteraction, Events, MessageFlags } from "discord.js";
import { useLogger } from "../utils/logs/logtail.js"
import { ExtendedClient } from "../utils/types/extendedClient.js";
import { isBotPermissionError, sendPermissionAlert } from "../utils/bot/permissions/permissionsDenied.js";
import { genericErrorMsg } from "../utils/bot/messages/basic.js";
import { URLS } from "../utils/core/urls.js";

const createLog = useLogger();

export default {
	name: Events.InteractionCreate,
	async execute(i: BaseInteraction) {
		const botClient = i.client as ExtendedClient;

		// Command Interactions:
		if (i.isChatInputCommand()) {
			const command = botClient.commands.get(i.commandName);

			if (!command) return createLog.for('Bot').error(`No command matching ${i.commandName} was found.`)
			try {
				// Execute Command:
				await command.execute(i);

			} catch (error) {
				// On Failure:
				if (isBotPermissionError(error)) sendPermissionAlert(i.guildId)
				// Log:
				createLog.for('Bot').warn('Command Interaction Error - See Details', {
					error, interaction: {
						command: {
							cmdName: i?.commandName,
							cmdId: i?.commandId,
						},
						guild: {
							guildId: i?.guildId,
							guildName: i?.guild?.name,
						},
						user: {
							username: i.user.username,
							userId: i.user.id
						}
					}
				});
				// Respond with Alert:
				let reason = [
					`The </${i?.commandName}:${i?.commandId}> command has **FAILED** execution! Confirm inputs *(if any)* and try again!`,
					`> If this issue persists feel free to contact Bot Support!`,
					`**Support Data**: \`\`\`Guild Id: ${i.guildId} \nCommand Name: ${i.commandName} \nCommand Id: ${i.commandId}\`\`\``,
					`-# Please provide the above text to a Support Agent if assistance is required.`
				].join(`\n`);
				const alertMsg = genericErrorMsg({
					reasonDesc: reason
				});
				if (i.replied || i.deferred) {
					await i.followUp({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				} else {
					await i.reply({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				}
			}
		}


		// Button Interactions:
		if (i.isButton()) {

			// Confirm static button:
			const [buttonId] = i.customId.split(':');
			const button = botClient.buttons.get(buttonId);
			if (!button) return createLog.for('Bot').error(`No button matching custom_id: ${i?.customId} was found.`)

			try {
				// Execute button:
				await button.execute(i);

			} catch (error) {
				// On failure: 
				if (isBotPermissionError(error)) sendPermissionAlert(i.guildId)
				// Log:
				createLog.for('Bot').warn('Button Interaction Error - See Details', {
					error, interaction: {
						buttonId: i?.customId,
						guild: {
							guildId: i?.guildId,
							guildName: i?.guild?.name,
						},
						message: {
							channelId: i?.channelId,
							messageId: i?.message?.id
						},
						user: {
							username: i.user.username,
							userId: i.user.id
						},
					}
				});
				// Respond with Alert:
				let reason = [
					`This button has **FAILED** execution! This likely shouldn't be happening check our [status page](${URLS.status_page}) or contact Bot Support!`,
					`**Support Data**: \`\`\`Guild Id: ${i.guildId} \nButton Id: ${i.customId}\`\`\``,
					`-# Please provide the above text to a Support Agent if assistance is required.`
				].join(`\n`);
				const alertMsg = genericErrorMsg({ reasonDesc: reason });
				if (i.replied || i.deferred) {
					await i.followUp({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				} else {
					await i.reply({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				}
			}
		}


		// Autocomplete Interactions:
		if (i.isAutocomplete()) {
			const command = botClient.commands.get(i.commandName);
			if (!command) {
				return console.warn(`[!] Couldn't find ${i.commandName} for an Auto Complete Interaction!`);
			}

			try {
				await command.autocomplete(i);
			} catch (error) {
				// Check for Bot Permission Error:
				if (isBotPermissionError(error)) sendPermissionAlert(i.guildId)
				// Log:
				console.warn('Auto Complete Interaction Error - See Details', {
					error, interaction: {
						command: {
							cmdName: i?.commandName,
							cmdId: i?.commandId
						},
						guild: {
							guildId: i?.guildId,
							guildName: i?.guild?.name,
						},
						user: {
							username: i.user.username,
							userId: i.user.id
						},
					}
				});
			}
		}

	},
};