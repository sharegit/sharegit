import React from 'react';
import { Route, Redirect, RouteProps, RouteComponentProps } from 'react-router-dom';

interface IProps extends RouteProps  {
    isAuthenticated: boolean;
}

export default class ProtectedRoute extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        if (!this.props.isAuthenticated) {
            return(
                <Route {...this.props} component={(props: RouteComponentProps<any>) => (
                    <Redirect to={`/auth?redirect=${encodeURIComponent(`${props.location.pathname}${props.location.search}`)}`}/>
                )}/>
            );
        } else {
            return <Route {...this.props}/>;
        }
    }
}