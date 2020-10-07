import React, { ReactNode } from 'react';
import style from './style.scss';
import { Button, Grid } from '@material-ui/core';

interface IProps {
}

export default class DonationCard extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render(): ReactNode {
        return (
            <Grid id={style.donationCard} item container direction='row'>
                <div className={style.piggy}>
                    <svg width="255" height="285" viewBox="0 0 255 285" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M38.4406 105.12C79.9443 72.7179 137.825 81.8644 160.455 91.6673C160.455 91.6673 160.455 87.4018 172.031 76.9629C183.606 66.5241 190.489 66.0129 190.489 66.0129V110.126C190.489 110.126 200.61 119.599 204.881 125.143C210.652 132.636 214.579 144.227 214.579 144.227C214.579 144.227 235.228 147.356 246.178 150.797C251.206 152.378 253.061 154.989 253.061 159.244V207.424C253.061 207.424 240.707 219.035 230.848 225.257C216.738 234.163 190.489 241.839 190.489 241.839V269.683C190.489 274.893 186.954 278.274 182.042 280.007C171.405 283.762 162.019 284.387 150.756 280.007C145.972 278.147 142.622 274.816 142.622 269.683V260.61C142.622 260.61 123.773 266.554 111.336 266.554C98.8997 266.554 80.0504 260.61 80.0504 260.61V269.683C80.0504 275.132 76.2667 277.953 70.6646 280.007C61.2789 283.449 49.7032 283.762 41.5689 280.007C36.9084 277.856 33.4346 274.816 33.4346 269.683V237.459C27.1778 234.643 9.97069 219.313 4.33908 193.346C-1.9225 164.474 2.77515 132.964 38.4406 105.12Z" fill="url(#paint0_linear)" stroke="black" strokeWidth="3"/>
                        <circle cx="174.221" cy="158.306" r="16.6457" fill="#F1F2EB" stroke="black" strokeWidth="3"/>
                        <circle cx="112.275" cy="29.4086" r="27.9086" fill="url(#paint1_radial)" stroke="black" strokeWidth="3"/>
                        <path d="M80.0507 116.383V100.427C80.0507 100.427 99.0309 96.7014 111.336 96.6729C123.885 96.6438 143.248 100.427 143.248 100.427V116.383C143.248 116.383 123.915 111.969 111.336 112.003C98.9994 112.036 80.0507 116.383 80.0507 116.383Z" fill="#F1F2EB" stroke="black" strokeWidth="3"/>
                        <defs>
                        <linearGradient id="paint0_linear" x1="2.14925" y1="174.574" x2="253.061" y2="174.574" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0BA14B"/>
                        <stop offset="1" stopColor="#009FB7"/>
                        </linearGradient>
                        <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(122.599 22.8386) rotate(106.011) scale(37.4306)">
                        <stop stopColor="#FFF500"/>
                        <stop offset="1" stopColor="#B0790F"/>
                        </radialGradient>
                        </defs>
                    </svg>
                </div>
                <div className={style.text}>
                    <h2>We are an open source project</h2>
                    <span><a href='https://github.com/sharegit/sharegit'>Check out ShareGit</a> on GitHub</span>
                    <p>If you like our services, please consider supporting us.</p>
                    <Button>Donate</Button>
                </div>
            </Grid>
        )
    }
}