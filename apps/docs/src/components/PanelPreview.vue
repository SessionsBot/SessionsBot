<script setup lang="ts">
  import { API_GuildPreferencesDefaults, RegExp_DiscordEmojiId } from '@sessionsbot/shared';
  import { DateTime } from 'luxon';
  import { computed, ref } from 'vue';
  import { getDiscordHtml } from '../utils/discordHtml';

  const startDate = computed(() => DateTime.utc().set({ hour: 12, minute: 25 })?.startOf('minute'))
  const endDate = computed(() => startDate.value?.plus({ hour: 1.5 }) || null)

  const rsvps = ref([
    {
      name: 'RSVP Example',
      emoji: '💼',
      capacity: 10,
      required_roles: []
    }
  ])

</script>

<template>
  <!-- Center Wrap -->
  <span class="w-full flex-center flex-wrap **:m-0">
    <!-- Main Content -->
    <div class="w-fit flex items-start flex-row gap-2.5 p-3.5 overflow-auto!">
      <!-- Bot Icon -->
      <img :src="'/logo.png'" class="size-10.5 flex rounded-full" />

      <!-- Bot Message -->
      <span class="flex flex-col gap-1 grow">
        <!-- Bot Message Title -->
        <p class="font-bold">
          Sessions
        </p>

        <!-- Message/Component(s) Container -->
        <span
          class="p-3 pl-4 gap-1 text-sm bg-bg-2 border border-ring-soft/40 rounded-md relative w-fit flex items-center flex-col overflow-clip">
          <!-- Accent Bar -->
          <div class="h-full w-1.25 left-0 top-0 absolute"
            :style="{ background: API_GuildPreferencesDefaults.accent_color }" />

          <!-- Title-->
          <p class="font-bold w-full text-xl mb-0!">
            Example Session
          </p>

          <!-- Description -->
          <div
            v-html="getDiscordHtml(`> This is an example description! \n__Using__ \`various\` *markdown* **features**!`)"
            class="w-full discord-preview" />

          <div class="w-[98%] h-0.25 my-2! bg-bg-3" />

          <!-- Start/End Dates -->
          <div class="flex flex-row items-start gap-2.25 justify-between w-full px-1">
            <!-- Section Content -->
            <div class="flex flex-col gap-px flex-wrap grow">
              <!-- Start Date -->
              <span class="flex items-center gap-1 w-full">
                <img src="https://sessionsbot.fyi/assets/botEmojis/clock.png" class="size-4.75" />
                <p class="font-bold my-0!"> Starts at: </p>
              </span>
              <span
                v-html="getDiscordHtml(`> <t:${startDate?.toUnixInteger() ?? 0}:d> | <t:${startDate?.toUnixInteger() ?? 0}:t> `)"
                class="discord-preview *:mt-1.5! *:pt-0!" />
              <!-- End Date -->
              <span v-if="endDate" class="flex items-center gap-1 w-full">
                <img src="https://sessionsbot.fyi/assets/botEmojis/clock.png" class="size-4.75" />
                <p class="font-bold my-0!"> Ends at: </p>
              </span>
              <span v-if="endDate"
                v-html="getDiscordHtml(`> <t:${endDate?.toUnixInteger() ?? 0}:d> | <t:${endDate?.toUnixInteger() ?? 0}:t> `)"
                class="discord-preview *:mt-1.5! *:pt-0!" />
            </div>
            <!-- Section Button -->
            <div class="flex w-fit min-w-fit! h-full">
              <Button unstyled title="Add to Calendar"
                class="button-base rounded px-3.25 py-1.25 rounded-lf border bg-text-1/5 border-ring-soft/30">
                <img src="https://sessionsbot.fyi/assets/botEmojis/calendar.png"
                  class="size-4.75 inline opacity-80 aspect-square" />
              </Button>
            </div>
          </div>

          <div class="w-[98%] h-0.25 my-2! bg-bg-3" />

          <!-- RSVP Section(s) w/ Divider -->
          <span v-if="rsvps?.length" v-for="r in rsvps" class="flex w-full flex-col gap-1">
            <div class="flex flex-row items-start gap-2.25 justify-between w-full px-1">
              <!-- RSVP Slot Data -->
              <div class="flex flex-col gap-0 flex-wrap grow">
                <span class="flex items-center gap-1 w-full">
                  <!-- Slot Emoji -->
                  <img v-if="r?.emoji && RegExp_DiscordEmojiId.test(r?.emoji)" title="Custom Emoji"
                    src="https://sessionsbot.fyi/discord-grey.png" class="size-4.5 rounded" />
                  <p v-else-if="r?.emoji" class="my-0!"> {{ r?.emoji }} </p>
                  <!-- Slot Name -->
                  <p class="font-bold my-0!"> {{ r?.name }} </p>
                </span>
                <span v-html="getDiscordHtml(`> No RSVPs `)" class="discord-preview *:mt-0! *:pt-0! mt-1" />
              </div>
              <!-- RSVP Button -->
              <div class="flex w-fit min-w-fit! h-full">
                <Button unstyled title="RSVP"
                  class="button-base rounded px-3.25 py-1.25 rounded-lf border bg-text-1/5 border-ring-soft/30">
                  <img src="https://sessionsbot.fyi/assets/botEmojis/user-success.png"
                    class="size-4.75 inline opacity-80 aspect-square" />
                </Button>
              </div>
            </div>

            <div class="w-[98%] h-0.25 my-2! bg-bg-3" />
          </span>

          <!-- Action Row -->
          <div class="flex w-full items-center gap-3 px-1 flex-row">
            <!-- Location -->
            <Button unstyled title="Location"
              class="button-base rounded gap-1 px-2.5! py-1! rounded-lf border bg-text-1/5 border-ring-soft/30">
              <img src="https://sessionsbot.fyi/assets/botEmojis/link.png"
                class="size-4.75 inline opacity-80 aspect-square" />
              <p class="font-semibold m-0! p-0!">
                Location
              </p>
            </Button>
            <!-- View Online -->
            <Button unstyled title="View Online"
              class="button-base rounded gap-1 px-2.5! py-1! rounded-lf border bg-(--vp-c-text-1)/5 border-(--vp-c-default-1)/30">
              <img src="https://sessionsbot.fyi/assets/botEmojis/eye.png"
                class="size-4.75 inline opacity-80 aspect-square" />
              <p class="font-semibold m-0! p-0!">
                View Online
              </p>
            </Button>
          </div>

          <div hidden class="w-[98%] h-0.25 my-2! bg-bg-3" />

          <!-- Watermark -->
          <div class="hidden! w-full text-[13px] gap-0 flex-col text-xs/tight">
            <span class="flex w-full flex-row items-center gap-1 mt-1 relative bottom-1">
              <img src="/logo.png" class="rounded size-4" />
              <span class="opacity-85"> Powered by <span class="text-link hover:underline">Sessions
                  Bot</span></span>

            </span>
          </div>

          <!-- Mention Roles -->
          <span hidden class="flex w-full text-[13px] gap-1 flex-wrap text-xs/tight">
            <span class="inline-flex flex-row items-center">
              <img src="https://sessionsbot.fyi/assets/botEmojis/bell.png" class="rounded size-4" />
              <p> : </p>
            </span>

            <div class="inline">
              <span v-for="r in ['@Event Alerts']" title="Mentioned Role"
                class="px-0.75 py-0.25 inline rounded text-xs font-semibold cursor-pointer bg-link/45">
                {{ r }}
              </span>
            </div>

          </span>


        </span>

      </span>

    </div>
  </span>
</template>


<style scoped>

  @reference "@theme/custom.css";

  .button-base {
    @apply flex rounded flex-row flex-wrap items-center justify-center gap-1 px-1.5 py-1;
  }

</style>