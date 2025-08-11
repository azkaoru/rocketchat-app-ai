import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';

export class GitlabTriggerPipelineApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }


    /**
     * Handle when a message is sent
     */
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        // Skip messages from the app itself to prevent loops
        const appUser = await read.getUserReader().getAppUser();
        if (!appUser || message.sender.id === appUser.id) {
            return;
        }

        const sender = message.sender;
        const room = message.room;
        const text = message.text || ''; 


    }
/**
     * Extracts the bot name from a message text
     * @param text The message text
     * @returns The extracted bot name or 'unknown'
     */
    private extractBotName(text: string | undefined): string {
        if (!text || typeof text !== 'string') {
            return 'unknown';
        }
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
                ROCKETCHAT_MESSAGE: (message && message.text) || '',
                ROCKETCHAT_CHANNEL_NAME: channelName,
                ROCKETCHAT_TOPIC: channelTopic,
                ROCKETCHAT_BOT_NAME: botName,
                ROCKETCHAT_MESSAGE_ID: (message && message.id) || '',
                ROCKETCHAT_SENDER: (message && message.sender && message.sender.username) || 'unknown'
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


}
