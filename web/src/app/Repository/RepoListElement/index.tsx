import React from 'react';
import { Link } from 'react-router-dom';
import { List } from 'semantic-ui-react';

interface IProps {
    provider: string;
    id: number;
    user: string;
    repo: string;
    sha: string;
    path: string;
    type: 'tree' | 'blob' | 'dir' | 'file';
    lastCommitMessage: string;
    lastModifyDate: string;
    author: string;
    token: string;
}

interface IState {
    type: 'tree' | 'blob'
}

export default class RepoListElement extends React.Component<IProps, IState> {
    state: IState = {
        type: 'tree'
    }
    constructor(props: IProps) {
        super(props)
        switch(props.type) {
            case 'tree':
            case 'dir':
                this.state.type = 'tree';
                break;
            case 'file':
            case 'blob':
                this.state.type = 'blob';
                break;
        }
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
                <List.Icon name={this.typeToIcon(this.state.type)} size='large' verticalAlign='middle'>
                </List.Icon>
                <List.Content>
                    <Link to={`/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${this.state.type}/${this.props.sha}/${this.props.path}?token=${this.props.token}`} >
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