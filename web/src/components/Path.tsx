import React, { ReactElement } from 'react'
import { Breadcrumb } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

interface IState { }

interface IProps {
    provider: string;
    id: number;
    user: string;
    repo: string;
    sha: string;
    path: string;
    type: 'tree' | 'blob';
}

export default class Path extends React.Component<IProps, IState> {

    private build(): ReactElement<typeof Breadcrumb.Section>[] {
        let path = this.props.path.split('/')

        if (path.length == 1) {
            return [<Breadcrumb.Section key={path[0]} active>{path[0]}</Breadcrumb.Section>]
        }

        let link = `/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${'tree'}/${this.props.sha}/`
        let crums: ReactElement<typeof Breadcrumb.Section>[] =
            [<Breadcrumb.Section key={path[0]}><Link to={link}>{path[0]}</Link></Breadcrumb.Section>]

        path = path.slice(1)

        while (path.length > 0) {
            if (path.length == 1) {
                crums.push(<Breadcrumb.Section key={`${path[0]}_${path.length}`} active>{path[0]}</Breadcrumb.Section>)
                path = path.slice(1)
            } else {
                link = `${link}${path[0]}/`
                crums.push(<Breadcrumb.Section key={`${path[0]}_${path.length}`}><Link to={link}>{path[0]}</Link></Breadcrumb.Section>)
                path = path.slice(1)
            }
        }

        return crums
    }

    render() {
        return (
            <Breadcrumb>
                {this.build().map((content) =>
                    <React.Fragment key={content.key}>
                        <Breadcrumb.Divider />
                        {content}
                    </React.Fragment>
                )}
                {
                    this.props.type == 'tree' ? <Breadcrumb.Divider /> : null
                }
            </Breadcrumb>
        )
    }
}
