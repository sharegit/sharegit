import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, List } from 'semantic-ui-react';
import styles from './style.scss';

interface IState { }

interface IProps {
    link: string;
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
                        <Link to={this.props.link}>
                            {this.props.name}
                        </Link>
                        {this.props.downloadable ? <Icon name='download'></Icon> : null}
                    </List.Header>
                    <List.Description>{this.props.description}</List.Description>
                    {this.props.children}
                </List.Content>
            </List.Item>
        )
    }
}