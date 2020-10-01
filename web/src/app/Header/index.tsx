import { Grid } from '@material-ui/core';
import AddCircle from 'assets/icons/add-circle.svg';
import CustomIcon from 'components/CustomIcon';
import DropdownMenu from 'components/DropdownMenu';
import React from 'react';
import { Link } from 'react-router-dom';
import NavMenuItem from './NavMenuItem';
import style from './style.scss';
import ShareGitLogo from 'assets/icons/logo_light.svg';

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
                <Grid xs={4} item container direction='row' justify='flex-start' alignItems='center'>
                    <Grid item>
                        <Link className={style.logo} to="/">
                            <CustomIcon size='large' src={ShareGitLogo} />
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link className={style.logo} to="/">
                            ShareGit
                        </Link>
                    </Grid>
                </Grid>
                <Grid xs={8} item container direction='row' justify='flex-end' alignItems='center'> 
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/create"><CustomIcon src={AddCircle}></CustomIcon></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>

                    <DropdownMenu buttonClassName={style.menu} className={style.menuItem} buttonHeader='Shared with me'>
                        <NavMenuItem isInDropdown uri='/share'>Manage my sha</NavMenuItem>
                    </DropdownMenu>
                    {this.props.isLoggedIn && 
                        <DropdownMenu buttonClassName={style.menu} className={style.menuItem} buttonHeader='My Account'>
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