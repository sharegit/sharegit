import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

interface IProps extends RouteComponentProps<any>  {
    logout: () => void;
}


export default class Logout extends React.Component<IProps> {
    componentDidMount() {
        localStorage.removeItem('OAuthJWT');
        localStorage.removeItem('OAuthJWT-exp');
        this.props.logout();
        this.props.history.push('/');
    }
    render() {
        return (
            <h2>You are now logged out!</h2>
        )
    }
}