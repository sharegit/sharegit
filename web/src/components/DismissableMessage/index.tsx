import React from 'react';
import { Message, MessageProps } from 'semantic-ui-react';

interface IProps {
    active?: boolean;
    headerMessage: string;
    style: 'warning' | 'positive';
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
    render() {
        if (this.state.active) {
            return (
                <Message className={this.props.style}
                onDismiss={(event: React.MouseEvent<HTMLElement>, data: MessageProps) => {
                    event.preventDefault();
                    this.setState({active: undefined, internalUpdate: true})
                }}
                header={this.props.headerMessage} />
            )
        } else {
            return null;
        }
    }
}