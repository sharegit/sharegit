import React, { ComponentProps } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Nav, NavDropdown } from 'react-bootstrap';

interface IProps extends ComponentProps<any> {
    loginRequired?: any;
    logoutRequired?: any;
    uri: string;
    isLoggedIn: boolean;
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
                    <LinkContainer to={this.props.uri}>
                        <NavDropdown.Item>
                            {this.props.children}
                        </NavDropdown.Item>
                    </LinkContainer>
                )
            } else {
                return (
                    <LinkContainer to={this.props.uri}>
                        <Nav.Link>
                            {this.props.children}
                        </Nav.Link>
                    </LinkContainer>
                )
            }
            
        } else {
            return null;
        }
    }
}