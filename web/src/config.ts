// TODO: consider moving to json: https://stackoverflow.com/questions/41482065/electron-my-custom-config-json-is-not-being-loaded

import config_base from './config.json'
import config_dev from './config.dev.json'
import config_prod from './config.prod.json'

const rawConf = config_base;

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    Object.assign(rawConf, config_dev);
} else {
    Object.assign(rawConf, config_prod);
}

export interface OAuthConfig {
    client_id: string;
    redirect_uri: string;
}

export interface AkroGamesConfig{
    apiUrl: string;
    github_auth: OAuthConfig;
    gitlab_auth: OAuthConfig;
    bitbucket_auth: OAuthConfig;
    isDev: boolean;
    share_uri: string;
}

const config: AkroGamesConfig = rawConf;

export default config;