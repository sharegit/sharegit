import React from 'react';
import { Form, Button, FormProps } from 'semantic-ui-react';
import { BaseState } from '../models/BaseComponent';
import API, { SettingsReponse } from '../models/API';
import Dictionary from '../util/Dictionary';



interface IState extends BaseState {
    originalSettings?: SettingsReponse;
    changedSettings: Dictionary<string>;
}

export default class Settings extends React.Component {
    state: IState = {
        originalSettings: undefined,
        changedSettings: {},
        cancelToken: API.aquireNewCancelToken()
    }
    async componentDidMount() {
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
            );
        }
    }
}