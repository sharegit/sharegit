import React from 'react';
import {  Button, Segment, Icon, Confirm } from 'semantic-ui-react';
import { BaseState } from '../models/BaseComponent';
import API from '../models/API';
import styles from '../styles/Settings.scss';
import { RouteComponentProps } from 'react-router-dom';


interface IState extends BaseState {
    accountDeletionOpen: boolean;
}

export interface IProps extends RouteComponentProps<any> {
    logout: () => void;
    token: string;
}

export default class ConfirmAccountDeletion extends React.Component<IProps, IState> {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        accountDeletionOpen: false
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div>
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
                        await API.deleteAccount(this.props.token, this.state.cancelToken);
                        localStorage.removeItem('OAuthJWT');
                        this.props.logout();
                        this.props.history.push('/');
                        this.state.accountDeletionOpen = false;
                        this.setState(this.state);
                    }}
                    header='Account deletion'
                    content='I understand this this action is irreversible and will result the complete termination of my account and all my shared links will stop working.'
                    cancelButton='Cancel'
                    confirmButton="Delete!">
                </Confirm>
            </div>
        );
    }
}