import React from 'react';
import { RouteComponentProps, Route, Redirect } from 'react-router-dom';
import ContentPanel from 'components/ContentPanel';
import ToS from './ToS/inrdex';
import Privacy from './Privacy';
import Cookies from './Cookies';

interface IProps extends RouteComponentProps<any> {

}

export default class Legal extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
        console.log(props);
    }
    render() {
        return(
            <div>
            <ContentPanel background='light'>
                <Route exact path={`${this.props.match.path}`}>
                    <Redirect to={`${this.props.match.path}/tos`} />
                </Route>

                <Route exact path={`${this.props.match.path}/tos`} component={ToS} />
                <Route exact path={`${this.props.match.path}/privacy`} component={Privacy} />
                <Route exact path={`${this.props.match.path}/cookies`} component={Cookies} />
            </ContentPanel>
            </div>
        )
    }
}