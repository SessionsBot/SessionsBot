import { Logtail } from "@logtail/node";
const ENVIRONMENT = process.env['ENVIRONMENT'];
const sourceToken = process.env['LOGTAIL_SOURCE_TOKEN'];
const ingestingHost = process.env['LOGTAIL_INGESTING_HOST'];

// Pre-Defined Log Categories:
const logCategories = {
    Auth: { name: 'Auth', emoji: '👤' },
    Api: { name: 'API', emoji: '🌐' },
    Bot: { name: 'Bot', emoji: '🤖' },
    Schedule: { name: 'Schedule', emoji: '🔁' },
    Unknown: { name: 'Unknown', emoji: '❓' },
} as const;

type categoryName = keyof typeof logCategories;
type logLevel = 'info' | 'warn' | 'error' | 'debug';

/**  Logger Utility - Predefined Class */
export class Log {

    private logTitle: string

    constructor(category: categoryName) {
        // Get Log Category Data/Title:
        const categoryData = logCategories[category];
        if (categoryData.name == 'Unknown') {
            this.logTitle = `[${categoryData.emoji}]`
        } else {
            this.logTitle = `[${categoryData.emoji} ${categoryData.name}]`
        }
    }

    /** Info level log */
    info(text: string, extra?: object) {
        logtail().info(`${this.logTitle} - ${text}`, extra);
    }
    /** Debug level log */
    debug(text: string, extra?: object) {
        logtail().debug(`${this.logTitle} - ${text}`, extra);
    }
    /** Warning level log */
    warn(text: string, extra?: object) {
        logtail().warn(`${this.logTitle} - ${text}`, extra);
    }
    /** Error level log */
    error(text: string, extra?: object) {
        logtail().error(`${this.logTitle} - ${text}`, extra);
    }

}

/** Local logger tool to be using in development environment. */
class DevLogger {
    info(...args: any[]) { console.info(...args) }
    warn(...args: any[]) { console.warn(...args) }
    error(...args: any[]) { console.error(...args) }
    debug(...args: any[]) { console.debug(...args) }
    log(...args: any[]) { console.log(...args) }
    flush() { return }
};

/** `Utility` - **Send logs to internal cloud log storage!** 📃
 * 
 * DEV Environment → Logs locally using console */
const logtail = (): DevLogger => {

    if (ENVIRONMENT !== 'development') {
        return new Logtail(sourceToken || '', {
            endpoint: ingestingHost,
            sendLogsToConsoleOutput: true,

        });

    } else { // dev environment - log locally:
        return new DevLogger()
    }

}

export default logtail()