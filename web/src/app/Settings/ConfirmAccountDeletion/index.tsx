import API from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import styles from '../style.scss';
import ConfirmDialog from 'components/ConfirmDialog';
import { Button } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import DeleteIcon from 'assets/icons/delete.svg'


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
                <h2>Account deletion request</h2>
                <Button onClick={() => {
                    this.state.accountDeletionOpen = true;
                    this.setState(this.state);
                }}>
                    <CustomIcon src={DeleteIcon}></CustomIcon>
                    Delete my account
                </Button>

                <ConfirmDialog
                    open={this.state.accountDeletionOpen}
                    onCancel={() => {
                        this.state.accountDeletionOpen = false;
                        this.setState(this.state);
                    }}
                    onConfirm={async () => {
                        try {
                            await API.deleteAccount(this.props.token, this.state.cancelToken);
                            localStorage.removeItem('OAuthJWT');
                            this.props.logout();
                            this.props.history.push('/');
                            this.state.accountDeletionOpen = false;
                            this.setState(this.state);
                        } catch (e) {
                            if (!API.wasCancelled(e)) {
                                throw e;
                            }
                        }
                    }}
                    header='Account deletion'
                    content='I understand this this action is irreversible and will result the complete termination of my account and all my shared links will stop working.'
                    cancelLabel='Cancel'
                    confirmLabel="Delete!">
                </ConfirmDialog>
            </div>
        );
    }
}