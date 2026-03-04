import { Logtail } from "@logtail/node";
import LogCategories from './categories'
import { ENVIRONMENT_GIT_COMMIT_SHA, ENVIRONMENT_TYPE } from "../environment";
import core from "../core/core";

// Env Variables:
const environment = ENVIRONMENT_TYPE;
const isProduction = (environment == "production");
const sourceToken: string = isProduction ? process.env['LOGTAIL_SOURCE_TOKEN'] : process.env['DEV_LOGTAIL_SOURCE_TOKEN'];
const ingestingHost: string = isProduction ? process.env['LOGTAIL_INGESTING_HOST'] : process.env['DEV_LOGTAIL_INGESTING_HOST'];

// Types:
type categoryName = keyof typeof LogCategories;

/** Option data record(s) to attach to the saved log. */
type LogMeta = {
    /** The **`Discord`** guild id to attach to the log. */
    guildId?: string,
    /** The **`Discord`** user id to attach to the log. */
    userId?: string,
} & {
    [x: string]: any
}

/** Extracts the true "called from" or "source" the log was initiated from. */
function getCaller() {
    const err = new Error();
    const stack = err.stack?.split('\n') ?? [];
    const callerLine = stack[9] || stack[10];
    return callerLine?.trim();
}


/** `Logtail` *(Instance)* - **Send logs to internal cloud log storage!** 📃 */
const logtail = new Logtail(sourceToken || '', {
    endpoint: ingestingHost,
    sendLogsToConsoleOutput: false,
});

// Logtail Middleware - Fixes Context:
logtail.use(async (log) => {
    const enriched = {
        ...log,
        context: {
            ...log.context,
            from: getCaller(),
            environment: ENVIRONMENT_TYPE,
            commit_sha: ENVIRONMENT_GIT_COMMIT_SHA,
            version: `@sessionsbot/bot-v${core.botVersion}`,
            service: "discord-bot",
            runtime: undefined,
            system: undefined
        }
    }

    if (ENVIRONMENT_TYPE != 'production') {
        // Log to console in development environments:
        console.info(enriched)
    }

    return enriched
});


/** Factory Function - Use to create/save logs with pre-defined category prefixes. 
 * @example // Definition:
 * const createLog = useLogger();
 * // Usage Example:
 * createLog.for('Database').info('This is a log message!', {extra: any}) */
export function useLogger() {
    return {

        /** Creates a new log within a specified category. */
        for: (
            /** The category to create a new log for. */
            category: categoryName
        ) => {
            const logTitle = `${LogCategories[category].emoji} ${LogCategories[category].name}`
            // Get Log Payload:
            const payload = (extra: any) => {
                return {
                    ...extra,
                    category
                }
            }
            // Return Static Log Save Functions:
            return {
                /** Creates an `Info` level log. */
                info: (msg: string, extra?: LogMeta) => logtail.info(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates a `Debug` level log. */
                debug: (msg: string, extra?: LogMeta) => logtail.debug(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates a `Warning` level log. */
                warn: (msg: string, extra?: LogMeta) => logtail.warn(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates an `Error` level log. */
                error: (msg: string, extra?: LogMeta) => logtail.error(`[${logTitle}] - ${msg}`, payload(extra)),
            }
        },

        sync: logtail.flush
    }
}


export default logtail
