import API from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Button, Confirm, Icon } from 'semantic-ui-react';
import style from './style.scss';

interface IState extends BaseState {
    confirmAccountDeletion: boolean;
}
export interface IProps {

}

export default class DangerZone extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            confirmAccountDeletion: false
        }
    }
    async componentDidMount() {
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div id={style.dangerZone}>
                <Button primary onClick={() => {
                    this.setState({confirmAccountDeletion: true});
                }}>
                    <Icon name='delete'></Icon>
                    Delete my account
                </Button>

                <Confirm
                    open={this.state.confirmAccountDeletion}
                    onCancel={() => this.setState({confirmAccountDeletion: false})}
                    onConfirm={async () => {
                        await API.startDeleteAccount(this.state.cancelToken);
                        this.setState({confirmAccountDeletion: false})
                    }}
                    header='Confirm Account deletion'
                    content='An email confirmation will be sent to your provided email address. Please follow the instructions described there to completely remove your account from our services.'
                    cancelButton='Cancel'
                    confirmButton="Send Email confirmation">
                </Confirm>
            </div>
        )
    }
}