//@ts-check
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import core from "../core.js";
import logtail from "../logs/logtail.js"
import { GuildDocData, SuccessResult, ErrorResult} from "@sessionsbot/shared";

let a:GuildDocData

//+ Default Export:
/** Utility module for performing specific database functions */
export default {

    /** Increment Global Counters */
    globalCounters: {

        /** Increment Global Sessions Created */
        incrementSessionsCreated: async (increase:number) => { try {
            // Increase count within database:
            const incrementResult = await db.collection('events').doc('sessionsCreated').set({
                allTime : FieldValue.increment(increase)
            })
            // Return Result:
            return new SuccessResult({writeTime: incrementResult.writeTime});

        } catch (err) {
            //Return/Log Error:
            logtail.warn('[!] Failed to increase "sessionsCreated" global counter..', {increaseLost: increase, rawError: err})
            return new ErrorResult('Failed to increase "sessionsCreated" global counter!', err);
        }},

        /** Increment Global Roles Assigned */
        incrementRolesAssigned: async (increase:number) => { try {
            // Increase count within database:
            const incrementResult = await db.collection('events').doc('rolesAssigned').set({
                allTime : FieldValue.increment(increase)
            })
            // Return Result:
            return new SuccessResult({writeTime: incrementResult.writeTime});

        } catch (err) {
            //Return/Log Error:
            logtail.warn('[!] Failed to increase "rolesAssigned" global counter..', {increaseLost: increase, rawError: err})
            return new ErrorResult('Failed to increase "rolesAssigned" global counter!', err);
        }},
    }

    

}
