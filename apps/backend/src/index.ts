// ------- [ Variables/Setup: ] -------
import 'dotenv/config'
import dotenv from "dotenv";
import fs from "fs";
import path from "node:path";
import { ENVIRONMENT_TYPE } from './utils/environment.js';
import { fileURLToPath, pathToFileURL } from "node:url";
import { Collection } from "discord.js";
import { ExtendedClient } from './utils/types/extendedClient.js';
import { initTemplateCreationScheduler } from './utils/database/schedules/templatesSchedule.js';
import ready from './events/ready.js';

const client = new ExtendedClient({
	intents: ['Guilds', 'GuildMessages', 'DirectMessages']
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- [ File Loader Utility: ] ---
function getAllFiles(dir: string, fileList = []) {
	if (!fs.existsSync(dir)) return fileList;

	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, fileList); // Recurse into subfolder
		} else if (file.endsWith('.js') || file.endsWith('.ts')) {
			fileList.push(filePath);
		}
	}
	return fileList;
}


// + Initialize Commands:
client.commands = new Collection();
const commandFiles = getAllFiles(path.join(__dirname, 'commands'));
for (const filePath of commandFiles) {
	if (ENVIRONMENT_TYPE == 'api_only') break;
	const { default: command } = await import(pathToFileURL(filePath).href);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


// + Initialize Buttons:
client.buttons = new Collection();
const buttonFiles = getAllFiles(path.join(__dirname, 'buttons'));
for (const filePath of buttonFiles) {
	if (ENVIRONMENT_TYPE == 'api_only') break;
	const { default: button } = await import(pathToFileURL(filePath).href);
	if ('data' in button && 'execute' in button) {
		client.buttons.set(button.data.customId, button);
	} else {
		console.log(`[WARNING] The button at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


// + Initialize Events
const eventFiles = getAllFiles(path.join(__dirname, 'events'));
for (const filePath of eventFiles) {
	if (ENVIRONMENT_TYPE == 'api_only') {
		client.once('clientReady', async (c) => {
			await ready.execute(c as any);
			// Initialize Template Creations - in API_ONLY Environments:
			await initTemplateCreationScheduler()
		})
		break;
	};
	const { default: event } = await import(pathToFileURL(filePath).href);
	if (event?.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


// - DEBUG - File Loader Utility:
const debugFileLoader = false;
if (debugFileLoader) {
	console.log(`[✅] Loaded ${client.commands.size} command(s).`);
	console.log(`[✅] Loaded ${client.buttons.size} button(s).`);
	console.log(`[✅] Loaded ${eventFiles.length} event file(s).`);
}


// ------- [ Login (via Token): ] -------

if (ENVIRONMENT_TYPE == 'production') {
	client.login(process.env['DISCORD_BOT_TOKEN']);
} else {
	client.login(process.env['DEV_BOT_TOKEN']);
}


// ------- [ Web Server (api): ] -------
import './server/index.js';


