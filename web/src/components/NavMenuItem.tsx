import React, { ComponentProps } from 'react';
import { Link } from 'react-router-dom';

interface IProps extends ComponentProps<any> {
    loginRequired?: any;
    logoutRequired?: any;
    uri: string;
}

export default class NavMenuItem extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        if ((!(this.props.loginRequired != undefined) || localStorage.getItem('OAuthJWT') != undefined)
         && (!(this.props.logoutRequired != undefined) || localStorage.getItem('OAuthJWT') == undefined)) {
            return (
                <li>
                    <Link to={this.props.uri}>
                        {this.props.children}
                    </Link>
                </li>
            )
        } else {
            return null;
        }
    }
}