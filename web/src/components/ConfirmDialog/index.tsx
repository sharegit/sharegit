import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core';

interface IProps {
    open: boolean;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    header: React.ReactNode;
    content: React.ReactNode;
    cancelLabel: React.ReactNode;
    confirmLabel: React.ReactNode;
}

export default class ConfirmDialog extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);
    }

    render() {
        return(
            <Dialog
                open={this.props.open}
                onClose={() => this.props.onCancel()}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                >
                <DialogTitle id="alert-dialog-title">
                    {this.props.header}
                </DialogTitle>
                <DialogContent>
                    {this.props.content}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.props.onCancel()} color="primary">
                        {this.props.cancelLabel}
                    </Button>
                    <Button onClick={async () => await this.props.onConfirm()} color="primary" autoFocus>
                        {this.props.confirmLabel}
                    </Button>
                </DialogActions>
            </Dialog>
            
        )
    }
}