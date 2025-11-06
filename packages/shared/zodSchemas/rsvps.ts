import z from "zod";

export const rsvpSchema = z.object({
    name: z
    .string("RSVP title is required/invalid.")
    .trim()
    .min(2, "RSVP title must be at least 2 characters.")
    .max(25, "RSVP title cannot exceed 25 characters.")
    // allow: letters & numbers -- no special characters
    .regex(
      /^[a-zA-Z0-9]+$/,
      "RSVP title can only include letters (a-Z) and numbers (0-9)."
    ),

    emoji: z
    .string()
    .trim()
    .regex(/^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u,'Please enter a single emoji character! (Ex: "😊")'),

    capacity: z
    .preprocess(
      // Convert string → number if user input came in as text (like from modal)
      (val) => (typeof val === "string" ? Number(val) : val),
      z
        .number(`RSVP capacity must be a number (e.g. "5").`)
        .min(1, "Capacity must be at least 1.")
        .max(1000, "Capacity cannot exceed 1000 users.") // safe upper limit
    ),

    users: z.array(z.any()).optional()

});