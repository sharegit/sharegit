import API, { PublicProfileSettings } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Button, Form, FormProps, Icon, Message } from 'semantic-ui-react';
import styles from '../style.scss';

interface IState extends BaseState {
    original?: PublicProfileSettings;
    delta: PublicProfileSettings;
}

interface IProps {
    successCallback: () => void;
    failCallback: () => void;
}

export default class PublicProfile extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            delta: {}
        }
    }
    async componentDidMount() {
        const publicProfileSettings = await API.getSettingsPublicProfile(this.state.cancelToken);
        this.setState({original: publicProfileSettings});
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    async onSubmit(e: React.FormEvent<HTMLFormElement>, d: FormProps) {
        try {
            e.preventDefault();
            await API.setSettingsPublicProfile(this.state.delta, this.state.cancelToken);
            this.props.successCallback();
        } catch(e) {
            this.props.failCallback();
        }
    }

    changeDisplayName(newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            state.delta.displayName = newValue;
            state.original.displayName = newValue;
            return state;
        })
    }    
    changeUrl(newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            state.delta.url = newValue;
            state.original.url = newValue;
            return state;
        })
    }
    changeBio(newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            state.delta.bio = newValue;
            state.original.bio = newValue;
            return state;
        })
    }
    
    render() {
        if (this.state.original == undefined){
            return (
                <Message icon>
                     <Icon name='circle notched' loading />
                     <Message.Content>
                     <Message.Header>Just one second</Message.Header>
                     Loading Settings.
                     </Message.Content>
                 </Message>
            )
        }
        else {
            return (
                <div>
                    <Form onSubmit={async (e, d) => {
                        await this.onSubmit(e, d)
                    }}>
                        <Form.Field id="displayName">
                            <label>Display Name</label>
                            <input id="displayName" value={this.state.original.displayName} onChange={(e) => {
                                this.changeDisplayName(e.target.value);
                            }} placeholder='Display Name' />
                            <span>The name that will be displayed on your shared repositories.</span>
                        </Form.Field>
                        <Form.Field id="url">
                            <label>URL</label>
                            <input id="url" value={this.state.original.url} onChange={(e) => {
                                this.changeUrl(e.target.value);
                            }} placeholder='URL' />
                            <span>Your website URL that will be displayed next to your shared repositories.</span>
                        </Form.Field>
                        <Form.Field id="bio">
                            <label>Bio</label>
                            <textarea id="bio" value={this.state.original.bio} onChange={(e) => {
                                this.changeBio(e.target.value);
                            }} placeholder='Bio' />
                            <span>Short description of yourself. This will be displayed next to your shared repositories.</span>
                        </Form.Field>
                        <Button primary type='submit'>Save</Button>
                    </Form>
                </div>
            )
        }
    }

}