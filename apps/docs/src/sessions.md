# Sessions

Sessions Bot revolves around the `Session Schedules` you create for the bot to the post to your server as `Session Panels`. <span class="opacity-50 text-xs">(for each of the schedules occurrences)</span>

## Schedules

Create a schedule for all of the sessions you want Sessions Bot to post to your server and manage RSVPs for <span class="opacity-50 text-xs">*(if configured)*</span>.


::: tip ⓘ TIP
 You have to create a "schedule" for **one time sessions** as well as recurring sessions that repeat!
:::

### Options
We made sure to provide lots of ways to customize your Sessions/Schedules to match *many* use cases. Explore the options you can customize within your schedules below.

#### Title <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#title}
> Session's title or name
#### Description <span class="text-xs opacity-50"> *(optional)* </span> {#description}
> Session's description
> - **Supports [Discord Markdown](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline)**
> - **Premium Plans+** can mention roles, channels, users, etc. here!
#### Location <span class="text-xs opacity-50"> *(optional)* </span> {#location}
> Session's URL location 
> - **If provided:** Adds a "Location" button to the `Session Panel`
> - **Used for:** Native Discord Event location url
#### Start Date <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#start-date}
> Session's Start Date
> - **Once past:** Various actions are limited such as modifications to the session or it's RSVPs.
#### End Date <span class="text-xs opacity-50"> *(optional)* </span> {#end-date}
> Session's End Date
#### Time Zone <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#time-zone}
> Session's Time Zone
> - **Tip:** Cant find yours? <b>Search by city name!</b>
> - **Used for:** Session's dates & recurrence
#### Repeating Schedules <span class="text-xs opacity-50"> *(optional)* </span> {#repeats}
> Configure your Session to repeat
> - **Frequency:** Repeat daily, weekly, monthly, or yearly
> - **Interval:** The interval to repeat at <br><span class="opacity-65 text-xs">(ex: interval of 2 = every 2 days, weeks, etc.)</span>
> - **Weekdays:** The days of the week to repeat on
> - **Max Repeat Count:** Maximum amount of repeats the session can have
> - **Max Repeat Date:** Latest day the session can repeat on
#### Post Channel <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-channel}
> The Discord text channel to post your `SessionPanel` to
> - **Tip:** Make sure the bot has all [required permissions](./bot-permissions) inside this channel!
#### Post Time <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-time}
> The time of day to post the `SessionPanel`
#### Post Day <span class="text-xs opacity-50 text-(--vp-c-danger-1)"> *(required)* </span> {#post-day}
> Post the `SessionPanel` the "Day of" or "Day before" your session's start date
#### Mention Roles <span class="text-xs opacity-50 text-(--vp-c-purple-2)!"> Premium Feature </span> {#mention-roles}
> The roles to mention within the `SessionPanel` post
#### Post in Thread <span class="text-xs opacity-50"> *(optional)* </span> {#thread-mode}
> Groups `SessionPanel`'s by day in selected time zone
> - **AKA**: `ThreadMode`
#### Native Discord Events <span class="text-xs opacity-50"> *(optional)* </span> {#native-events}
> Creates a `DiscordEvent` matching your `SessionPanel` for this session
> - **NOTE**: Visible to **ALL** Members within your server



## Session Panels
For each of your scheduled session

## RSVPs

this is where sessions rsvps details will be
