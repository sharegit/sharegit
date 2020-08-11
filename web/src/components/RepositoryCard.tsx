import React from 'react'
import { List } from 'semantic-ui-react'
import { Link } from 'react-router-dom';

interface IState {}

interface IProps {
    link: string;
    name: string;
    private: boolean;
    description: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
}

export default class RepositoryCard extends React.Component<IProps, IState> {
    render() {
        return (
            <List.Item>
                <List.Icon name={this.props.provider} size='large' verticalAlign='middle'/>
                <List.Content>
                    <List.Header>
                        <Link to={this.props.link}>{this.props.name}</Link>
                    </List.Header>
                    <List.Description>{this.props.description}</List.Description>
                </List.Content>
            </List.Item>
        )
    }
}