import { AppUser, Database } from "@sessionsbot/shared"
import { Client, Collection, CommandData, RestEvents, RestEventsMap, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js"
import { request } from "express"

export { }

declare global {

    // - Express Types:
    namespace Express {

        interface Request {
            // Authorized User Data - Sometimes Provided:
            auth?: {
                user?: Partial<AppUser>,
                profile?: Partial<Database['public']['Tables']['profiles']['Row']>
            }
        }

    }

}



// - Extended Discord.js Types:
declare module "discord.js" {

    interface CommandData {
        /** Command definition data */
        data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
        /** The cooldown *(in secs)* for each use. */
        cooldown?: number
        /** The function to execute for each use. */
        execute: (...args: any[]) => any;
        /** The autocomplete logic to use for this command (if applicable). 
         * @see https://discordjs.guide/legacy/slash-commands/autocomplete for more details.*/
        autocomplete?: (i: AutocompleteInteraction) => Promise<void> | void;
    }
    interface ButtonData {
        /** Button definition data */
        data: {
            customId: string
        };
        /** The cooldown *(in secs)* for each use. */
        cooldown?: number
        /** The function to execute for each use. */
        execute: (i: ButtonInteraction) => any;
    }

    interface EventData {
        /** The `ClientEvent` name to "watch" for */
        name: keyof ClientEvents
        /** Weather or not if this event should only fire once. 
         * @default- false */
        once?: true;
        /** The function to execute on the events occurrence.
         * @see https://discord.js.org/docs/packages/discord.js/14.25.1/Client:Class for param typings */
        execute: (...args: any) => any;
    }

    interface Client {
        commands: Collection<string, CommandData>
        buttons: Collection<string, ButtonData>
    }
}

