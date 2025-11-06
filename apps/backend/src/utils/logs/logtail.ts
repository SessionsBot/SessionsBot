import {  Logtail  } from "@logtail/node";
const ENVIRONMENT = process.env['ENVIRONMENT'];
const sourceToken = process.env['LOGTAIL_SOURCE_TOKEN'];
const ingestingHost = process.env['LOGTAIL_INGESTING_HOST'];

/** Local logger tool to be using in development environment. */
class DevLogger {
   info(...args:any[]) { console.info(...args) }
   warn(...args:any[]) { console.warn(...args) }
   error(...args:any[]) { console.error(...args) }
   debug(...args:any[]) { console.debug(...args) }
   log(...args:any[]) { console.log(...args) }
   flush(...args:any[]) { return }
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