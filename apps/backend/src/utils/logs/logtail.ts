import { Logtail } from "@logtail/node";
import LogCategories from './categories'
import { ENVIRONMENT_TYPE } from "../environment";

// Env Variables:
const environment = ENVIRONMENT_TYPE;
const isProduction = (environment == "production");
const sourceToken: string = isProduction ? process.env['LOGTAIL_SOURCE_TOKEN'] : process.env['DEV_LOGTAIL_SOURCE_TOKEN'];
const ingestingHost: string = isProduction ? process.env['LOGTAIL_INGESTING_HOST'] : process.env['DEV_LOGTAIL_INGESTING_HOST'];

// Types:
type categoryName = keyof typeof LogCategories;

/** Local logger tool to be using in development environment. */
class DevLogger {
    info(...args: any[]) { console.info(...args) }
    warn(...args: any[]) { console.warn(...args) }
    error(...args: any[]) { console.error(...args) }
    debug(...args: any[]) { console.debug(...args) }
    log(...args: any[]) { console.log(...args) }
    flush() { return }
};

/** `Logtail` *(Instance)* - **Send logs to internal cloud log storage!** 📃 */
const logtail = new Logtail(sourceToken || '', {
    endpoint: ingestingHost,
    sendLogsToConsoleOutput: true
});



/** Factory Function - Use to create/save logs with pre-defined category prefixes. 
 * @example // Definition:
 * const createLog = useLogger();
 * // Usage Example:
 * createLog.for('Database').info('This is a log message!', {extra: any}) */
export function useLogger() {

    /** Extracts the true "called from" or "source" the log was initiated from. */
    function getCaller() {
        const err = new Error();
        const stack = err.stack?.split('\n') ?? [];
        const callerLine = stack[4] || stack[3];
        return callerLine?.trim();
    }

    return {

        /** Creates a new log within a specified category. */
        for: (
            /** Provide the category to create a new log for. */
            category: categoryName
        ) => {
            const logTitle = `${LogCategories[category].emoji} ${LogCategories[category].name}`
            const payload = (extra: any) => {
                return {
                    ...extra,
                    from: getCaller(),
                    category
                }
            }
            return {
                /** Creates an `Info` level log. */
                info: (msg: string, extra?: object) => logtail.info(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates an `Debug` level log. */
                debug: (msg: string, extra?: object) => logtail.debug(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates an `Warn` level log. */
                warn: (msg: string, extra?: object) => logtail.warn(`[${logTitle}] - ${msg}`, payload(extra)),
                /** Creates an `Error` level log. */
                error: (msg: string, extra?: object) => logtail.error(`[${logTitle}] - ${msg}`, payload(extra)),
            }
        }
    }
}

export default logtail