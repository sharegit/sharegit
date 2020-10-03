import React from 'react';
import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

interface IProps {
    active?: boolean;
    headerMessage: string;
    style: 'warning' | 'positive';
    onClose?: () => void;
}

interface IState {
    active?: boolean;
    internalUpdate?: boolean;
}

export default class DismissableMessage extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            active: props.active !== false
        }
    }
    static getDerivedStateFromProps(nextProps: Readonly<IProps>, prevState: IState): Partial<IState> | null {
        if (prevState.internalUpdate)
            return {
                internalUpdate: undefined
            };
        
        return {
            active: nextProps.active !== false
        }
    }
    getSeverity() {
        switch (this.props.style) {
            case 'positive':
                return 'success';
            case 'warning':
                return 'warning';
        }
    }
    render() {
        if (this.state.active) {
            return (
                <Snackbar className={this.props.style}
                    anchorOrigin={{ vertical: 'top', horizontal:'center' }}
                    open={this.state.active}
                    autoHideDuration={6000}
                    onClose={(event) => {
                        event.preventDefault();
                        this.setState({active: undefined, internalUpdate: true})
                        if (this.props.onClose)
                            this.props.onClose();
                    }}>
                    <Alert onClose={(event) => {
                        event.preventDefault();
                        this.setState({active: undefined, internalUpdate: true})
                        if (this.props.onClose)
                            this.props.onClose();
                     }} severity={this.getSeverity()}>
                        {this.props.headerMessage}
                    </Alert>
                </Snackbar>
            )
        } else {
            return null;
        }
    }
}