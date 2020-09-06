import API, { AccountSettings } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Form, FormProps, Icon, Message, Button } from 'semantic-ui-react';
import styles from '../style.scss';

interface IState extends BaseState {
    original?: AccountSettings;
    delta: AccountSettings;
}

interface IProps {
    successCallback: () => void;
    failCallback: () => void;
}

export default class Account extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            delta: {}
        }
    }
    async componentDidMount() {
        const publicProfileSettings = await API.getSettingsAccount(this.state.cancelToken);
        this.setState({original: publicProfileSettings});
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    async onSubmit(e: React.FormEvent<HTMLFormElement>, d: FormProps) {
        try {
            e.preventDefault();
            await API.setSettingsAccount(this.state.delta, this.state.cancelToken);
            this.props.successCallback();
        } catch(e) {
            this.props.failCallback();
        }
    }

    changeEmail(newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            state.delta.email = newValue;
            state.original.email = newValue;
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
                            <input id="displayName" value={this.state.original.email} onChange={(e) => {
                                this.changeEmail(e.target.value);
                            }} placeholder='Display Name' />
                            <span>Your private email address. This can only be seen by you 
                                and this is where you will receive notification emails 
                                form ShareGit.</span>
                        </Form.Field>
                        <Button primary type='submit'>Save</Button>
                    </Form>
                </div>
            )
        }
    }
}
