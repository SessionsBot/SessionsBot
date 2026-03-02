<script setup>
    import AllRequiredPerms from '@components/permissions/AllRequiredPerms.vue'
</script>

# Bot Permissions

In order for Sessions Bot to operate properly and deliver it's features, the application requires certain permission within your Discord server.

> [!CAUTION] ⚠ Don't modify default permissions:
> When you invite Sessions Bot to a server, it asks right away for the <u>server level</u> permissions it needs. Please **do not modify its granted permissions**, doing so may result in broken functionality!

## All Required Permissions:
<AllRequiredPerms />

## Permission Locations

> The required permissions must be granted to Sessions Bot in ALL of the following locations:
>
> > [!NOTE] ⚙ Server Settings
> > <code class="text-(--vp-c-yellow-2)!">Server Settings > Applications > Sessions > Permissions</code>
>
> > [!NOTE] 📄 Post Channels
> >
> > <p class="text-xs/snug! opacity-70"> - Ensure there's no <u>permission overrides</u> in channels you're expecting Sessions Bot to post in! <span class="text-xs/tight opacity-50">(any of your schedules "Post Channels")</span> </p>
> > <code class="text-(--vp-c-yellow-2)!">Channel > Permissions > Sessions Bot</code>




## Post Failures

When Sessions Bot tries to send a `Session Panel` to a channel you've designated and fails due to permissions, it will attempt to send your session 3 times. 

**After 3 post failures** you're schedule will be marked as ***disabled***! To re-enable a schedule that has been disabled you'll have to access your [Bot Dashboard](https://sessionsbot.fyi/dashboard).
