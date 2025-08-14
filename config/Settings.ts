import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export const settings: Array<ISetting> = [
    {
        id: 'gitlab_create_issue_enabled',
        type: SettingType.BOOLEAN,
        packageValue: false,
        required: false,
        public: false,
        i18nLabel: 'Enable GitLab Issue Creation',
        i18nDescription: 'Enable creating GitLab issues when bot is mentioned',
    },
    {
        id: 'gitlab_project_id',
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'GitLab Project ID for Issues',
        i18nDescription: 'The GitLab project ID for creating issues',
    },
    {
        id: 'gitlab_access_token',
        type: SettingType.PASSWORD,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'GitLab Access Token',
        i18nDescription: 'The access token for GitLab API operations',
    },
    {
        id: 'gitlab_url',
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        i18nLabel: 'GitLab URL for Issues',
        i18nDescription: 'The GitLab instance URL for issue creation (e.g., https://gitlab.com)',
    },
    {
        id: 'gitlab_tls_verify',
        type: SettingType.BOOLEAN,
        packageValue: false,
        required: false,
        public: false,
        i18nLabel: 'GitLab TLS Certificate Verification',
        i18nDescription: 'Enable TLS certificate verification for GitLab API requests. Disable for self-signed certificates.',
    },
];

export enum SettingId {
    GITLAB_CREATE_ISSUE_ENABLED = 'gitlab_create_issue_enabled',
    GITLAB_PROJECT_ID = 'gitlab_project_id',
    GITLAB_ACCESS_TOKEN = 'gitlab_access_token',
    GITLAB_URL = 'gitlab_url',
    GITLAB_TLS_VERIFY = 'gitlab_tls_verify',
}