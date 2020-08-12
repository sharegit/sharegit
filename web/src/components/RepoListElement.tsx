import React from 'react'
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
        return ( <Link to={`/${this.props.user}/${this.props.repo}/${this.props.type}/${this.props.sha}/${this.props.path}/`}>{this.renderSlot(path)}</Link> );
    }
    renderSlot(path: string) {
        return (
            <div>
                <span>{path}</span>
                &nbsp;
                <span>{this.props.lastCommitMessage}</span>
                &nbsp;
                <span>{this.props.author}</span>
                &nbsp;
                <span>{this.props.lastModifyDate}</span>
            </div>
        )
    }
}