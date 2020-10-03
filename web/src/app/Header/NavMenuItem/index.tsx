import React, { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem, Grid } from '@material-ui/core';

interface IProps extends ComponentProps<any> {
    loginRequired?: any;
    logoutRequired?: any;
    uri: string;
    isLoggedIn?: boolean;
    type?: boolean;
    className?: string;
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
                    <MenuItem className={this.props.className} component={Link} to={this.props.uri}>
                        {this.props.children}
                    </MenuItem>
                )
            } else {
                return (
                    <Grid item className={this.props.className} component={Link} to={this.props.uri}>
                        {this.props.children}
                    </Grid>
                )
            }
            
        } else {
            return null;
        }
    }
}