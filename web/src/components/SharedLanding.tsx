import React from 'react'
import { RouteComponentProps } from 'react-router';

export interface IProps extends RouteComponentProps<any> {
    token: string;
}

interface IState {
    tokenValid?: boolean;
}

export default class SharedLanding extends React.Component<IProps, IState> {
    state: IState = {
        tokenValid: undefined
    }
    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        console.log(this.props.token);
        
        this.validateToken();
    }

    validateToken() {
        // TODO query server
        setTimeout(() => {
            this.state.tokenValid = this.props.token == '563b952ec30fb6ebd48a598f4246ab0334cf70c90d93f48b1f410d814436438a';
            this.setState(this.state);
            
            localStorage.setItem('token', this.props.token)

            const tokenRedirect = `/g-jozsef`;

            if (this.state.tokenValid) {
                setTimeout(() => {
                    this.props.history.push(tokenRedirect);
                }, 1000);
            }
        }, 1000);
    }

    render() {
        return (
            <div>
                {this.renderTokenValidity()}
            </div>
        )
    }
    renderTokenValidity() {
        if(this.state.tokenValid == undefined) {
            return <p>Checking Token ... </p>
        } else if (this.state.tokenValid) {
            return <p>Token valid, redirecting... </p>
        } else {
            return <p>Token expired or invalid, please contact your source </p>
        }
    }
}