<script lang="ts" setup>
    import { BookMarkedIcon } from 'lucide-vue-next';

    // Vars:
    const lastUpdated = ref('11/15/25');
    const orgName = ref('Sessions Bot');
    const githubOrganization = ref('https://github.com/SessionsBot')
    const supportEmail = ref('support@sessionsbot.fyi');

    // Domains/paths
    const rootUrl = ref('https://sessionsbot.fyi');

    // Links
    const internalPrivacyPolicy = ref(`${rootUrl.value}/privacy`);
    const discordPrivacyPolicy = ref('https://discord.com/terms');
    const firebasePrivacyPolicy = ref('https://firebase.google.com/support/privacy')
</script>

<template>
    <main class="flex flex-wrap w-full h-full flex-1 justify-center items-center content-center">
        <div class="max-w-4xl mx-auto py-12 pb-2 px-6 relative">

            <div class="w-full flex flex-row gap-3 mb-6 py-5 flex-wrap justify-center items-center content-center">
                <BookMarkedIcon :size="33" />
                <h1 class="text-4xl font-extrabold w-fit text-center">
                    Terms &amp; Conditions
                </h1>
            </div>

            <p class="mb-4">
                These Terms &amp; Conditions (“Terms”) govern your use of {{ orgName }}’s
                <strong>website</strong> (available at <span class="underline">{{ rootUrl }}</span>)
                and <strong>Discord bot</strong> (together, the “services”).
                By accessing or using the services, you agree to these Terms.
                If you do not agree, please do not use the services.
                <br />

            </p>

            <h2 class="sectionHeading">Scope &amp; Eligibility</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Scope:</strong> These Terms &amp; Conditions apply to both the public-facing site at
                    <a class="link" :href="rootUrl">{{ rootUrl }}</a>,
                    and our Discord bot (SessionsBot). Therefore these terms also apply to any {{ orgName }} features
                    (e.g., scheduling, signups, role mentions)
                </li>
                <li>
                    <strong>Minimum Age:</strong> You must be at least 13 years old or have
                    parental/guardian permission to use the services.
                </li>
                <li>
                    <strong>Account Login:</strong> Access is provided via Discord OAuth2. We may
                    use custom tokens (e.g. JWT, Firebase) and local storage for session management.
                </li>
            </ul>

            <h2 class="sectionHeading">Accounts, Security &amp; Responsibility</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Your Account:</strong> You’re responsible for safeguarding your Discord
                    account, tokens, and any credentials used to access the services. Please use
                    strong passwords, enable 2FA on Discord, and don’t ever share tokens publicly.
                </li>
                <li>
                    <strong>Our Part:</strong> We take reasonable measures to secure our services
                    (see our <a target="_blank" class="link" :href="internalPrivacyPolicy">Privacy Policy</a>), but all
                    online services
                    carry risk. If we mess up, we’ll work to fast to fix it; Caught a security vulnerability? Get in
                    touch with us ASAP <a class="link" :href="`mailto:${supportEmail}`">via email</a>.
                </li>
                <li>
                    <strong>Guild Permissions:</strong> On invite, our bot will request
                    <em> permissions to function fully</em>. <u>Please avoid modifying bot permissions</u> unless
                    strictly necessary for your security model—reduced permissions can break features, and
                    you’re responsible for the effects of permission changes within your server.
                </li>
            </ul>

            <h2 class="sectionHeading">Acceptable Use</h2>
            <p>Don’t use the services to do anything shady, harmful, or illegal. Specifically, you agree not to:</p>
            <ul class="list-disc ml-6 space-y-2">
                <li>Harass, threaten, or abuse others; engage in hate speech or discriminatory content.</li>
                <li>Upload or distribute malware, phishing, or other harmful code; perform DDoS or abuse infrastructure.
                </li>
                <li>Attempt to bypass authentication, rate limits, or security controls.</li>
                <li>Scrape, crawl, or systematically extract data without permission.</li>
                <li>Reverse engineer, decompile, or otherwise attempt to derive source code or non-public APIs, except
                    where allowed by law.</li>
                <li>Use the services to violate Discord’s Terms or Community Guidelines.</li>
                <li>Impersonate others, misrepresent affiliation, or infringe intellectual property or privacy rights.
                </li>
                <li>Resell, sublicense, or commercially exploit the services without our consent.</li>
            </ul>
            <p class="mt-2">
                <strong>Fair Use &amp; Rate Limits:</strong> We may throttle, restrict, or suspend usage to protect
                stability and
                ensure fair access for everyone.
            </p>

            <h2 class="sectionHeading">User Content &amp; Licenses</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Your Content:</strong> You retain ownership of content you submit or configure in the
                    services.
                    You grant {{ orgName }} a nonexclusive, worldwide, royalty-free license to host, use, display,
                    perform, and create derivative works solely as needed to operate, maintain, and improve the
                    services.
                </li>
                <li>
                    <strong>Bot Identifiers &amp; Logs:</strong> We may process limited Discord identifiers (e.g.,
                    message IDs,
                    channel/role references) to provide features like session signups and role mentions. We do not
                    retain general
                    chat messages for extended periods.
                </li>
                <li>
                    <strong>Feedback:</strong> If you share ideas or suggestions, you grant us a perpetual, irrevocable,
                    worldwide, royalty-free license to use them without obligation or compensation.
                </li>
            </ul>

            <h2 class="sectionHeading">Third-Party Services</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Discord:</strong> Authentication and certain features rely on Discord. Your use of Discord
                    is
                    governed by <a target="_blank" class="link" :href="discordPrivacyPolicy">their terms and
                        policies</a>.
                </li>
                <li>
                    <strong>Google Firebase / Google Cloud:</strong> Used for data storage and authentication. <a
                        class="link" :href="firebasePrivacyPolicy">See their policies
                        for data handling and retention practices</a>.
                </li>
                <li>
                    <strong>Google Analytics:</strong> Used to understand usage patterns and improve the services.
                </li>
            </ul>
            <p class="mt-2 italic">
                Third-party services may change their features, pricing, or policies; we’re not responsible for their
                outages or changes.
            </p>

            <h2 class="sectionHeading">Plans, Payments &amp; Refunds</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Free &amp; Paid Plans:</strong> A free plan is always available. Paid tiers with
                    additional exclusive features available. Plan details and pricing available wherever you activate or
                    purchase them
                    (e.g., on the dashboard or Discord integrations).
                </li>
                <li>
                    <strong>Billing &amp; Processing:</strong> Payments may be processed by
                    third-party providers (e.g., Discord or other processors). By purchasing, you agree to their terms
                    and our posted plan terms.
                </li>
                <li>
                    <strong>Refunds:</strong> Unless required by law, fees are non-refundable. We may, at our
                    discretion, issue
                    prorated or courtesy refunds in edge cases.
                </li>
                <li>
                    <strong>Taxes:</strong> Prices could potentially exclude applicable taxes/VAT; you are responsible
                    for applicable taxes unless stated otherwise.
                </li>
                <li>
                    <strong>Cancellation:</strong> You can cancel a paid plan at any time; access continues until the
                    end of the
                    current billing period.
                </li>
            </ul>

            <h2 class="sectionHeading">Uptime, Support &amp; Suspension</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Uptime:</strong> Best-effort service with a non-binding target of high availability. We may
                    perform
                    maintenance or updates from time to time.
                </li>
                <li>
                    <strong>Support:</strong> Email <a class="link" :href="`mailto:${supportEmail}`">{{ supportEmail
                    }}</a>.
                    No guaranteed response times, but we aim to reply quickly.
                </li>
                <li>
                    <strong>Suspension/Termination:</strong> We may suspend or terminate access (with or without notice)
                    for
                    violations, security concerns, abuse, or other risks to the services or users.
                </li>
            </ul>

            <h2 class="sectionHeading">Privacy &amp; Security</h2>
            <p>
                Your use of the services is also governed by our
                <a target="_blank" class="link" :href="internalPrivacyPolicy">Privacy Policy</a>. If you believe you've
                identified a potential security issue, please contact us at
                <a class="link" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a> as soon as possible.
            </p>

            <h2 class="sectionHeading">Open Source &amp; Licenses</h2>
            <p>
                The services incorporate open-source software. Our organization’s code is published under the MIT
                License via our
                <a target="_blank" class="link" :href="githubOrganization">GitHub org</a> (SessionsBot). Third-party
                components remain subject to their respective licenses.
            </p>

            <h2 class="sectionHeading">Beta &amp; Experimental Features</h2>
            <p>
                Some features may be labeled beta/experimental and are subject to changes, rate-limitations, or removal.
                We appreciate your
                patience and <a target="_blank" class="link" :href="githubOrganization + '/backend/issues'">bug
                    reports</a>.
            </p>

            <h2 class="sectionHeading">DMCA &amp; IP </h2>
            <p>
                If you believe any content accessible via our services infringes your copyright, please send a notice to
                <a class="link" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a> with sufficient detail (work
                identified,
                location/URL, contact info, and a statement under penalty of perjury). We will take action as soon as
                possible.
            </p>

            <h2 class="sectionHeading">Export Controls &amp; Sanctions</h2>
            <p>
                You represent you are not barred from using the services under applicable export control or sanctions
                laws and will
                not use the services in violation of such laws.
            </p>

            <h2 class="sectionHeading">Disclaimers &amp; Limitation of Liability</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Disclaimer:</strong> The services are provided “as is” and as available.” We disclaim
                    warranties of
                    merchantability, fitness for a particular purpose, and non-infringement to the maximum extent
                    permitted by law.
                </li>
                <li>
                    <strong>Limitation:</strong> To the fullest extent permitted by law, {{ orgName }} and its
                    affiliates will not
                    be liable for indirect, incidental, special, consequential, or punitive damages, or lost profits or
                    revenues,
                    arising out of or related to your use of our services.
                </li>
                <li>
                    <strong>Cap:</strong> Our total liability for any claims arising out of or relating to the services
                    will not
                    exceed the greater of <strong>$100</strong> or the amounts you paid (if any) to {{ orgName }} for
                    the services
                    in the 12 months before the event giving rise to liability.
                </li>
            </ul>

            <h2 class="sectionHeading">Indemnification</h2>
            <p>
                You agree to defend, indemnify, and hold harmless {{ orgName }} and our affiliates from any claims,
                damages,
                liabilities, and costs (including reasonable legal fees) arising from your use of the services, your
                content,
                or your violation of these Terms or applicable law.
            </p>

            <h2 class="sectionHeading">Governing Law; Disputes</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li>
                    <strong>Governing Law &amp; Venue:</strong> These Terms are governed by the laws of the United
                    States of America, without
                    regard to conflict-of-law principles.
                </li>
                <li>
                    <strong>Arbitration &amp; Class Waiver (U.S. users):</strong> Except for small-claims or injunctive
                    relief,
                    any dispute will be resolved by binding, individual arbitration and not as a class or representative
                    action.
                    You may opt out within 30 days of first accepting these Terms by emailing
                    <a class="link" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a> with “Arbitration Opt-Out”
                    and your account details (Discord user ID).
                </li>
            </ul>

            <h2 class="sectionHeading">Changes to These Terms</h2>
            <p>
                We may update these Terms from time to time. Changes take effect when posted on this page. We currently
                do not send
                email notifications of changes as we don't store user emails. Your continued use of the services after
                changes become effective constitutes
                acceptance of the revised Terms.
            </p>

            <h2 class="sectionHeading">Termination of Use</h2>
            <p>
                You may stop using the services at any time. We may terminate or suspend access at any time, including
                for
                violations of these Terms, security concerns, required legal compliance, or risk to the services or
                users.
                Some provisions survive termination (e.g., IP, disclaimers, limitations, arbitration, indemnification).
            </p>

            <h2 class="sectionHeading">Miscellaneous</h2>
            <ul class="list-disc ml-6 space-y-2">
                <li><strong>Severability:</strong> If any provision is unenforceable, the rest remain in effect.</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our consent; we may assign them
                    as part of a merger, acquisition, or asset sale.</li>
                <li><strong>No Waiver:</strong> Failure to enforce a provision is not a waiver.</li>
                <li><strong>Headings:</strong> Are for convenience and have no legal effect.</li>
            </ul>

            <h2 class="sectionHeading">Get in Contact</h2>
            <p>
                Questions about these Terms? Email us at
                <a class="link" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a>.
            </p>

            <p class="text-sm w-full text-center text-gray-500 mt-11">
                Last Updated: {{ lastUpdated }}
            </p>
        </div>
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