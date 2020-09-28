import API from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import style from './style.scss';
import ConfirmDialog from 'components/ConfirmDialog';
import { Button } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import DeleteIcon from 'assets/icons/delete.svg'

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
                <Button onClick={() => {
                    this.setState({confirmAccountDeletion: true});
                }}>
                    <CustomIcon src={DeleteIcon}></CustomIcon>
                    Delete my account
                </Button>

                <ConfirmDialog
                    open={this.state.confirmAccountDeletion}
                    onCancel={() => this.setState({confirmAccountDeletion: false})}
                    onConfirm={async () => {
                        try {
                            await API.startDeleteAccount(this.state.cancelToken);
                            this.setState({confirmAccountDeletion: false})
                        } catch (e) {
                            if (!API.wasCancelled(e)) {
                                throw e;
                            }
                        }
                    }}
                    header='Confirm Account deletion'
                    content='An email confirmation will be sent to your provided email address. Please follow the instructions described there to completely remove your account from our services.'
                    cancelLabel='Cancel'
                    confirmLabel="Send Email confirmation">
                </ConfirmDialog>
            </div>
        )
    }
}