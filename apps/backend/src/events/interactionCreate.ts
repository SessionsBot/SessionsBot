import { BaseInteraction, Events, Interaction, MessageFlags } from "discord.js";
import { useLogger } from "../utils/logs/logtail.js"
import { ExtendedClient } from "../utils/types/extendedClient.js";
import { isBotPermissionError, sendPermissionAlert } from "../utils/bot/permissions/permissionsDenied.js";
import { genericErrorMsg } from "../utils/bot/messages/basic.js";
import core from "../utils/core.js";

const createLog = useLogger();

export default {
	name: Events.InteractionCreate,
	async execute(interaction: BaseInteraction) {
		const botClient = interaction.client as ExtendedClient;

		// Command Interactions:
		if (interaction.isChatInputCommand()) {
			const command = botClient.commands.get(interaction.commandName);

			if (!command) return createLog.for('Bot').error(`No command matching ${interaction.commandName} was found.`)
			try {
				// Execute Command:
				await command.execute(interaction);

			} catch (error) { // On Failure:
				// Check for Bot Permission Error:
				if (isBotPermissionError(error)) sendPermissionAlert(interaction.guildId)
				// Log
				createLog.for('Bot').warn('Command Interaction Error - See Details', { error, interaction });
				// Respond with Alert
				const alertMsg = genericErrorMsg({
					reasonDesc: `The </${interaction?.commandName}:${interaction?.commandId}> command has **FAILED** execution! Confirm inputs *(if any)* and try again!`
				});
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				} else {
					await interaction.reply({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
					// await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}


		// Button Interactions:
		if (interaction.isButton()) {

			// Confirm static button:
			const [buttonId] = interaction.customId.split(':');
			const button = botClient.buttons.get(buttonId);
			if (!button) return;

			try {
				// Execute button:
				await button.execute(interaction);

			} catch (error) { // On failure: 
				// Check for Bot Permission Error:
				if (isBotPermissionError(error)) sendPermissionAlert(interaction.guildId)
				// Log
				createLog.for('Bot').warn('Button Interaction Error - See Details', { error, interaction });
				// Respond with Alert:
				const alertMsg = genericErrorMsg({
					reasonDesc: `This button has **FAILED** execution! This likely shouldn't be happening check our [status page](${core.urls.statusPage}) or contact support!`
				});
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				} else {
					await interaction.reply({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
				}
			}
		}


		// Autocomplete Interactions:
		if (interaction.isAutocomplete()) {
			const command = botClient.commands.get(interaction.commandName);
			if (!command) {
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				// Check for Bot Permission Error:
				// if(isBotPermissionError(error)) sendPermissionAlert(interaction.guildId)
				createLog.for('Bot').warn('Auto-complete Interaction Error - See Details', { error, interaction });
			}
		}


	},
};