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
import { SettingId, settings } from './config/Settings';

export class GitlabCreateIssueApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
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

        // Check for bot mentions and extract bot name - detect @ai_deepseek and @ai_qwen
        const botMentionMatch = text.match(/@(ai_deepseek|ai_qwen)(?:\s|$|[^a-zA-Z0-9._-])/i);
        if (!botMentionMatch) {
            return; // No bot mentioned, skip
        }

        // Get channel information
        const channelName = (room && (room.displayName || room.slugifiedName)) || 'unknown';
        const channelTopic = (room && room.description) || 'no-topic';
        const botName = botMentionMatch[1]; // Extract bot name from match: ai_deepseek or ai_qwen
        // Create GitLab issue with the message content
        await this.createGitLabIssue(message, channelName, channelTopic, botName, http, read, modify);
    }



    /**
     * Fetches GitLab user ID by username
     * @param username The username to look up
     * @param gitlabUrl The GitLab instance URL
     * @param token The GitLab access token
     * @param http HTTP accessor for making requests
     * @param tlsVerify Whether to verify TLS certificates
     * @returns The user ID if found, null otherwise
     */
    private async getGitLabUserIdByUsername(
        username: string,
        gitlabUrl: string,
        token: string,
        http: IHttp,
        tlsVerify: boolean,
    ): Promise<number | null> {
        const url = `${gitlabUrl}/api/v4/users?username=${encodeURIComponent(username)}`;

        const request = {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            strictSSL: tlsVerify,
            rejectUnauthorized: tlsVerify,
        };

        try {
            const response = await http.get(url, request);

            if (response.statusCode >= 200 && response.statusCode < 300) {
                const users = JSON.parse(response.content || '[]');
                if (users.length > 0) {
                    this.getLogger().info(`Found GitLab user ID ${users[0].id} for username: ${username}`);
                    return users[0].id;
                } else {
                    this.getLogger().warn(`GitLab user not found for username: ${username}`);
                    return null;
                }
            } else {
                this.getLogger().error(`Failed to fetch GitLab user. Status: ${response.statusCode}, Response: ${response.content}`);
                return null;
            }
        } catch (error) {
            this.getLogger().error('Error fetching GitLab user:', error);
            return null;
        }
    }

    /**
     * Creates GitLab issue if app settings are configured
     * @param message The original message
     * @param channelName The channel name
     * @param channelTopic The channel topic
     * @param botName The mentioned bot name
     * @param http HTTP accessor for making requests
     * @param read Read accessor for app settings
     * @param modify Modify accessor for creating responses
     */
    private async createGitLabIssue(
        message: IMessage,
        channelName: string,
        channelTopic: string,
        botName: string,
        http: IHttp,
        read: IRead,
        modify?: IModify,
    ): Promise<void> {
        const settings = read.getEnvironmentReader().getSettings();
        
        const enabled = await settings.getValueById(SettingId.GITLAB_CREATE_ISSUE_ENABLED);
        if (!enabled) {
            return;
        }

        const projectId = await settings.getValueById(SettingId.GITLAB_PROJECT_ID);
        const token = await settings.getValueById(SettingId.GITLAB_ACCESS_TOKEN);
        const gitlabUrl = await settings.getValueById(SettingId.GITLAB_URL);
        const tlsVerify = await settings.getValueById(SettingId.GITLAB_TLS_VERIFY);

        if (!projectId || !token || !gitlabUrl) {
            this.getLogger().warn('GitLab issue creation is enabled but required settings are missing');
            return;
        }

        const url = `${gitlabUrl}/api/v4/projects/${projectId}/issues`;

        // Generate issue title from message and context
        const issueTitle = `【${channelTopic}/${channelName}/bot-created from ${botName}】`;

        // Use ONLY the bot message content as the issue description
        const issueDescription = message.text || '';

	const issueLabel1 = `issue-tag-${channelTopic}`;
	const issueLabel2 = `issue-tag-${channelName}`;

        // Fetch GitLab user ID for the bot name
        const assigneeId = await this.getGitLabUserIdByUsername(botName, gitlabUrl, token, http, tlsVerify);
        
        const requestData: any = {
            title: issueTitle,
            description: issueDescription,
            labels: [issueLabel1, issueLabel2],
        };

        // Only add assignee_ids if we successfully found a user
        if (assigneeId !== null) {
            requestData.assignee_ids = [assigneeId];
        }

        const request = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            content: JSON.stringify(requestData),
            strictSSL: tlsVerify,
            rejectUnauthorized: tlsVerify,
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
