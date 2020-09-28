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
import { Col } from 'react-bootstrap';

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
            <div id={styles.landing}>
                <ContentPanel background='gradient'>
                    <Col md='auto'>
                        <Authentication
                            id={styles.signUp}
                            history={this.props.history}
                            match={this.props.match}
                            location={this.props.location}
                            mode='signup'
                            />
                    </Col>
                    <Col md='auto'>
                        <div id={styles.title}>
                            <h1><b>Share Your Repositories</b></h1>
                            <ul>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={GithubMark}></CustomIcon>GitHub</li>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={GitlabMark}></CustomIcon>GitLab</li>
                                <li className={styles.shareprovider}><CustomIcon size='large' src={BitbucketMark}></CustomIcon>Bitbucket</li>
                            </ul>
                            <span><b>ShareGit</b> enables you to connect to multiple Git providers and <b>share</b> your <b>private repositories</b> with a link.</span>
                        </div>
                    </Col>
                </ContentPanel>
                <ContentPanel background='light'>
                    <FeatureCard
                        header='With anyone'
                        icon={<svg width="99" height="69" viewBox="0 0 99 69" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M69.7835 6.2977L68.8176 7.52389C69.7834 10.058 70.2663 12.8374 70.2663 15.862C70.2663 18.0691 69.9444 20.2354 69.3005 22.3608L69.6626 22.606L69.1798 22.8513L68.4553 24.5679L73.4055 28.737V28.8596C80.086 35.6445 83.4262 43.86 83.4262 53.506V53.6287V53.9965C86.8872 53.506 89.9861 52.4842 92.7227 50.931C96.8276 48.8056 98.88 46.1489 98.88 42.9608V42.8382C98.88 36.8707 96.8276 31.7616 92.7227 27.5108C90.63 25.3037 88.336 23.6687 85.8408 22.606C88.014 20.3171 89.1007 17.6195 89.1007 14.5132C89.1007 11.3251 88.014 8.58659 85.8408 6.2977C83.5871 4.00881 80.8908 2.86436 77.7518 2.86436C74.6932 2.86436 72.0372 4.00881 69.7835 6.2977Z" fill="#4A4A48"/>
                        <path d="M69.4212 32.906C67.3285 30.7806 65.0347 29.0231 62.5395 27.6334L60.3663 26.5298C63.1834 23.587 64.5919 20.031 64.5919 15.862C64.5919 11.5294 63.1432 7.85088 60.2456 4.82627C57.2675 1.71993 53.6857 0.166748 49.5003 0.166748C45.315 0.166748 41.7734 1.71993 38.8758 4.82627C35.8978 7.85088 34.4088 11.5294 34.4088 15.862C34.4088 20.031 35.8173 23.587 38.6344 26.5298L36.3405 27.6334C33.9258 29.0231 31.632 30.7806 29.4588 32.906C23.9856 38.6282 21.2489 45.4949 21.2489 53.506V53.6287V54.3644C21.5709 58.2882 24.3075 61.6397 29.4588 64.4191C35.0125 67.362 41.693 68.8334 49.5003 68.8334C57.3077 68.8334 63.948 67.362 69.4212 64.4191C74.653 61.6397 77.4298 58.2882 77.7518 54.3644V53.6287V53.506C77.7518 45.4949 74.9749 38.6282 69.4212 32.906Z" fill="#4A4A48"/>
                        <path d="M28.7344 15.862C28.7344 12.8374 29.2575 10.058 30.3038 7.52389L29.3381 6.2977C27.0844 4.00881 24.3879 2.86436 21.2489 2.86436C18.1099 2.86436 15.4136 4.00881 13.1599 6.2977C10.9867 8.58659 9.90001 11.3251 9.90001 14.5132C9.90001 17.6195 10.9867 20.3171 13.1599 22.606C10.5843 23.6687 8.29024 25.3037 6.27803 27.5108C2.09264 31.7616 0 36.8707 0 42.8382V42.9608C0.0804884 46.1489 2.17313 48.8056 6.27803 50.931C9.01464 52.4842 12.1135 53.506 15.5745 53.9965V53.506C15.5745 43.86 18.9147 35.6445 25.5952 28.8596V28.737C27.1245 27.1838 28.7747 25.7941 30.5454 24.5679L29.9417 22.9739L29.3381 22.606L29.7002 22.2382C29.0563 20.1945 28.7344 18.0691 28.7344 15.862Z" fill="#4A4A48"/>
                        </svg>}
                        text='Select your repositories from GitHub, GitLab or Bitbucket and create a sharable link. Anyone with the link can browse the repositories you selected. No registration required.'/>
                    <hr />
                    <FeatureCard
                        header='Snapshots'
                        icon={<svg width="81" height="71" viewBox="0 0 81 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40.5 51.1733C47.7055 51.1733 53.5467 45.4858 53.5467 38.4699C53.5467 31.4541 47.7055 25.7666 40.5 25.7666C33.2946 25.7666 27.4534 31.4541 27.4534 38.4699C27.4534 45.4858 33.2946 51.1733 40.5 51.1733Z" fill="#4A4A48"/>
                        <path d="M28.552 0.360107L21.2637 8.14233H8.63867C4.25774 8.14233 0.67334 11.6443 0.67334 15.9246V62.6179C0.67334 66.8981 4.25774 70.4001 8.63867 70.4001H72.3613C76.7423 70.4001 80.3267 66.8981 80.3267 62.6179V15.9246C80.3267 11.6443 76.7423 8.14233 72.3613 8.14233H59.7363L52.448 0.360107H28.552ZM40.5 58.7268C29.5078 58.7268 20.5867 50.0107 20.5867 39.2712C20.5867 28.5318 29.5078 19.8157 40.5 19.8157C51.4922 19.8157 60.4133 28.5318 60.4133 39.2712C60.4133 50.0107 51.4922 58.7268 40.5 58.7268Z" fill="#4A4A48"/>
                        </svg>}
                        text='Share a snapshot of any branch or commit. As long as you keep your history, your snapshots will be shared as they were at the time of sharing..'/>
                    <hr />
                    <FeatureCard
                        header='Private repositories'
                        icon={<svg width="77" height="91" viewBox="0 0 77 91" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M67.375 30.3333H62.5625V21.6667C62.5625 9.70667 51.7825 0 38.5 0C25.2175 0 14.4375 9.70667 14.4375 21.6667V30.3333H9.625C4.33125 30.3333 0 34.2333 0 39V82.3333C0 87.1 4.33125 91 9.625 91H67.375C72.6688 91 77 87.1 77 82.3333V39C77 34.2333 72.6688 30.3333 67.375 30.3333ZM38.5 69.3333C33.2062 69.3333 28.875 65.4333 28.875 60.6667C28.875 55.9 33.2062 52 38.5 52C43.7938 52 48.125 55.9 48.125 60.6667C48.125 65.4333 43.7938 69.3333 38.5 69.3333ZM53.4188 30.3333H23.5812V21.6667C23.5812 14.2567 30.2706 8.23333 38.5 8.23333C46.7294 8.23333 53.4188 14.2567 53.4188 21.6667V30.3333Z" fill="#4A4A48"/>
                        </svg>}
                        text='Share private repositories from GitHub, GitLab or Bitbucket.  Browsing is only available through your link.'/>
                    <hr />
                    <FeatureCard
                        header='Downloadable shares'
                        icon={<svg width="103" height="69" viewBox="0 0 103 69" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M83.0437 26.0475C80.1254 11.1694 67.1217 0 51.5 0C39.0971 0 28.325 7.0725 22.9604 17.4225C10.0425 18.8025 0 29.7994 0 43.125C0 57.3994 11.5446 69 25.75 69H81.5417C93.3867 69 103 59.34 103 47.4375C103 36.0525 94.2021 26.8237 83.0437 26.0475ZM72.9583 38.8125L51.5 60.375L30.0417 38.8125H42.9167V21.5625H60.0833V38.8125H72.9583Z" fill="#4A4A48"/>
                        </svg>}
                        text='Optionally allow anyone with the link to also download your whole repository from GitHub.'/>
                </ContentPanel>
                <ContentPanel background='dark'>
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