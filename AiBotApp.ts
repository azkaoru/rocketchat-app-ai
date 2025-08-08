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
 * AI Bot App for RocketChat
 * 
 * This app listens for messages that mention bots and responds with 
 * the original message content and its ID.
 */
export class AiBotApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    /**
     * Handles messages sent to the chat and responds to bot mentions
     * 
     * @param message The message that was sent
     * @param read Read accessor for data
     * @param http HTTP accessor for external requests
     * @param persistence Persistence accessor for storing data
     * @param modify Modify accessor for creating responses
     */
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        // Skip if no text or no @ mentions
        if (!message.text || !message.text.includes('@')) {
            return;
        }

        // Check for bot mentions - more precise pattern to avoid email matches
        const botMentionPattern = /@(?:bot|ai|assistant)(?:\s|$|[^a-zA-Z0-9._-])/i;
        
        if (!botMentionPattern.test(message.text)) {
            return; // No bot mentioned, skip
        }

        // Prevent infinite loops by not responding to our own messages
        const appUser = await read.getUserReader().getAppUser();
        if (appUser && message.sender.id === appUser.id) {
            return;
        }

        // Create response message with the original message content and ID
        const responseText = `🤖 Bot mentioned! Received message: "${message.text}" with ID: ${message.id || 'unknown'}`;
        
        const builder = modify.getCreator().startMessage()
            .setRoom(message.room)
            .setText(responseText);

        try {
            await modify.getCreator().finish(builder);
            this.getLogger().info(`Responded to bot mention in room: ${message.room.displayName || message.room.id}`);
        } catch (error) {
            this.getLogger().error('Failed to send response message:', error);
        }
    }
}