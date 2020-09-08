import API, { PublicProfileSettings } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Button, Form, FormProps, Icon, Message } from 'semantic-ui-react';
import styles from '../style.scss';
import FormTextField from 'components/FormTextField';
import Dictionary from 'util/Dictionary';

interface IState extends BaseState {
    original?: PublicProfileSettings;
    delta: PublicProfileSettings;
    errors: Dictionary<string>;
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
            delta: {},
            errors: new Dictionary()
        }
    }
    async componentDidMount() {
        try {
            const publicProfileSettings = await API.getSettingsPublicProfile(this.state.cancelToken);
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
                await API.setSettingsPublicProfile(this.state.delta, this.state.cancelToken);
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

    changeDisplayName(id: string, newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            if (newValue.length == 0)
                state.errors.put(id, 'Please enter your display name');
            else 
                state.errors.remove(id);

            state.delta.displayName = newValue;
            state.original.displayName = newValue;
            return state;
        })
    }    
    changeUrl(id: string, newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            const re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
                
            if (!re.test(newValue.toLowerCase()))
                state.errors.put(id, 'Please enter a valid URL');
            else
                state.errors.remove(id);

            state.delta.url = newValue;
            state.original.url = newValue;
            return state;
        })
    }
    changeBio(id: string, newValue: string) {
        this.setState(state => {
            if(state.original == undefined)
                return state;

            if(newValue.length > 200)
                state.errors.put(id, `Bio length cannot exceed 200 characters, current length: ${newValue.length}`)
            else 
                state.errors.remove(id);

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
                        <FormTextField  
                            id='display-name'
                            type='field'
                            label='Display Name'
                            error={this.state.errors.get('display-name')}
                            value={this.state.original.displayName}
                            onChanged={this.changeDisplayName.bind(this)}
                            placeholder='John Smith'
                            description='The name that will be displayed on your shared repositories.'
                         />
                        <FormTextField  
                            id='url'
                            type='field'
                            label='Webite Url'
                            error={this.state.errors.get('url')}
                            value={this.state.original.url}
                            onChanged={this.changeUrl.bind(this)}
                            placeholder='https://example.com'
                            description='Your website URL that will be displayed next to your shared repositories.'
                         />
                        <FormTextField  
                            id='bio'
                            type='area'
                            label='Bio'
                            error={this.state.errors.get('bio')}
                            value={this.state.original.bio}
                            onChanged={this.changeBio.bind(this)}
                            placeholder='John Smith'
                            description='Short description of yourself. This will be displayed next to your shared repositories.'
                         />
                        <Button primary type='submit'>Save</Button>
                    </Form>
                </div>
            )
        }
    }

}