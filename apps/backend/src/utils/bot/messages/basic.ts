import { ActionRowBuilder, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js"
import core from "../../core/core.js"
import { URLS } from "../../core/urls.js"

/** Returns a basic/generic error ContainerBuilder() from provided inputs. */
export const genericErrorMsg = ({
    title = '⚠️ Uh oh! An error occurred..',
    reasonDesc = 'Unknown Error! if this persists, contact support!'
}: {
    /** The title text to provide in the error message. */
    title?: string
    /** The description text to provide in the error message. */
    reasonDesc: string
}
) => {

    return new ContainerBuilder({
        accent_color: core.colors.getOxColor('error'),
        components: <any>[
            new TextDisplayBuilder({ content: '### ' + title }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({ content: `**Reason:**\n> ${reasonDesc}` }),
            new SeparatorBuilder(),
            new ActionRowBuilder({
                components: <any>[
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        emoji: { name: 'chat', id: core.emojis.ids.chat },
                        label: `Get Support`,
                        url: URLS.support_chat
                    }),
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        emoji: { name: 'list', id: core.emojis.ids.list },
                        label: `More Resources`,
                        url: URLS.site_links.support
                    })
                ]
            }),
        ]
    })
}


/** Returns a generic `Footer` for Sessions Bot messages. */
export const defaultFooterText = (opts:
    {
        /** Whether or not to show the `Need Help?` text with support url or not. 
         * @default false */
        showHelpLink?: boolean
        /** Whether or not to display this text as a subheading(`-#`). 
         * @default false */
        lightFont?: boolean
        /** Additional text to append to the end of the footer's text content. */
        appendText?: string
    } = {
        // Default opts:
        showHelpLink: false,
        lightFont: false
    }
) => {
    return new TextDisplayBuilder({ content: `${opts.lightFont ? '-# ' : ''}${core.emojis.string('logo')} Powered by [Sessions Bot](${URLS.website}) ${opts.showHelpLink ? ` |  [Need Help?](${URLS.site_links.support})` : ''} ${opts.appendText?.trim()?.length ? opts.appendText : ``}` })
}