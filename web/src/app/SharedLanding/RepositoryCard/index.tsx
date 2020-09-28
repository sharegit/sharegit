import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import GetAppIcon from 'assets/icons/get-app.svg';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './style.scss';
import GithubMark from 'assets/icons/github-mark-dark.png'
import GitlabMark from 'assets/icons/gitlab-mark.png'
import BitbucketMark from 'assets/icons/bitbucket-mark.svg'
import CustomIcon from 'components/CustomIcon';

interface IState { }

interface IProps {
    link: string;
    target?: undefined | '_blank';
    name: string;
    description: string;
    downloadable: boolean;
    provider: 'github' | 'gitlab' | 'bitbucket';
    deselected?: boolean;
}

export default class RepositoryCard extends React.Component<IProps, IState> {

    getProviderIcon() {
        switch (this.props.provider) {
            case 'github':
                return <CustomIcon src={GithubMark} />
            case 'gitlab':
                return <CustomIcon src={GitlabMark} />
            case 'bitbucket':
                return <CustomIcon src={BitbucketMark} />
        }
    }

    render() {
        return (
            <ListItem
                className={`${styles.repositoryCard} ${this.props.deselected != undefined ? styles.deselected : ''}`}
                button
                component={Link}
                target={this.props.target}
                to={this.props.link}
            >
                <ListItemIcon>
                    {this.getProviderIcon()}
                </ListItemIcon>
                <ListItemText
                    primary={
                        <React.Fragment>
                            {this.props.name}
                            {this.props.downloadable ? <CustomIcon src={GetAppIcon} /> : null}
                        </React.Fragment>
                    }
                    secondary={this.props.description}
                />
            </ListItem >
        )
    }
}