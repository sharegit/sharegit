import ContentPanel from 'components/ContentPanel';
import API, { Analytic } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Segment } from 'semantic-ui-react';
import style from './style.scss';

interface IState extends BaseState {
    name: string;
    analytics: Analytic[];
    activeTokenIndex: number;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Dashboard extends React.Component<IProps, IState>  {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        name: '',
        activeTokenIndex: -1,
        analytics: []
    }
    constructor(props: IProps) {
        super(props);
    }
    async componentDidMount() {
        if (localStorage.getItem('OAuthJWT')) {
            const essentialsRequest = API.fetchDashboardEssential(this.state.cancelToken)
            const analyticsRequest = API.getAnalytics(this.state.cancelToken)

            const essentials = await essentialsRequest;
            this.state.name = essentials.name;
            this.setState(this.state);

            const analytics = await analyticsRequest;
            this.state.analytics = analytics.analytics;
            this.setState(this.state);
        } else {
            this.props.history.push(`/auth`);
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }
    render() {
        return (
            <ContentPanel background='light'>
                <div id={style.dashboard}>
                    <h2>
                        Dashboard
                    </h2>
                    <p>Hello {this.state.name}</p>
                    <Segment>
                        <h2>Analytics</h2>
                        <ul>
                            {this.state.analytics.map(x=> (
                                <li key={x.token}>{x.token}: unique ({x.uniquePageViews}) | clicks ({x.pageViews})</li>
                            ))}
                        </ul>
                    </Segment>
                </div>
            </ContentPanel>
        )
    }
}
