
/** **UTILITY**: Used to generate internal friendly ids for new objects/data/any to be stored. */
export const generateId = {

    /** RSVP Id   @ex `rsvp_c2b045b033489d7bf298` */
    rsvp: () => {
        const bytes = crypto.getRandomValues(new Uint8Array(10));
        const random = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        return `rsvp_${random}`;
    }
}
