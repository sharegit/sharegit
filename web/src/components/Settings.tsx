import React from 'react';
import { Form, Button, FormProps, Segment, Icon } from 'semantic-ui-react';
import { BaseState } from '../models/BaseComponent';
import API, { SettingsReponse } from '../models/API';
import Dictionary from '../util/Dictionary';
import config from '../config';
import styles from '../styles/Settings.scss';
import Random from '../util/Random';


interface IState extends BaseState {
    state: string;
    originalSettings?: SettingsReponse;
    changedSettings: Dictionary<string>;
}

export default class Settings extends React.Component {
    state: IState = {
        originalSettings: undefined,
        changedSettings: {},
        cancelToken: API.aquireNewCancelToken(),
        state: this.constructState(),
    }
    constructState(): string {
        return btoa(JSON.stringify({
            t: Random.str(64),
            d: config.isDev,
            addToAccount: true
        }));
    }
    async componentDidMount() {
        localStorage.setItem('oauthState', this.state.state);

        this.state.originalSettings = await API.getSettings(this.state.cancelToken);
        this.setState(this.state);
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    onValueChange(target: string, value: string) {
        this.state.changedSettings[target] = value;
        if(this.state.originalSettings != undefined)
            this.state.originalSettings.displayName = value;
        this.setState(this.state);
    }
    async onSubmit(event: React.FormEvent<HTMLFormElement>, data: FormProps) {
        console.log(this.state.changedSettings);
        // todo: validate settings
        const settings = this.state.changedSettings as SettingsReponse;
        await API.updateSettings(settings, this.state.cancelToken);
    }
    render() {
        if(this.state.originalSettings == undefined) {
            return(
                <p>Loading...</p>
            );
        } else {
            return (
                <div>
                    <Segment className={styles.segment}>
                        <h2>Account settings</h2>
                        <Form onSubmit={async (e, d) => {
                            await this.onSubmit(e, d)
                        }}>
                            <Form.Field id="displayname">
                                <label>Display Name</label>
                                <input id="displayname" value={this.state.originalSettings.displayName} onChange={(e) => {
                                    this.onValueChange(e.target.id, e.target.value);
                                }} placeholder='Display Name' />
                            </Form.Field>
                            <Button primary type='submit'>Save</Button>
                        </Form>
                    </Segment>
                    <Segment className={styles.segment}>
                        <h2>Connected services</h2>
                        {this.state.originalSettings.githubConnected ? 
                            <Button disabled>
                                <Icon name='github'></Icon>
                                Connected with Github
                            </Button>
                        :
                            <Button
                                as='a'
                                primary
                                href={`https://github.com/login/oauth/authorize?client_id=${config.github_auth.client_id}&redirect_uri=${config.github_auth.redirect_uri}&state=${this.state.state}`}>
                                    <Icon name='github'></Icon>
                                    Authenticate with Github
                            </Button>
                        }
                        {this.state.originalSettings.gitLabConnected ? 
                            <Button disabled>
                                <Icon name='gitlab'></Icon>
                                Connected with GitLab
                            </Button>
                        :
                            <Button
                            as='a'
                            primary
                            href={`https://gitlab.com/oauth/authorize?client_id=${config.gitlab_auth.client_id}&redirect_uri=${config.gitlab_auth.redirect_uri}&response_type=code&state=${this.state.state}&scope=read_user+read_repository+read_api`}>
                                    <Icon name='gitlab'></Icon>
                                    Authenticate with GitLab
                            </Button>
                        }
                        {this.state.originalSettings.bitbucketConnected ? 
                            <Button disabled>
                                <Icon name='bitbucket'></Icon>
                                Connected with Bitbucket
                            </Button>
                        :
                            <Button
                            as='a'
                            primary
                            href={`https://bitbucket.org/site/oauth2/authorize?client_id=${config.bitbucket_auth.client_id}&response_type=code&state=${this.state.state}`}>
                                    <Icon name='bitbucket'></Icon>
                                    Authenticate with Bitbucket
                            </Button>
                        }
                    </Segment>
                </div>
            );
        }
    }
}