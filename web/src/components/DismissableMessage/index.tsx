import React from 'react';
import { Message, MessageProps } from 'semantic-ui-react';

interface IProps {
    active?: boolean;
    headerMessage: string;
    style: 'warning' | 'positive';
}

interface IState {
    active?: boolean;
}

export default class DismissableMessage extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            active: props.active !== false
        }
    }
    render() {
        if (this.state.active) {
            return (
                <Message className={this.props.style}
                onDismiss={(event: React.MouseEvent<HTMLElement>, data: MessageProps) => {
                    event.preventDefault();
                    this.setState({active: undefined})
                }}
                header={this.props.headerMessage} />
            )
        } else {
            return null;
        }
    }
}