import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import styles from './style.scss';
import Authentication from 'app/Authentication';
import FeatureCard from './FeatureCard';
import TargetCard from './TargetCard';
import DonationCard from './DonationCard';
import ContentPanel from 'components/ContentPanel';
import GithubMark from 'assets/icons/github-mark-light.png'
import GitlabMark from 'assets/icons/gitlab-mark.png'
import BitbucketMark from 'assets/icons/bitbucket-mark.svg'
import CustomIcon from 'components/CustomIcon';
import PeopleIcon from 'assets/icons/landing/people.svg'
import PrivateIcon from 'assets/icons/landing/private.svg'
import DownloadIcon from 'assets/icons/landing/download.svg'
import CameraIcon from 'assets/icons/landing/camera.svg'
import { Grid } from '@material-ui/core';

interface IProps extends RouteComponentProps<any> {

}
interface IState {

}

export default class Landing extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <div id={styles.landing} className='page'>
                <ContentPanel background='gradient'>
                    <Grid item md='auto' className={styles.auth}>
                        <Authentication
                            id={styles.signUp}
                            history={this.props.history}
                            match={this.props.match}
                            location={this.props.location}
                            mode='signup'
                            />
                    </Grid>
                    <Grid item md='auto' className={styles.cta}>
                        <div id={styles.title}>
                            <h1><b>Share Your Repositories</b></h1>
                            <ul>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={GithubMark}></CustomIcon>GitHub</li>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={GitlabMark}></CustomIcon>GitLab</li>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={BitbucketMark}></CustomIcon>Bitbucket</li>
                            </ul>
                            <span><b>ShareGit</b> enables you to connect to multiple Git providers and <b>share</b> your <b>private repositories</b> with a link.</span>
                        </div>
                    </Grid>
                </ContentPanel>
                <ContentPanel background='light'>
                    <FeatureCard
                        header='With anyone'
                        icon={<CustomIcon size='fill-w-100' src={PeopleIcon}/>}
                        text='Select your repositories from GitHub, GitLab or Bitbucket and create a sharable link. Anyone with the link can browse the repositories you selected. No registration required.'/>
                    <hr />
                    <FeatureCard
                        header='Snapshots'
                        icon={<CustomIcon size='fill-w-100' src={CameraIcon}/>}
                        text='Share a snapshot of any branch or commit. As long as you keep your history, your snapshots will be shared as they were at the time of sharing..'/>
                    <hr />
                    <FeatureCard
                        header='Private repositories'
                        icon={<CustomIcon size='fill-w-80' src={PrivateIcon}/>}
                        text='Share private repositories from GitHub, GitLab or Bitbucket.  Browsing is only available through your link.'/>
                    <hr />
                    <FeatureCard
                        header='Downloadable shares'
                        icon={<CustomIcon size='fill-w-100' src={DownloadIcon}/>}
                        text='Optionally allow anyone with the link to also download your whole repository from GitHub.'/>
                </ContentPanel>
                <ContentPanel background='dark' alignItems='flex-start'>
                    <TargetCard
                        header={<span>For <b>students</b></span>}
                        text='Share private homeworks and courseworks with your teachers, professors and supervisors.' />
                    <TargetCard
                        header={<span>For <b>applicants</b></span>}
                        text='Share your portfolio of projects with your future employer.' />
                    <TargetCard
                        header={<span>For <b>contractors</b></span>}
                        text='Share WIP projects with those clients who should have read-only access-limitation.' />
                </ContentPanel>
                <ContentPanel background='light'>
                    <DonationCard />
                </ContentPanel>
            </div>
        );
    }
}