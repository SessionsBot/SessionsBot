import { Interaction, ButtonInteraction, Collection, CommandInteraction, EventData, Events, MessageFlags } from "discord.js";
import { useLogger } from "../utils/logs/logtail.js"
import { isBotPermissionError, sendPermissionAlert } from "../utils/bot/permissions/permissionsDenied.js";
import { cooldownAlertMsg, genericErrorMsg } from "../utils/bot/messages/basic.js";
import { URLS } from "../utils/core/urls.js";

const createLog = useLogger();

// Cooldown(s):
/** Current Command Cooldowns -- Mapped by: `command name` -> `user id` -> `UTC Secs` (end cooldown time) */
const commandCooldowns = new Collection<string, Collection<string, number>>()
/** Current Button Cooldowns -- Mapped by: `custom id` -> `user id` -> `UTC Secs` (end cooldown time) */
const buttonCooldowns = new Collection<string, Collection<string, number>>()
/** Util: Process a interaction that has a cooldown *active* */
const processCooldownInteraction = async (i: CommandInteraction | ButtonInteraction, type: "Button" | "Command", remainingSecs: number) => {
	if (i.replied || i.deferred) {
		await i.followUp({
			components: [cooldownAlertMsg(type, remainingSecs)],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
		})
	} else {
		await i.reply({
			components: [cooldownAlertMsg(type, remainingSecs)],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
		})
	}
}


