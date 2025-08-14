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

export class GitlabCreateIssueApp extends App implements IPostMessageSent {
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
        modify: IModify,
    ): Promise<void> {
        // Skip messages from the app itself to prevent loops
        const appUser = await read.getUserReader().getAppUser();
        if (!appUser || message.sender.id === appUser.id) {
            return;
        }

        const sender = message.sender;
        const room = message.room;
        const text = message.text || '';

        // Check for bot mentions - detect @ai_deepseek and @ai_qwen
        const botMentionPattern = /@(?:ai_deepseek|ai_qwen)(?:\s|$|[^a-zA-Z0-9._-])/i;
        if (!botMentionPattern.test(text)) {
            return; // No bot mentioned, skip
        }

        // Get channel information
        const channelName = (room && (room.displayName || room.slugifiedName)) || 'unknown';
        const channelTopic = (room && room.description) || 'no topic set';
        const botName = this.extractBotName(text);

        // Create GitLab issue with the message content
        await this.createGitLabIssue(message, channelName, channelTopic, botName, http, modify);
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
     * Creates GitLab issue if environment variables are configured
     * @param message The original message
     * @param channelName The channel name
     * @param channelTopic The channel topic
     * @param botName The mentioned bot name
     * @param http HTTP accessor for making requests
     * @param modify Modify accessor for creating responses
     */
    private async createGitLabIssue(
        message: IMessage,
        channelName: string,
        channelTopic: string,
        botName: string,
        http: IHttp,
        modify?: IModify,
    ): Promise<void> {
        // Check if process and process.env are available
        if (typeof process === 'undefined' || !process.env) {
            this.getLogger().warn('Environment variables are not accessible (process.env is undefined)');
            return;
        }

        const enabled = process.env.GITLAB_CREATE_ISSUE_ENABLED;
        if (enabled !== 'true') {
            return;
        }

        const projectId = process.env.GITLAB_PROJECT_ID;
        const token = process.env.GITLAB_ACCESS_TOKEN;
        const gitlabUrl = process.env.GITLAB_URL;

        if (!projectId || !token || !gitlabUrl) {
            this.getLogger().warn('GitLab issue creation is enabled but required environment variables are missing');
            return;
        }

        const url = `${gitlabUrl}/api/v4/projects/${projectId}/issues`;

        // Generate issue title from message and context
        const issueTitle = `Bot Message from ${channelName}: ${botName}`;

        // Use ONLY the bot message content as the issue description
        const issueDescription = message.text || '';

        const requestData = {
            title: issueTitle,
            description: issueDescription,
            labels: ['rocketchat-bot', 'auto-generated'],
            assignees: [botName],
        };

        const request = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            content: JSON.stringify(requestData),
        };

        try {
            const response = await http.post(url, request);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                this.getLogger().info(`GitLab issue created successfully. Status: ${response.statusCode}`);

                // Parse response to get issue details
                let issueUrl = 'unknown';
                try {
                    const responseData = JSON.parse(response.content || '{}');
                    issueUrl = responseData.web_url || `${gitlabUrl}/${projectId}/issues/${responseData.iid || ''}`;
                } catch (parseError) {
                    this.getLogger().warn('Could not parse GitLab response for issue URL');
                }

                this.getLogger().info(`Issue created at: ${issueUrl}`);
                
                // Send the GitLab issue URL back to the user
                if (modify && message.room && issueUrl !== 'unknown') {
                    const responseText = `🎫 GitLab issue created: ${issueUrl}`;
                    const builder = modify.getCreator().startMessage()
                        .setRoom(message.room)
                        .setText(responseText);

                    try {
                        await modify.getCreator().finish(builder);
                        this.getLogger().info(`Sent GitLab issue URL to user in room: ${channelName}`);
                    } catch (error) {
                        this.getLogger().error('Failed to send GitLab issue URL message:', error);
                    }
                }
            } else {
                this.getLogger().error(`Failed to create GitLab issue. Status: ${response.statusCode}, Response: ${response.content}`);
            }
        } catch (error) {
            this.getLogger().error('Error creating GitLab issue:', error);
        }
    }
}
