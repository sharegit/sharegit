import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

interface IProps extends RouteComponentProps<any> {
    githubConnected: boolean;
    gitlabConnected: boolean;
    bitbucketConnected: boolean;
}

export default class SettingsMenu extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <nav>
                <ul>
                    <li>
                        <Link to={`${this.props.match.path}/public`}>
                            Public
                        </Link>
                    </li>
                    <li>
                        <Link to={`${this.props.match.path}/account`}>
                            Account
                        </Link>
                    </li>
                    <li>
                        <Link to={`${this.props.match.path}/github`}>
                            {'GitHub Connection' + (!this.props.githubConnected ? '?' : '')}
                        </Link>
                    </li>
                    <li>
                        <Link to={`${this.props.match.path}/gitlab`}>
                            {'GitLab Connection' + (!this.props.gitlabConnected ? '?' : '')}
                        </Link>
                    </li>
                    <li>
                        <Link to={`${this.props.match.path}/bitbucket`}>
                            {'Bitbucket Connection' + (!this.props.bitbucketConnected ? '?' : '')}
                        </Link>
                    </li>
                    <li>
                        <Link to={`${this.props.match.path}/dangerzone`}>
                            Danger zone
                        </Link>
                    </li>
                </ul>
            </nav>
        )
    }
}