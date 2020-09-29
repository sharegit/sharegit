import ContentPanel from 'components/ContentPanel';
import API, { Analytic, SharedToken } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import style from './style.scss';
import Dictionary from 'util/Dictionary';
import { Grid } from '@material-ui/core';

interface IState extends BaseState {
    name: string;
    analytics: Analytic[];
    activeTokenIndex: number;
    tokens: Dictionary<SharedToken>;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Dashboard extends React.Component<IProps, IState>  {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        name: '',
        activeTokenIndex: -1,
        analytics: [],
        tokens: new Dictionary<SharedToken>()
    }
    constructor(props: IProps) {
        super(props);
    }
    async componentDidMount() {
        const essentialsRequest = API.fetchDashboardEssential(this.state.cancelToken)
        const analyticsRequest = API.getAnalytics(this.state.cancelToken)
        const tokensRequest = API.getSharedTokens(this.state.cancelToken)

        const essentials = await essentialsRequest;
        
        const tokens = (await tokensRequest).toDictionary(x=>x.token, x=>x);
        
        const analytics = await analyticsRequest;
        this.setState({
            name: essentials.name,
            tokens: tokens,
            analytics: analytics.analytics
                                .filter(x => tokens.get(x.token) != undefined)
                                .sort((a, b) => {
                                    if (a.uniquePageViews > b.uniquePageViews)
                                        return -1;
                                        else if (a.uniquePageViews < b.uniquePageViews)
                                        return 1;
                                        else if (a.pageViews > b.pageViews)
                                        return -1;
                                        else if (a.pageViews < b.pageViews)
                                        return 1;
                                        else
                                        return 0;
                                })
        });
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }
    renderAnalyticLine(analytic: Analytic) {
        const token = this.state.tokens.get(analytic.token);
        if (token != undefined) {
            return (
                <li key={analytic.token}>{token.customName == undefined ? token.token : token.customName}: unique ({analytic.uniquePageViews}) | clicks ({analytic.pageViews})</li>
            )
        } else {
            return null;
        }
    }
    render() {
        return (
            <div id={style.dashboard}>
                <ContentPanel background='light'>
                    <Grid item container direction='column'>
                        <h2>
                            Dashboard
                        </h2>
                        <p>Hello {this.state.name}</p>
                        <h2>Analytics</h2>
                        <p>The values here are not exact, they could take up to 24 hours to update.</p>
                        <ul>
                            {this.state.analytics.map(x=> this.renderAnalyticLine(x))}
                        </ul>
                    </Grid>
                </ContentPanel>
            </div>
        )
    }
}
