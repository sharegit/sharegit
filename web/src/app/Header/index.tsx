import { Grid, Button, Tooltip } from '@material-ui/core';
import AddCircle from 'assets/icons/add-circle.svg';
import ShareGitLogo from 'assets/icons/logo_light.svg';
import CustomIcon from 'components/CustomIcon';
import DropdownMenu from 'components/DropdownMenu';
import { Token, compareTokens, prettyRemainingTime } from 'models/Tokens';
import React from 'react';
import { Link } from 'react-router-dom';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import NavMenuItem from './NavMenuItem';
import style from './style.scss';
import GlobalEvent from 'util/GlobalEvent';
import printDate from 'util/Date';

interface IProps {
    isLoggedIn: boolean;
    
}

interface RepoMinInfo {
    sharer: string;
    link: string;
    expDate?: Date;
    customName: string;
    repos: string;
}

interface IState {
    repos: Array<RepoMinInfo>;
    missingCount: number;
    sharedListUpdated: GlobalEvent;
}

export default class Header extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            repos: [],
            missingCount: 0,
            sharedListUpdated: new GlobalEvent('sharedListUpdated')
        };
    }
    componentDidMount() {
        this.updateRepositories();
        
        this.state.sharedListUpdated.addListener(this.updateRepositories.bind(this));
    }
    componentWillUnmount() {
        this.state.sharedListUpdated.removeListener();
    }
    updateRepositories() {
        const tokens = new LocalStorageDictionary<Token>('alltokens');
        const sharedWithMe = tokens.getAll();
        this.setState({
            missingCount: Math.max(0, sharedWithMe.length - 6),
            repos: sharedWithMe.sort(compareTokens).slice(0, 6).map(x => {
                return {
                    sharer: x.author,
                    customName: x.customName,
                    expDate: x.tokenExp,
                    link: '/share/' + x.token,
                    repos: x.repositories.map(x=>`${x.owner}/${x.name}${!!x.path ? '/'+x.path : ''}`).join(',').substr(0, 40) + '...'
                };
        })});
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
                <Grid xs={8} item container direction='row' justify='flex-end' alignItems='center' className={style.menu}> 
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} loginRequired uri="/create"><CustomIcon src={AddCircle}></CustomIcon></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/auth"><Button>Login</Button></NavMenuItem>
                    <NavMenuItem isLoggedIn={this.props.isLoggedIn} logoutRequired uri="/signup"><Button>Register</Button></NavMenuItem>

                    <DropdownMenu buttonClassName={style.menu} className={style.menuItem} buttonHeader='Shared with me'>
                        {this.state.repos.map(x=>
                            <NavMenuItem key={x.link} isInDropdown uri={x.link} className={style.repoLink}>
                                <div>
                                    <div className={style.repoLink}>
                                        {x.sharer}'s "{x.customName}"
                                    </div>
                                    {x.expDate != undefined &&
                                        <div className={style.exp}>
                                            Expires in
                                            <Tooltip title={printDate(x.expDate)}>
                                                <span>
                                                    {prettyRemainingTime(x.expDate)}
                                                </span>
                                            </Tooltip>
                                        </div>}
                                    <div className={style.repoList}>
                                        {x.repos}
                                    </div>
                                </div>
                            </NavMenuItem>
                        )}
                        <NavMenuItem className={style.action} isInDropdown uri='/share'>
                            <div>
                                Manage links shared with me
                            </div>
                            {this.state.missingCount > 0 && 
                            <div>
                                {`${this.state.missingCount} More ...`}
                            </div>}
                        </NavMenuItem>
                    </DropdownMenu>
                    {this.props.isLoggedIn && 
                        <DropdownMenu buttonClassName={style.menu} className={style.menuItem} buttonHeader='My Account'>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/">My Shares</NavMenuItem>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/settings">Settings</NavMenuItem>
                            <NavMenuItem isInDropdown isLoggedIn={this.props.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                        </DropdownMenu>}
                </Grid>
            </Grid>
        )
    }
}