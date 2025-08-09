import {
    IConfigurationExtend,
    ILogger,
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IAppAccessors } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';

/**
 * AI Bot App for RocketChat - Simplified Version
 */
export class AiBotApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors?: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executePostMessageSent(
        message: IMessage, 
        read: IRead, 
        http: IHttp, 
        persistence: IPersistence, 
        modify: IModify
    ): Promise<void> {
        // Simple null check
        if (!message) {
            return;
        }
        
        // Check if message has text property  
        const messageText = message.text;
        if (!messageText || typeof messageText !== 'string') {
            return;
        }
        
        // Check for bot mentions
        if (!messageText.includes('@ai_deepseek') && !messageText.includes('@ai_qwen')) {
            return;
        }

        // Simple response
        const responseText = `Bot mentioned! Message received.`;
        
        try {
            const builder = modify.getCreator().startMessage()
                .setRoom(message.room)
                .setText(responseText);
            await modify.getCreator().finish(builder);
        } catch (error) {
            this.getLogger().error('Failed to send response:', error);
        }
    }
}

module.exports.AiBotApp = AiBotApp;