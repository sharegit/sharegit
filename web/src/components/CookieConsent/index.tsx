import React from 'react';
import style from './style.scss';
import { Button } from 'semantic-ui-react';
import Cookies from 'universal-cookie';
import { Row, Col } from 'react-bootstrap';


interface IProps {
    onConsented: () => void;
}
interface IState {
    cookieDb: Cookies;
    remind?: boolean;
    consented: boolean;
    blocker: (e: MouseEvent) => void;
}

export default class CookieConsent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        const cookieDb = new Cookies();
        this.state = {
            cookieDb: cookieDb,
            consented: cookieDb.get('consented') != undefined,
            blocker: this.blocker.bind(this)
        }
        if(!this.state.consented)
            this.addBlocker();
    }
    blocker(e: MouseEvent) {
        const target = e.target as Element;
        if(target == undefined || target.classList == undefined || !target.classList.contains('consenter')) {
            e.stopPropagation();
            e.preventDefault();
            this.setState({remind: true});
        }
    }
    addBlocker() {
        document.addEventListener('click', this.state.blocker, true);
    }
    removeBlocker() {
        document.removeEventListener('click', this.state.blocker, true);
    }
    agree() {
        this.state.cookieDb.set('consented', 'full', {expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 730)});
        this.removeBlocker();
        this.setState({consented: true});
        this.props.onConsented();
    }
    disagree() {
        this.state.cookieDb.set('consented', 'essential', {expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30)});
        this.removeBlocker();
        this.setState({consented: true});
    }
    render() {
        if(this.state.consented) {
            return null;
        } else {
            return (
                    <Row id={style.cookieConsent} className={`justify-content-between fixed-bottom align-items-center ${this.state.remind === true ? style.remind : ''}`}>
                        <Col md='auto' className={`justify-content-md-left ${style.notice}`}>
                            <p>WebSite is in view-only mode. Please accept our Cookie Policy in order to continue browsing our website.</p>
                            <p>We use cookies also to gather statistics about the website in order to improve our services.</p>
                        </Col>
                        <Col md='auto' className={`${style.actions}`}>
                            <Row className='justify-content-md-center'>
                                <Col md='auto'>
                                    <Button id={style.agree} className='consenter' onClick={this.agree.bind(this)}>Consent to all cookies</Button>
                                </Col>
                            </Row>
                            <Row className='justify-content-md-center'>
                                <Col md='auto'>
                                    <Button id={style.disagree} className='consenter' onClick={this.disagree.bind(this)}>Continue with essential cookies only</Button>
                                </Col>
                            </Row>
                        </Col>
                </Row>
            );
        }
    }
}