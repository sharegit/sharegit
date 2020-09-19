import React from 'react';
import style from './style.scss';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default class Footer extends React.Component {
    render() {
        return(
            <Row className='flex-fill d-flex align-items-end'>
                <Col>
                    <footer id={style.footer} className='footer'>
                        <div id={style.content}>
                            <ul id={style.nav}>
                                <li>
                                    About
                                </li>
                                <li>
                                    Contact us
                                </li>
                                <li>
                                    Donate
                                </li>
                            </ul>
                            <span>Copyright notice</span>
                            <ul id={style.etc}>
                                <li>
                                    <Link to='/legal/privacy'>Privacy</Link>
                                </li>
                                <li>
                                    <Link to='/legal/tos'>Terms of Service</Link>
                                </li>
                                <li>
                                    <Link to='/legal/cookies'>Cookies</Link>
                                </li>
                            </ul>
                        </div>
                    </footer>
                </Col>    
            </Row>
        );
    }
}