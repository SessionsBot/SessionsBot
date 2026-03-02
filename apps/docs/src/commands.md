# Commands

Sessions Bot has a few slash commands for you to explore and use. Read a detailed list about each of them below.

### `/cancel`
Allows users to cancel an upcoming session that has already been posted but <u>has not yet started</u>.
> Options:
> - `session`
> <br>The session to cancel.
> - `reason` <span class="text-xs opacity-50">*(optional)*</span>
><br>The reasoning for canceling the session. 


### `/dashboard`

Prompts and redirect the user to the web app / dashboard for viewing sessions, making new schedules, altering configurations, etc.


### `/delay`
Allows users to delay an upcoming session's start date that has already been posted but <u>has not yet started</u>.
> Options:
> - `session`
> <br>The session to delay.
> - `delay-time`
><br>The amount of time to delay the start time by.
<span class="bg-black/10 rounded-md p-2 m-0! my-2! flex! w-fit! text-sm flex-wrap!">
    <span class="w-full">
        Examples:
    </span>
    <span class="w-full pl-2">
        "2 mins", "12 pm", "in 2 hours"
    </span>
</span>
> - `reason` <span class="text-xs opacity-50">*(optional)*</span>
><br>The reasoning for delaying the session. 


### `/documentation`

Prompts and redirects the user to the documentation resources for Sessions Bot *(this website)*.
> This is a great place to learn all about Sessions Bot!


### `/my-rsvps`

Shows the user an interactive message containing their current RSVP assignments to sessions in the <u>future</u>.
::: tip ⓘ Note:
> This is how you can **review and remove** yourself from any RSVP assignments you've made.
:::


### `/new-session`

Prompts and redirects the user to the [Bot Dashboard](https://sessionsbot.fyi/dashboard) and automatically opens the new session form to easily get started with created a new `Session Schedule`.


### `/support`

Prompts the user with useful support resources for Sessions Bot and it's related services.
> Still Stuck? Get in touch with [Bot Support](https://discord.gg/49gNbwA8t6).


### `/update`
Allows users to update a `Session Panel` that has recently been posted.
> Options:
> - `session`
> <br>The session to update.