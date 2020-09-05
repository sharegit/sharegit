import React from 'react';
import { Link } from 'react-router-dom';
import NavMenuItem from './NavMenuItem';
import styles from './style.scss';

interface IProps {
    isLoggedIn: boolean;
}

export default class Header extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <nav>
                <Link id={styles.logo} to="/">
                    <img className={styles.logo} src='/static/img/logo_big_w.png' alt='logo'/>
                </Link>

                <div id={styles.leftMenu}>
                    <ul>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share"></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share">Shared with me</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                    </ul>
                </div>

                <div id={styles.rightMenu}>
                    <ul>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard/settings">Settings</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                    </ul>
                </div>

                <div className="clear"></div>
            </nav>
        )
    }
}