// Default Error Alert(s):
/** Util: Sends a response to the interaction with generic error/support information. */
const processDefaultInteractionError = async (i: CommandInteraction | ButtonInteraction) => {
	// Get Reason Description:
	let reason = `> **This interaction has failed!** If this error persists, please get in contact with [Bot Support](${URLS.support_chat})!`
	if (i?.isCommand()) {
		// Command Error:
		reason = [
			`The </${i?.commandName}:${i?.commandId}> command has **FAILED** execution! Confirm inputs *(if any)* and try again!`,
			`> If this issue persists feel free to contact Bot Support!`,
			`**Support Data**: \`\`\`Guild Id: ${i.guildId} \nCommand Name: ${i.commandName} \nCommand Id: ${i.commandId}\`\`\``,
			`-# Please provide the above text to a Support Agent if assistance is required.`
		].join(`\n`);
	}
	if (i?.isButton()) {
		// Button Error:
		reason = [
			`This button has **FAILED** execution! This likely shouldn't be happening check our [status page](${URLS.status_page}) or contact Bot Support!`,
			`**Support Data**: \`\`\`Guild Id: ${i.guildId} \nButton Id: ${i.customId}\`\`\``,
			`-# Please provide the above text to a Support Agent if assistance is required.`
		].join(`\n`)
	}
	// Build Alert Msg/Container:
	const alertMsg = genericErrorMsg({
		reasonDesc: reason
	});
	// Respond with Alert:
	if (i?.replied || i?.deferred) {
		await i.followUp({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
	} else {
		await i.reply({ components: [alertMsg], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
	}
}


// Main Interaction Handler:
export default <EventData>{
	name: Events.InteractionCreate,
	async execute(i: Interaction) {
		const botClient = i.client;

		// Disregard Already Handled Interactions:
		if (i?.isRepliable() && (i?.replied || i?.deferred)) return console.info('(i) Skipping already handled interaction from global listener.');

		// Command Interactions:
		if (i.isChatInputCommand()) {
			const command = botClient.commands.get(i.commandName);
			const commandCooldownSecs = command?.cooldown ?? 3

			if (!command) return createLog.for('Bot').error(`No command matching ${i?.commandName} was found.`, { userId: i?.user?.id, guildId: i?.guildId })
			try {
				// Check/Init Cooldown:
				if (!commandCooldowns.get(i?.commandName)) commandCooldowns.set(i?.commandName, new Collection())
				const thisCmdCooldowns = commandCooldowns.get(i?.commandName)
				const curUserCooldown = thisCmdCooldowns?.get(i?.user?.id)
				const nowUtcSecs = Date.now() / 1000
				if (curUserCooldown && (nowUtcSecs < curUserCooldown)) {
					// User on cooldown - Send Alert:
					const remainingSecs = Math.max(1, Math.floor(curUserCooldown - nowUtcSecs))
					return await processCooldownInteraction(i, "Command", remainingSecs)
				} else {
					// Start Cooldown - Execute Command:
					const cooldownEndSecs = nowUtcSecs + commandCooldownSecs
					thisCmdCooldowns?.set(i?.user?.id, cooldownEndSecs)
					// Execute Command:
					await command.execute(i);
				}
			} catch (error) {
				// On Failure:
				const isPermErr = isBotPermissionError(error)
				if (isPermErr) sendPermissionAlert(i.guildId)
				// Log:
				createLog.for(isPermErr ? 'Permissions' : 'Bot').warn('Command Interaction Error - See Details', {
					error,
					userId: i?.user?.id,
					guildId: i?.guildId,
					command: {
						cmdName: i?.commandName,
						cmdId: i?.commandId,
					}
				});
				// Respond with Alert:
				return await processDefaultInteractionError(i)
			}
		}


		// Button Interactions:
		if (i.isButton()) {

			// Confirm static button:
			const [buttonId] = i.customId.split(':');
			const button = botClient.buttons.get(buttonId);
			const buttonCooldownSecs = button?.cooldown ?? 3
			if (!button) return // possibly handled "in file"

			try {
				// Check/Init Cooldown:
				if (!buttonCooldowns.get(buttonId)) buttonCooldowns.set(buttonId, new Collection())
				const thisButtonCooldowns = buttonCooldowns.get(buttonId)
				const curUserCooldown = thisButtonCooldowns?.get(i?.user?.id)
				const nowUtcSecs = Date.now() / 1000
				if (curUserCooldown && (nowUtcSecs < curUserCooldown)) {
					// User on cooldown - Send Alert:
					const remainingSecs = Math.max(1, Math.floor(curUserCooldown - nowUtcSecs))
					return await processCooldownInteraction(i, "Button", remainingSecs)
				} else {
					// Start Cooldown - Execute Command:
					const cooldownEndSecs = nowUtcSecs + buttonCooldownSecs
					thisButtonCooldowns?.set(i?.user?.id, cooldownEndSecs)
					// Execute Command:
					await button.execute(i);
				}

			} catch (error) {
				// On failure: 
				const isPermErr = isBotPermissionError(error)
				if (isPermErr) sendPermissionAlert(i.guildId)
				// Log:
				createLog.for(isPermErr ? 'Permissions' : 'Bot').warn('Button Interaction Error - See Details', {
					error,
					buttonId: i?.customId,
					guildId: i?.guildId,
					userId: i?.user?.id
				});
				// Respond with Alert:
				return await processDefaultInteractionError(i)
			}
		}


		// Autocomplete Interactions:
		if (i.isAutocomplete()) {
			const command = botClient.commands.get(i.commandName);
			if (!command) {
				return createLog.for('Bot').error(`No command matching ${i?.commandName} was found for AUTO COMPLETE interaction.`, { userId: i?.user?.id, guildId: i?.guildId, cmd: { id: i?.commandId, name: i?.commandName } })
			}
			if (!command?.autocomplete) {
				return createLog.for('Bot').error(`No auto complete logic found for cmd ${i?.commandName} interaction!`, { userId: i?.user?.id, guildId: i?.guildId, cmd: { id: i?.commandId, name: i?.commandName } })
			}
			try {
				await command.autocomplete(i);
			} catch (error) {
				// Check for Bot Permission Error:
				const isPermErr = isBotPermissionError(error)
				if (isPermErr) sendPermissionAlert(i.guildId)

				// Force Empty Response:
				if (!i.responded) {
					await i.respond([])
				}
				// Log:
				createLog.for(isPermErr ? 'Permissions' : 'Bot').error(`AUTO COMPLETE Interaction Error - See Details `, { error, userId: i?.user?.id, guildId: i?.guildId, cmd: { id: i?.commandId, name: i?.commandName } })
			}
		}

	}
};