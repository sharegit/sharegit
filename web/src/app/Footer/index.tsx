import React from 'react';
import style from './style.scss';
import { Row, Col } from 'react-bootstrap';

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
                                    Terms of Service
                                </li>
                                <li>
                                    Privacy Policy
                                </li>
                            </ul>
                        </div>
                    </footer>
                </Col>    
            </Row>
        );
    }
}