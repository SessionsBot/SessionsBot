<script setup lang="ts">
import PanelPreview from '@components/PanelPreview.vue';

</script>

# Sessions

Sessions Bot revolves around the `Sessions` you schedule, which are automatically posted to your server as [`Session Panels`](/sessions#signup-panels) <span class="opacity-50 text-xs">(for each scheduled occurrence)</span>. 



### What are Sessions?

> `Session` = `Event` <span class="italic opacity-60 text-xs">(or any scheduled activity)</span>

A **Session** is a structured event that you configure once and let the bot handle from there.

Each session includes details for:
- **When** it happens (date, time, recurrence)
- **Where** it’s posted (channel, optional url location)
- **How users interact** (RSVPs, limits, roles, etc.)

Once created, Sessions Bot will automatically post a [`Session Panel`](#session-panels) at the scheduled time(s), allowing members to view details and respond to [`RSVP`](#rsvps) slots.



---

### Options

We’ve provided a wide range of customization options so Sessions can adapt to many different use cases.

Explore the available configuration options below.



#### Title <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#title}
> The name of your session



#### Description <span class="text-xs opacity-50"> *(optional)* </span> {#description}
> Additional details about your session  
> - **Supports [Discord Markdown](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline)**  
> - **Premium Plans+** can mention roles, channels, users, etc.



#### Url <span class="text-xs opacity-50"> *(optional)* </span> {#url}
> A URL for where the session takes place  
> - **If provided:** Adds a "Location" button to the `Session Panel`  
> - **Used for:** Discord's native event location (if enabled)



#### Start Date <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#start-date}
> The date and time your session begins  
> - **After this time:** Editing and RSVP changes may become limited



#### End Date <span class="text-xs opacity-50"> *(optional)* </span> {#end-date}
> The date and time your session ends



#### Time Zone <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#time-zone}
> The time zone used for scheduling  
> - **Tip:** Can’t find yours? <b>Search by city name</b>  
> - **Used for:** Dates, times, and repeat calculations



#### Repeating Sessions <span class="text-xs opacity-50"> *(optional)* </span> {#repeats}
> Configure your session to repeat automatically  
> - **Frequency:** Daily, weekly, monthly, or yearly  
> - **Interval:** How often it repeats  
> <span class="opacity-65 text-xs">(ex: interval of 2 = every 2 days/weeks/etc.)</span>  
> - **Weekdays:** Specific days of the week  
> - **Max Repeat Count:** Limit total occurrences  
> - **Max Repeat Date:** Set a final cutoff date  



#### Post Channel <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-channel}
> The channel where the `Session Panel` will be sent to  
> - **Tip:** Confirm the bot has all [required permissions](./bot-permissions)



#### Post Day <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-day}
> Which day to send the [`Session Panel`](#session-panels) 
> - Relative to the session start date
> - **Options:** Same day or the day before



#### Post Time <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-time}
> Time of day to send the [`Session Panel`](#session-panels)
> - Relative to the session post date



#### Mention Roles <span class="text-xs opacity-50 text-(--vp-c-purple-2)!"> Premium Feature </span> {#mention-roles}
> Roles to notify when the [`Session Panel`](#session-panels) is sent



#### Thread Mode <span class="text-xs opacity-50"> *(optional)* </span> {#thread-mode}
> Automatically group [`Session Panels`](#session-panels) into threads by day <span class="text-xs opacity-80"> *(recommended)* </span>
> - Helps reduce channel clutter for recurring sessions  
> - Enterprise plans can modify the "start message" for thread mode, [see more](/preferences#thread-mode-start-message) here.



#### Native Discord Events <span class="text-xs opacity-50"> *(optional)* </span> {#native-events}
> Creates a matching Discord event for your session  
> - Includes basic details about your `Session`  
> - Automatically generated cover image
> - **Note:** Visible to all members in your server  



## RSVPs

RSVPs allow members to respond to a session and indicate their participation.

Depending on your configuration, RSVPs can:
- Limit the number of participants
- Use predefined or custom slot types
- Be restricted to certain roles <span class="opacity-55 text-xs">(premium feature)</span>

Users can RSVP directly from the `Session Panel`, making it easy to join a session without extra commands.

> To remove yourself from an assigned RSVP slot for an *upcoming session* use the [`/my-rsvps`](/commands#my-rsvps) command.



## Session Panels

A **Session Panel** is the message sent in your server that represents each scheduled session occurrence.

It includes:
- Session title, description, and timing
- RSVP options for members
- Optional buttons (location, add to calendar, etc.)
- Role mentions (if configured)

This is the primary way your community interacts with your sessions.

--- 
View an example Session Panel below:

<PanelPreview />

> <span class="text-sm font-medium">The actual message sent to Discord may vary slightly!</span>