import React from 'react';
import style from './style.scss';

export default class Footer extends React.Component {
    render() {
        return(
            <div id={style.footer}>
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
            </div>
        );
    }
}