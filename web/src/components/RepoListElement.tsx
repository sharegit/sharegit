import React from 'react'
import { List } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

interface IProps {
    user: string;
    repo: string;
    sha: string;
    path: string;
    type: 'tree' | 'blob';
    lastCommitMessage: string;
    lastModifyDate: string;
    author: string;
}

interface IState {}

export default class RepoListElement extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
    }

    render() {
        const slash = this.props.path.lastIndexOf('/');
        const path = slash > 0 ? this.props.path.substring(slash + 1, this.props.path.length) : this.props.path;
        console.log(`Building link to ${this.props.path}`)
        return this.renderSlot(path);
    }
    typeToIcon(type : 'tree' | 'blob') {
        switch(type) {
            case 'tree':
                return 'folder';
            case 'blob':
                return 'file';
            default:
                return 'info';
        }
    }
    renderSlot(path: string) {
        return (
            <List.Item>
                <List.Icon name={this.typeToIcon(this.props.type)} size='large' verticalAlign='middle'>
                </List.Icon>
                <List.Content>
                    <Link to={`/${this.props.user}/${this.props.repo}/${this.props.type}/${this.props.sha}/${this.props.path}/`} >
                    <List.Header>
                        <span>{path}</span>
                        &nbsp;
                        <span>{this.props.lastModifyDate}</span>
                    </List.Header>
                    <List.Description>
                        {this.props.lastCommitMessage}
                    </List.Description>
                    </Link>
                </List.Content>
            </List.Item>
        )
    }
}