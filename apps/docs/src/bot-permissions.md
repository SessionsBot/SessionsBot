<script setup>
    import AllRequiredPerms from '@components/permissions/AllRequiredPerms.vue'
import { Icon } from '@iconify/vue';
</script>

# Bot Permissions

In order for Sessions Bot to operate properly and deliver it's features, the bot requires certain permission within your Discord server.

> [!CAUTION] ⚠ Try not to modify default permissions:
> When you invite Sessions Bot to a server, it asks right away for the <u>server level</u> permissions it needs. Please **do not modify its granted permissions**, doing so may result in broken functionality!

## All Required Permissions
<AllRequiredPerms />

## Permission Locations

> The required permissions must be granted to Sessions Bot in ALL of the following locations:
>
> > [!NOTE] ⚙ Server Settings
> > <code class="text-(--vp-c-yellow-2)!">Server Settings > Applications > Sessions > Permissions</code>
>
> > [!NOTE] 📄 Post Channels
> >
> > <p class="text-xs/snug! opacity-70"> - Ensure there are no <u>permission overrides</u> in channels you're expecting the bot to post in! 
>> <br><span class="text-xs/tight opacity-50">(e.g. any of your schedules "Post Channels")</span> </p>
> > <code class="text-(--vp-c-yellow-2)!">Channel > Permissions > Sessions Bot</code>

## Post Failures

When Sessions Bot tries to send a `Session Panel` to a channel and **fails due to permissions**, the bot will attempt to send the session 3 times in total before <u>automatically disabling itself</u>.

**After 3 post failures** you're schedule will be **_disabled_** and no longer post on schedule! To re-enable a session that has been disabled you'll have to access your [Bot Dashboard](https://sessionsbot.fyi/dashboard).
<blockquote>
    When your bot has disabled session's you'll see an alert towards the top of your dashboard screen.
    <br>–
    <span class="text-xs">
        Need help re-enabling a session? <a href="https://discord.gg/rkSdTMbq5p" target="_blank">Contact support</a>
    </span>
</blockquote>