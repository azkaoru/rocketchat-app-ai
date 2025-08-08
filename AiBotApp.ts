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
 * the original message content, its ID, channel name, and channel topic.
 * Also triggers GitLab pipelines when configured via environment variables.
 */
export class AiBotApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors?: IAppAccessors) {
        super(info, logger, accessors);
    }

    /**
     * Extracts the bot name from a message text
     * @param text The message text
     * @returns The extracted bot name or 'unknown'
     */
    private extractBotName(text: string): string {
        const match = text.match(/@(ai_deepseek|ai_qwen)(?:\s|$|[^a-zA-Z0-9._-])/i);
        return match ? match[1] : 'unknown';
    }

    /**
     * Triggers GitLab pipeline if environment variables are configured
     * @param message The original message
     * @param channelName The channel name
     * @param channelTopic The channel topic
     * @param botName The mentioned bot name
     * @param http HTTP accessor for making requests
     */
    private async triggerGitLabPipeline(
        message: IMessage, 
        channelName: string, 
        channelTopic: string, 
        botName: string, 
        http: IHttp
    ): Promise<void> {
        const trigger = process.env.GITLAB_PIPELINE_TRIGGER;
        if (trigger !== 'true') {
            return;
        }

        const projectId = process.env.GITLAB_PIPELINE_TRIGGER_PROJECT_ID;
        const token = process.env.GITLAB_PIPELINE_TRIGGER_TOKEN;
        const ref = process.env.GITLAB_PIPELINE_TRIGGER_REF;
        const gitlabUrl = process.env.GITLAB_PIPELINE_TRIGGER_URL;

        if (!projectId || !token || !ref || !gitlabUrl) {
            this.getLogger().warn('GitLab pipeline trigger is enabled but required environment variables are missing');
            return;
        }

        const url = `${gitlabUrl}/api/v4/projects/${projectId}/trigger/pipeline`;
        
        const requestData = {
            token: token,
            ref: ref,
            variables: {
                ROCKETCHAT_MESSAGE: message.text || '',
                ROCKETCHAT_CHANNEL_NAME: channelName,
                ROCKETCHAT_TOPIC: channelTopic,
                ROCKETCHAT_BOT_NAME: botName,
                ROCKETCHAT_MESSAGE_ID: message.id || '',
                ROCKETCHAT_SENDER: message.sender.username || 'unknown'
            }
        };

        const request = {
            headers: {
                'Content-Type': 'application/json'
            },
            content: JSON.stringify(requestData)
        };

        try {
            const response = await http.post(url, request);
            
            if (response.statusCode >= 200 && response.statusCode < 300) {
                this.getLogger().info(`GitLab pipeline triggered successfully. Status: ${response.statusCode}`);
            } else {
                this.getLogger().error(`Failed to trigger GitLab pipeline. Status: ${response.statusCode}, Response: ${response.content}`);
            }
        } catch (error) {
            this.getLogger().error('Error triggering GitLab pipeline:', error);
        }
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
        modify: IModify
    ): Promise<void> {
        // Skip if no text or no @ mentions
        if (!message.text || !message.text.includes('@')) {
            return;
        }

        // Check for bot mentions - detect @ai_deepseek and @ai_qwen
        const botMentionPattern = /@(?:ai_deepseek|ai_qwen)(?:\s|$|[^a-zA-Z0-9._-])/i;
        
        if (!botMentionPattern.test(message.text)) {
            return; // No bot mentioned, skip
        }

        // Prevent infinite loops by not responding to our own messages
        const appUser = await read.getUserReader().getAppUser();
        if (appUser && message.sender.id === appUser.id) {
            return;
        }

        // Get channel information
        const channelName = message.room.displayName || message.room.slugifiedName || 'unknown';
        const channelTopic = message.room.description || 'no topic set';
        
        // Extract bot name from the message
        const botName = this.extractBotName(message.text);
        
        // Trigger GitLab pipeline if configured
        await this.triggerGitLabPipeline(message, channelName, channelTopic, botName, http);
        
        // Create response message with the original message content, ID, channel name and topic
        const responseText = `🤖 Bot mentioned! Received message: "${message.text}" with ID: ${message.id || 'unknown'}\nChannel: ${channelName}\nTopic: ${channelTopic}`;
        
        const builder = modify.getCreator().startMessage()
            .setRoom(message.room)
            .setText(responseText);

        try {
            await modify.getCreator().finish(builder);
            this.getLogger().info(`Responded to bot mention in room: ${channelName} (${message.room.id})`);
        } catch (error) {
            this.getLogger().error('Failed to send response message:', error);
        }
    }
}

// Export for CommonJS compatibility (required by RocketChat Apps Engine)
module.exports = { AiBotApp };