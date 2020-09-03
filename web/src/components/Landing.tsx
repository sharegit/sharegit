import React from 'react';
import styles from '../styles/Landing.scss';
import { Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

interface IProps {

}
interface IState {

}

export default class Landing extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <div id={styles.landing}>
                <h2>Share and Browse GitHub, GitLab or Bitbucket repositories with ShareGit</h2>
                <Button primary>
                    <Link to='/signup'>
                        Get Started!
                    </Link>
                </Button>
            </div>
        );
    }
}