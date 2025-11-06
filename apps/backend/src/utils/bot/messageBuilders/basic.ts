import { ActionRowBuilder, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, MessageFlags} from "discord.js"
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
            new TextDisplayBuilder({content: '### ' + title}),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `**Reason:**\n> ${reasonDesc}`}),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `-# Need Help? Join our support server for bot assistance:`}),
            new ActionRowBuilder({
                components: <any>[
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        label: `💬 Get Support`,
                        url: core.urls.support.serverInvite
                    })
                ]
            }),
            new SeparatorBuilder(),
        ]
    })
}


/** Returns a generic `Footer` for Sessions Bot messages. */
export const defaultFooterText = (config: 
    {
        /** Whether or not to show the `Need Help?` text with support url or not. */
        showHelpLink?: boolean
    } = { 
        // Default opts:
        showHelpLink: false
    }
) => {
    return new TextDisplayBuilder({content: `${core.emojiStrings['sessions']} Powered by [Sessions Bot](${core.urls.mainSite}) ${config.showHelpLink ? ` |  [Need Help?](${core.urls.support.serverInvite})`:''}`})
}


export const invalidInputMsg = (
{
    inputTitle = 'Input',
    reason = `It seems you've entered an incorrect \`${inputTitle}\`... \n-# Please confirm inputs and try again!`,
    v2 = null
}:{
    inputTitle?: string, 
    reason?: string,
    v2?: {errorMap:{[inputName:string]: string[]}}
}) => {
    if(v2){ // v2 - invalid input(s) mapped msg:
        // map invalid input(s) msg:
        const reasonString = () => {
            let r = '';
            for (const [inputName, errs] of Object.entries(v2.errorMap) || []){
                r += `**${inputName.replace('_', ' ')}**: \n-# -  ${errs.join(' \n-# - ')} \n`
            }
            return r;
        }
        return new ContainerBuilder({
            accent_color: core.colors.getOxColor('error'), 
            components: <any>[
                new TextDisplayBuilder({content: `### 🆎 - Invalid Input(s)!`}),
                new SeparatorBuilder(),
                new TextDisplayBuilder({content: `${reasonString()}`}),
                new SeparatorBuilder(),
                defaultFooterText({showHelpLink: true})
            ]
        })
            

    } else return new ContainerBuilder({ // v1:
        accent_color: core.colors.getOxColor('error'),
        components: <any>[
            new TextDisplayBuilder({content: `### 🆎 - Invalid ${inputTitle}!`}),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `**Details:**\n> ${reason}`}),
            new SeparatorBuilder(),
            defaultFooterText({showHelpLink: true})
        ]
    })
}