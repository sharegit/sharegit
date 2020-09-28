import API, { AccountSettings } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Form, FormProps, Icon, Message, Button } from 'semantic-ui-react';
import styles from '../style.scss';
import Dictionary from 'util/Dictionary';
import FormTextField from 'components/FormTextField';

interface IState extends BaseState {
    original?: AccountSettings;
    delta: AccountSettings;
    errors: Dictionary<string>;
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
            delta: {},
            errors: new Dictionary()
        }
    }
    async componentDidMount() {
        try {
            const publicProfileSettings = await API.getSettingsAccount(this.state.cancelToken);
            this.setState({original: publicProfileSettings});
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    async onSubmit(e: React.FormEvent<HTMLFormElement>, d: FormProps) {
        try {
            e.preventDefault();
            if(this.state.errors.length == 0) {
                await API.setSettingsAccount(this.state.delta, this.state.cancelToken);
                this.props.successCallback();
            } else {
                this.props.failCallback();
            }
        } catch (e) {
            this.props.failCallback();
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }

    changeEmail(id: string, newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            
            if (!re.test(newValue.toLowerCase()))
                state.errors.put(id, 'Please enter a valid email address');
            else
                state.errors.remove(id);
            
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
                        <FormTextField  
                            id='email'
                            type='field'
                            label='Email'
                            error={this.state.errors.get('email')}
                            value={this.state.original.email}
                            onChanged={this.changeEmail.bind(this)}
                            placeholder='example@example.com'
                            description='Your private email address. This can only be seen by you 
                                and this is where you will receive notification emails 
                                form ShareGit.'
                         />
                        <Button primary type='submit'>Save</Button>
                    </Form>
                </div>
            )
        }
    }
}
