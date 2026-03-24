<script setup lang="ts">
import { Icon } from '@iconify/vue';

</script>

# Preferences

Sessions Bot allows for various "server-wide" customizations for you to alter certain bot features to your liking.

### Accent Color

The hex color code to use within various bot messages sent from Sessions Bot.
> Please note, this accent color is not used within **all** bot messages.

### Public Sessions

Weather or not your sessions can be accessible from the web without a user signed in to an account.

> **If enabled:** Any user signed in or not can view your general session information online with the sessions unique link.
> - Your sessions won't be publicly searchable but accessible from its url like so:
> `https://sessionsbot.fyi/sessions/:sessionId`
> - Session Ids are highly unique and generally considered private unless YOU share them.


> **If disabled:** Any user visiting a session's details by URL will have to first sign into a Discord account AND have either `ManageServer` or `Administrator` permissions within your Discord server to view any data.


### Thread Mode Start Message 
<div class="text-(--vp-c-brand-2)! bg-(--vp-c-default-soft)! p-1! mt-2! w-fit rounded! text-xs! block!"> <Icon icon="tabler:diamond" class="inline! left-px" /> Enterprise Feature
</div>


Customize the message that is sent at the beginning of each new day's thread for your [`Session Panel`](/sessions#session-panels) messages.
> - Only takes effect when [`Thread Mode`](/sessions#thread-mode) is enabled for at least one session.
> - Currently only available to Enterprise plans