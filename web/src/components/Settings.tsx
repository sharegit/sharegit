import React from 'react';
import { Form, Button, FormProps, Segment, Icon, Confirm, Message } from 'semantic-ui-react';
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
    accountDeletionOpen: boolean;
    successfullSave?: boolean;
}

export default class Settings extends React.Component {
    state: IState = {
        originalSettings: undefined,
        changedSettings: {},
        cancelToken: API.aquireNewCancelToken(),
        state: this.constructState(),
        accountDeletionOpen: false
    }
    constructState(): string {
        return btoa(JSON.stringify({
            t: Random.str(64),
            d: config.isDev,
            m: 'add'
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
            switch (target) {
                case 'displayName':
                    this.state.originalSettings.displayName = value;
                    break;
                case 'email':
                    this.state.originalSettings.email = value;
                    break;
                case 'name':
                    this.state.originalSettings.name = value;
                    break;
            }
        this.setState(this.state);
    }
    async onSubmit(event: React.FormEvent<HTMLFormElement>, data: FormProps) {
        console.log(this.state.changedSettings);
        // todo: validate settings
        try {
            const settings = this.state.changedSettings as SettingsReponse;
            await API.updateSettings(settings, this.state.cancelToken);
            this.setState({successfullSave: true});
        } catch(e) {
            this.setState({successfullSave: false});
        }
    }
    render() {
        if(this.state.originalSettings == undefined) {
            return(
                <Message icon>
                    <Icon name='circle notched' loading />
                    <Message.Content>
                    <Message.Header>Just one second</Message.Header>
                    Loading Settings.
                    </Message.Content>
                </Message>
            );
        } else {
            return (
                <div>
                    {this.state.successfullSave == undefined ? 
                    null
                :
                    <Message className={`${this.state.successfullSave === false ? 'warning' : 'positive' }`}
                        onDismiss={() => this.setState({successfullSave: undefined})}
                        header={this.state.successfullSave === false ? 'An Unknown Error occurred during saving your settings!' : 'Successfully saved!'}
                    />
                    }
                    <Segment className={styles.segment}>
                        <h2>Account settings</h2>
                        <Form onSubmit={async (e, d) => {
                            await this.onSubmit(e, d)
                        }}>
                            <Form.Field id="name">
                                <label>Name</label>
                                <input id="name" value={this.state.originalSettings.name} onChange={(e) => {
                                    this.onValueChange(e.target.id, e.target.value);
                                }} placeholder='Name' />
                            </Form.Field>
                            <Form.Field id="displayName">
                                <label>Display Name</label>
                                <input id="displayName" value={this.state.originalSettings.displayName} onChange={(e) => {
                                    this.onValueChange(e.target.id, e.target.value);
                                }} placeholder='Display Name' />
                            </Form.Field>
                            <Form.Field id="email">
                                <label>Email address</label>
                                <input id="email" value={this.state.originalSettings.email} onChange={(e) => {
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
                    <Segment id={styles.dangerZone} className={styles.segment}>
                        <h2>Danger zone</h2>
                        <Button primary onClick={() => {
                            this.state.accountDeletionOpen = true;
                            this.setState(this.state);
                        }}>
                            <Icon name='delete'></Icon>
                            Delete my account
                        </Button>
                    </Segment>

                    <Confirm
                        open={this.state.accountDeletionOpen}
                        onCancel={() => {
                            this.state.accountDeletionOpen = false;
                            this.setState(this.state);
                        }}
                        onConfirm={async () => {
                            await API.startDeleteAccount(this.state.cancelToken);
                            this.state.accountDeletionOpen = false;
                            this.setState(this.state);
                        }}
                        header='Confirm Account deletion'
                        content='An email confirmation will be sent to your provided email address. Please follow the instructions described there to completely remove your account from our services.'
                        cancelButton='Cancel'
                        confirmButton="Send Email confirmation">
                    </Confirm>
                </div>
            );
        }
    }
}