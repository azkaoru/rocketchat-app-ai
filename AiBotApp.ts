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

export class AiBotApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        // Check if this message contains mentions (we'll look in text for @mentions)
        if (!message.text || !message.text.includes('@')) {
            return; // No mentions, skip
        }

        // Check if the message mentions any bot (simple check for now)
        // In a real implementation, you would check against actual bot usernames
        const botMentionPattern = /@(bot|ai|assistant)/i;
        
        if (!botMentionPattern.test(message.text)) {
            return; // No bots mentioned, skip
        }

        // Create response message with the original message content and ID
        const builder = modify.getCreator().startMessage()
            .setRoom(message.room)
            .setText(`Bot mentioned! Received message: "${message.text}" with ID: ${message.id || 'unknown'}`);

        try {
            await modify.getCreator().finish(builder);
        } catch (error) {
            this.getLogger().error('Failed to send response message:', error);
        }
    }
}