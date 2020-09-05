import React, { ComponentProps } from 'react';
import { Link } from 'react-router-dom';

interface IProps extends ComponentProps<any> {
    loginRequired?: any;
    logoutRequired?: any;
    uri: string;
    isLoggedIn: boolean;
}
interface IState {

}

export default class NavMenuItem extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        if ((!(this.props.loginRequired != undefined) || this.props.isLoggedIn)
         && (!(this.props.logoutRequired != undefined) || !this.props.isLoggedIn)) {
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