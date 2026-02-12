<script lang="ts" setup>
    import { ArrowUpCircleIcon, BookKeyIcon } from 'lucide-vue-next';

    // Document Data/Vars:
    const lastUpdated = ref('1/25/26')
    const orgName = ref("Sessions Bot");
    const supportEmail = ref("support@sessionsbot.fyi");
    const securityEmail = ref("security@sessionsbot.fyi");

    // External Privacy Policies:
    const externalPrivacyPolicies = {
        googleAnalytics: "https://policies.google.com/technologies/partner-sites",
        supabase: "https://supabase.com/privacy",
        googleCloud: "https://policies.google.com/technologies/partner-sites",
    }

    // Scroll Util:
    const scroll = useScroll(window, { behavior: 'smooth' })
    const showScrollUp = computed(() => scroll.y.value >= 350)
    function scrollToTop() {
        scroll.x.value = 0
        scroll.y.value = 0
    }

</script>

<template>
    <main class="flex flex-wrap w-full h-full flex-1 justify-center items-center content-center">
        <div class="max-w-4xl mx-auto py-12 pb-2 px-6">

            <!-- Scroll to Top -->
            <Transition name="slide-up" mode="out-in">
                <Button v-if="showScrollUp" @click="scrollToTop" unstyled title="Scroll to Top"
                    class="p-1.5 gap-1 z-3 flex items-center justify-center fixed! bottom-3 right-3 ring-ring bg-surface ring-2 rounded-md cursor-pointer hover:bg-zinc-900 active:scale-95 transition-all">
                    <ArrowUpCircleIcon class="opacity-70" :size="28" />
                </Button>
            </Transition>

            <div class="w-full flex flex-row gap-3 mb-7 py-5 flex-wrap justify-center items-center content-center">
                <BookKeyIcon :size="33" class="sm:scale-125" />
                <h1 class="text-4xl sm:text-5xl font-extrabold w-fit text-center">
                    Privacy Policy
                </h1>
            </div>

            <p class="mb-4">
                This Privacy Policy explains how {{ orgName }} (“we,” “our,” or “us”)
                collects, uses, and shares information when you use our services.
                This privacy policy pertains to our <strong>website</strong>,
                <strong>Discord Bot</strong>, and related services. By using our services, you agree to the
                practices described by this policy.
            </p>

            <h2 class="sectionHeading">Information We Collect</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Discord OAuth2 Data:</strong> When you sign in using Discord, we
                    collect various account information such as user ID, username, avatar image, email, user guilds,
                    etc. We retain this information to maintain app functionality.
                </li>
                <li>
                    <strong>Guild &amp; User Configurations:</strong> Throughout our web
                    dashboard and Discord Bot, we store user inputted data such as saved preferences,
                    sessions/schedules and related metadata, and other guild/user configurations.
                </li>
                <li>
                    <strong>Discord Bot Data:</strong> We may store limited identifiers,
                    such as message IDs and channel/role references, for session
                    and guild management. We do not log or store general chat messages for an extended period of time.
                </li>
                <li>
                    <strong>Supabase:</strong> We use Supabase for data storage and authentication. Please review
                    <a :href="externalPrivacyPolicies.supabase" class="link"> Supabase's Privacy Policy </a> for details
                    on
                    their data handling and retention practices.
                </li>
                <li>
                    <strong>Google Analytics:</strong> We use Google Analytics for collecting usage statistics such as
                    page
                    views, browser/device type, and approximate location. Please review <a
                        :href="externalPrivacyPolicies.googleAnalytics" class="link"> Google Analytics's Privacy
                        Policy</a> for details on their data handling and
                    retention practices.
                </li>
                <li>
                    <strong>Cookies &amp; Local Storage:</strong> We use local browser cookies and storage to maintain
                    your login session, save tokens, support analytics and other various session based related data
                    sets. We may
                    also use cookies and browser storage to store limited site preferences.
                </li>
            </ul>

            <h2 class="sectionHeading">How We Use Your Data</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Authentication & Account Management:</strong> We use Discord OAuth2
                    related information and stored session tokens to verify your identity, maintain
                    login sessions, and provide secure access to your account across our web
                    application and Discord bot.
                </li>
                <li>
                    <strong>Guild & User Configurations:</strong> We process and store
                    configuration data (such as session templates, rsvp templates, required roles, guild preferences,
                    etc.) to
                    personalize your guild’s experience, ensure scheduled events are posted at
                    the preferred times, and allow you and other guild members to manage settings
                    consistently.
                </li>
                <li>
                    <strong>Bot Functionality:</strong> We store limited Discord identifiers (such as
                    message IDs, channel IDs, guild roles, etc.) which are used to operate core bot
                    features like posting session signups, mentioning roles, rsvp attempts, linking
                    dashboard changes to Discord, etc.
                </li>
                <li>
                    <strong>Data Hosting & Authentication Services:</strong> We rely on Supabase to securely store
                    internal data and manage authentication states. Supabase
                    may also retain certain logs as described in <a class="link"
                        :href="externalPrivacyPolicies.supabase">
                        their privacy policies</a>.
                </li>
                <li>
                    <strong>Usage Analytics:</strong> We use Google Analytics to understand how
                    users interact with our web app, including page views, browser/device types,
                    and approximate location. This helps us identify performance issues, improve
                    usability, and prioritize features that matter most to our users. See Google Analytics privacy
                    practices
                    <a class="link" :href="externalPrivacyPolicies.googleAnalytics"> here</a>.
                </li>
                <li>
                    <strong>Cookies & Local Storage:</strong> Browser Cookies and storage are
                    utilized to keep you logged in between visits, save temporary data (like session tokens
                    and preferences), and support analytics functions.
                </li>
                <li>
                    <strong>Support & Communication:</strong> If you contact us or request help,
                    we may use your account information to respond to inquiries, troubleshoot
                    issues, and notify you of important account or security updates.
                </li>
                <li>
                    <strong>Service Improvement:</strong> Aggregated and anonymized usage trends
                    may be analyzed internally to improve performance, reliability, and future
                    development of our services.
                </li>
            </ul>


            <h2 class="sectionHeading">Who We Share Your Data With</h2>
            <p>
                We share data only with trusted third-party providers who are essential to the
                operation, security, and improvement of {{ orgName }}. These providers process
                information strictly for the purposes described below:
            </p>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Discord Inc.:</strong> Certain account and guild data is exchanged
                    with Discord Inc. to enable core features such as OAuth2 authentication,
                    guild preference syncing, bot functionality, etc. This
                    communication is limited to the access scopes that you authorize during sign in.
                </li>
                <li>
                    <strong>Supabase / Google Cloud:</strong> We use Supabase for secure
                    data storage, account/session authentication, and internal configuration
                    management. Data hosted here is protected under Supabase's <a class="link"
                        :href="externalPrivacyPolicies.supabase"> privacy and
                        security standards.</a> We also use a small amount of cloud compute actions through
                    Google Cloud, you can view <a class="link" :href="externalPrivacyPolicies.googleCloud">their privacy
                        practices here</a>.
                </li>
                <li>
                    <strong>Google Analytics:</strong> Aggregated usage statistics (e.g., page
                    views, browser/device type, approximate location) are processed through
                    Google Analytics to help us understand how users interact with our web app
                    and to improve user experience. See their data practices <a class="link"
                        :href="externalPrivacyPolicies.googleAnalytics">here</a>.
                </li>
            </ul>
            <p class="mt-4">
                We do <strong>not sell</strong> personal data to advertisers or third parties.
                If, in the future, it becomes necessary to share information with additional
                trusted providers for service functionality, this Privacy Policy will be
                updated to reflect such changes.
            </p>

            <h2 class="sectionHeading">Data Retention</h2>
            <p>
                We retain data only as long as it is necessary to operate our services and
                provide value to users. Specific retention details include:
            </p>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Guild & User Configurations:</strong> Persist until deleted
                    manually through dashboard settings or by guild administrators.
                </li>
                <li>
                    <strong>Authentication Tokens & Sessions:</strong> Retained only for the
                    duration of active sessions. Expired tokens are automatically invalidated and removed.
                </li>
                <li>
                    <strong>Analytics Data:</strong> Usage statistics collected via Google
                    Analytics may be stored according to Google’s retention policies.
                </li>
            </ul>
            <p class="mt-4">
                You may request complete deletion of your account or guild data at any time by
                contacting us at
                <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>.
            </p>

            <h2 class="sectionHeading">Your Rights</h2>
            <p>
                Depending on your location, you may have certain privacy rights under laws
                such as GDPR (EU/EEA), CCPA (California), or similar regulations. These
                include:
            </p>
            <ul class="list-disc ml-6 space-y-2">
                <li>Right to access the data we hold about you.</li>
                <li>Right to update or correct inaccurate information.</li>
                <li>Right to request deletion of your data.</li>
                <li>Right to restrict or object to certain processing activities.</li>
                <li>Right to data portability, where applicable.</li>
            </ul>
            <p class="mt-4 block">
                To exercise these rights, please contact us at
                <a :href="`mailto:${supportEmail}`" class="link inline">{{ supportEmail }}</a>.
            </p>

            <h2 class="sectionHeading">Age Requirements</h2>
            <p>
                Our services are not primarily directed toward children under the age of 13
                (or the minimum age required by local law). Minors may only use our services
                with the consent and supervision of a parent or guardian. Parents or guardians
                may contact us at any time to request deletion of a minor’s data.
            </p>

            <h2 class="sectionHeading">Security Practices </h2>
            <p>
                We implement industry-standard technical and organizational measures to
                safeguard user data, including encryption in transit, restricted access
                controls, and regular security reviews. However, no online platform can
                guarantee complete security. If you discover a security vulnerability, please
                notify us via email at
                <a :href="`mailto:${supportEmail}`" class="link">{{ securityEmail }}</a>.
            </p>

            <h2 class="sectionHeading">Changes to This Policy</h2>
            <p>
                We may revise this Privacy Policy periodically to reflect new features,
                regulatory requirements, or updates to our data practices. The “Last Updated”
                date will indicate when changes were last made to this policy. Continued use of our services
                after updates constitutes your acceptance of the revised terms.
            </p>

            <h2 class="sectionHeading">Get in Contact</h2>
            <p>
                If you have any questions, concerns, or requests regarding this Privacy
                Policy, please reach out to our support team via email at
                <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>.
            </p>

            <p class="text-sm w-full text-center text-gray-500 mt-11">
                Last Updated: {{ lastUpdated }}
            </p>

        </div>

        <!-- Site Footer -->
        <SiteFooter class="mt-8!" />
    </main>
</template>

<style scoped>
    .link {
        color: var(--color-sky-400);
        text-decoration: underline;
    }

    .sectionHeading {
        margin-top: 32px;
        margin-bottom: 16px;
        font-size: var(--text-2xl);
        line-height: var(--text-2xl--line-height);
        font-weight: var(--font-weight-semibold);
    }

</style>