import React, { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '@material-ui/core';

interface IProps extends ComponentProps<any> {
    loginRequired?: any;
    logoutRequired?: any;
    uri: string;
    isLoggedIn?: boolean;
    type?: boolean;
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
            if(this.props.isInDropdown === true) {
                return (
                    <MenuItem>
                        <Link to={this.props.uri}>
                            {this.props.children}
                        </Link>
                    </MenuItem>
                )
            } else {
                return (
                    <Link to={this.props.uri}>
                        {this.props.children}
                    </Link>
                )
            }
            
        } else {
            return null;
        }
    }
}