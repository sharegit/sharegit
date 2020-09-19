import { GetApp } from '@material-ui/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, List } from 'semantic-ui-react';
import styles from './style.scss';

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
    render() {
        return (
            <List.Item className={`${styles.repositoryCard} ${this.props.deselected != undefined ? styles.deselected : ''}`}>
                <List.Icon name={this.props.provider} size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {this.props.link.startsWith('https://') ?
                            <a href={this.props.link} target="_blank">
                                {this.props.name}
                            </a>
                            :
                            <Link target={this.props.target} to={this.props.link}>
                                {this.props.name}
                            </Link>}
                        {this.props.downloadable ? <GetApp /> : null}
                    </List.Header>
                    <List.Description>{this.props.description}</List.Description>
                    {this.props.children}
                </List.Content>
            </List.Item>
        )
    }
}