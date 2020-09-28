import React from 'react';
import { Link } from 'react-router-dom';
import NavMenuItem from './NavMenuItem';
import styles from './style.scss';
import AddCircle from 'assets/icons/add-circle.svg';
import CustomIcon from 'components/CustomIcon';
import { Grid, AppBar } from '@material-ui/core';

interface IProps {
    isLoggedIn: boolean;
}

export default class Header extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <Grid id={styles.header} item container justify='space-between' alignItems='center'>
                <Grid item>
                    <Link id={styles.logo} to="/">
                        <img className={styles.logo} src='/static/img/logo_big_w.png' alt='logo'/>
                        ShareGit
                    </Link>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share"></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} uri="/share">Shared with me</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                </Grid>
                <Grid item> 
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/create"><CustomIcon src={AddCircle}></CustomIcon></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>

                    <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                    <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/shares">My Shares</NavMenuItem>
                    <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/settings">Settings</NavMenuItem>
                    
                    <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                </Grid>
            </Grid>
        )
    }
}