import React from 'react';
import { CircularProgress, Card } from '@material-ui/core';


export default class Loading extends React.Component {
    render() {
        return (
            <CircularProgress />
        )
    }
}