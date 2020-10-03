import React from 'react';
import style from './style.scss';
import Cookies from 'universal-cookie';
import { Button, Grid } from '@material-ui/core';

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
                <Grid container item direction='row' justify="space-between" alignItems="center"  id={style.cookieConsent} className={`${this.state.remind === true ? style.remind : ''}`}>
                    <Grid xs={8} item className={style.notice}>
                        <p>WebSite is in view-only mode. Please accept our Cookie Policy in order to continue browsing our website.</p>
                        <p>We use cookies also to gather statistics about the website in order to improve our services.</p>
                    </Grid>
                    <Grid xs={4} container item direction='column' justify="center" alignItems="flex-end"  className={`${style.actions}`}>
                        <Grid container item direction='column' justify='center' alignItems='center'>
                            <Grid item>
                                <Button id={style.agree} className='consenter' onClick={this.agree.bind(this)}><span className='consenter'>Consent to all cookies</span></Button>
                            </Grid>
                            <Grid item>
                                <Button id={style.disagree} className='consenter' onClick={this.disagree.bind(this)}><span className='consenter'>Continue with essential cookies only</span></Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            );
        }
    }
}