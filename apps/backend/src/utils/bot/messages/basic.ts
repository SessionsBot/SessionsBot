import { ActionRowBuilder, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js"
import core from "../../core.js"

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
            // new TextDisplayBuilder({ content: `-# Need Help? Join our support server for bot assistance:` }),
            new ActionRowBuilder({
                components: <any>[
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        label: `💬 Get Support`,
                        url: core.urls.support.serverInvite
                    }),
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        label: `📚 More Resources`,
                        url: core.urls.support.onlineResources
                    })
                ]
            }),
            // new SeparatorBuilder(),
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
    return new TextDisplayBuilder({ content: `${opts.lightFont ? '-# ' : ''}${core.emojiStrings?.logo} Powered by [Sessions Bot](${core.urls.mainSite}) ${opts.showHelpLink ? ` |  [Need Help?](${core.urls.support.serverInvite})` : ''} ${opts.appendText?.trim()?.length ? opts.appendText : ``}` })
}