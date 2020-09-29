import { Grid } from '@material-ui/core';
import AddCircle from 'assets/icons/add-circle.svg';
import CustomIcon from 'components/CustomIcon';
import DropdownMenu from 'components/DropdownMenu';
import React from 'react';
import { Link } from 'react-router-dom';
import NavMenuItem from './NavMenuItem';
import style from './style.scss';

interface IProps {
    isLoggedIn: boolean;
}
interface IState {
}

export default class Header extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = { };
    }
    render() {
        return (
            <Grid id={style.header} item container justify='space-between' alignItems='center'>
                <Grid item>
                    <Link id={style.logo} to="/">
                        <img className={style.logo} src='/static/img/logo_big_w.png' alt='logo'/>
                        ShareGit
                    </Link>
                </Grid>
                <Grid item> 
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/create"><CustomIcon src={AddCircle}></CustomIcon></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>

                    <DropdownMenu className={style.menu} buttonHeader='Shared with me'>
                        <NavMenuItem isInDropdown uri='/share'>Manage my sha</NavMenuItem>
                    </DropdownMenu>
                    {this.props.isLoggedIn && 
                        <DropdownMenu className={style.menu} buttonHeader='My Account'>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/shares">My Shares</NavMenuItem>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/settings">Settings</NavMenuItem>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                        </DropdownMenu>}
                </Grid>
            </Grid>
        )
    }
}