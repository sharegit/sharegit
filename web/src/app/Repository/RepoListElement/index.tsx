import React from 'react';
import { Link } from 'react-router-dom';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import FileIcon from 'assets/icons/file.svg';
import FolderIcon from 'assets/icons/folder.svg';

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
                return <CustomIcon src={FolderIcon} />;
            case 'blob':
                return <CustomIcon src={FileIcon} />;
        }
    }
    renderSlot(path: string) {
        return (
            <ListItem
                button
                component={Link}
                to={`/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${this.state.type}/${this.props.sha}/${this.props.path}?token=${this.props.token}`}>
                <ListItemIcon>
                    {this.typeToIcon(this.state.type)}
                </ListItemIcon>
                <ListItemText
                    primary={ path }
                    secondary={this.props.lastCommitMessage} />
            </ListItem>
        )
    }
}