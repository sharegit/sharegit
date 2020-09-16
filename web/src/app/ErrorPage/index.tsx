import React from 'react'
import { Row, Col } from 'react-bootstrap'
import ContentPanel from 'components/ContentPanel'
import style from './style.scss';

export default class ErrorPage extends React.Component {
    render() {
        return (
            <ContentPanel background='gradient' id={style.errorPage}>
                <Col>
                    <h2>It doesn't look like anything to me</h2>
                    <p>The requested content cannot be found or you have no permission to view it.</p>
                </Col>
            </ContentPanel>
        )
    }
}