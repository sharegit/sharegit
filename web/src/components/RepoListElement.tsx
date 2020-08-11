import React from 'react'
import { Link } from 'react-router-dom';

interface IProps {
    path: string;
    type: string;
    rooturi: string;
    updateParent: Function;
}

interface IState {}

export default class RepoListElement extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
    }

    render() {
        const slash = this.props.path.lastIndexOf('/');
        const path = slash > 0 ? this.props.path.substring(slash + 1, this.props.path.length) : this.props.path;
        if (this.props.type == "tree") {
            console.log(`Building link to ${this.props.path}`)
            return ( <Link to={`${this.props.rooturi}/${this.props.path}/`}>{path}</Link> );
        } else if (this.props.type == "blob") {
            return (<span> {path} </span>);
        } else {
            console.error(`Invalid file type found ${this.props.type}!`);
            return (<span></span>)
        }
    }
}