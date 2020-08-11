import React from 'react'
import { List } from 'semantic-ui-react'
import { Link } from 'react-router-dom';

interface IState {}

interface IProps {
    link: string;
    name: string;
    private: boolean;
    description: string;
    provider: string;
}

export default class RepositoryCard extends React.Component<IProps, IState> {
    render() {
        return (
            <List.Item>
                <List.Content>
                    <List.Header as='a'>
                        <Link to={this.props.link}>{this.props.name}</Link>
                    </List.Header>
                    <List.Description>{this.props.description}</List.Description>
                </List.Content>
            </List.Item>
        )
    }
}