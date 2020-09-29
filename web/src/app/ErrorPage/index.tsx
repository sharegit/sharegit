import React from 'react'
import ContentPanel from 'components/ContentPanel'
import style from './style.scss';
import { Grid } from '@material-ui/core';

export default class ErrorPage extends React.Component {
    render() {
        return (
            <div id={style.errorPage}>
                <ContentPanel background='gradient' id={style.errorPage}>
                    <Grid item xs={12}>
                        <h2>It doesn't look like anything to me</h2>
                        <p>The requested content cannot be found or you have no permission to view it.</p>
                    </Grid>
                </ContentPanel>
            </div>
        )
    }
}