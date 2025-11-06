import { DateTime } from "luxon";


export const COMMON_TIMEZONES = [
  // North America
  "America/New_York", // Eastern
  "America/Chicago",  // Central
  "America/Denver",   // Mountain
  "America/Los_Angeles", // Pacific
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Phoenix",
  "America/Puerto_Rico",
  "America/Sao_Paulo", // Brazil

  // Europe
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Moscow",
  "Europe/Istanbul",

  // Africa & Middle East
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Tehran",
  "Asia/Jerusalem",

  // Asia-Pacific
  "Asia/Kolkata", // India
  "Asia/Bangkok", // Thailand
  "Asia/Ho_Chi_Minh", // Vietnam
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Manila",

  // Oceania
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",

  // Others / UTC
  "Atlantic/Reykjavik",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Lima",
  "America/Bogota",
  "Africa/Casablanca",
  "UTC"
];


export const AUTOCOMPLETE_TIMEZONES = COMMON_TIMEZONES.map(tz => {
  const dt = DateTime.now().setZone(tz);
  return {
    name: `${dt.offsetNameLong || dt.offsetNameShort}`, // (${tz.replaceAll('_', ' ')})
    value: tz
  };
});