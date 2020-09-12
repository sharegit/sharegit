import React from 'react';
import { Link } from 'react-router-dom';
import NavMenuItem from './NavMenuItem';
import styles from './style.scss';
import { Icon } from 'semantic-ui-react';
import { Navbar, Nav, NavDropdown, Row, Col } from 'react-bootstrap';

interface IProps {
    isLoggedIn: boolean;
}

export default class Header extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <Row>
                <Col>
                    <div id={styles.header}>
                        <Navbar collapseOnSelect expand="md">
                            <Navbar.Brand>
                                <Link id={styles.logo} to="/">
                                    <img className={styles.logo} src='/static/img/logo_big_w.png' alt='logo'/>
                                    ShareGit
                                </Link>
                            </Navbar.Brand>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                <Nav className="mr-auto">
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share"></NavMenuItem>
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share">Shared with me</NavMenuItem>
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                                </Nav>
                                <Nav>
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/create"><Icon name='plus circle'></Icon></NavMenuItem>
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>
                                    {this.props.isLoggedIn &&
                                        <NavDropdown title='Account' id="basic-nav-dropdown">
                                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/shares">My Shares</NavMenuItem>
                                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/settings">Settings</NavMenuItem>
                                            <NavDropdown.Divider />
                                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                                        </NavDropdown>}
                                </Nav>
                            </Navbar.Collapse>
                        </Navbar>
                    </div>
                </Col>
            </Row>
        )
    }
}