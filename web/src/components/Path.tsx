import React, { ReactElement } from 'react'
import { Breadcrumb } from 'semantic-ui-react'

interface IState { }

interface IProps {
    user: string;
    repo: string;
    sha: string;
    path: string;
    type: 'tree' | 'blob';
}

export default class Path extends React.Component<IProps, IState> {

    private buildInit(): ReactElement<typeof Breadcrumb.Section>[] {
        let path = this.props.path.split('/')

        if (path.length == 1) {
            return [<Breadcrumb.Section active>{path[0]}</Breadcrumb.Section>]
        }

        let link = `/repo/${this.props.user}/${this.props.repo}/${'tree'}/${this.props.sha}/`
        let crums: ReactElement<typeof Breadcrumb.Section>[] = [<Breadcrumb.Section link href={link}>{path[0]}</Breadcrumb.Section>]

        path = path.slice(1)

        while (path.length > 0) {
            if (path.length == 1) {
                crums.push(<Breadcrumb.Section active>{path[0]}</Breadcrumb.Section>)
                path = path.slice(1)
            } else {
                link = `${link}${path[0]}/`
                crums.push(<Breadcrumb.Section link href={link}>{path[0]}</Breadcrumb.Section>)
                path = path.slice(1)
            }
        }

        return crums
    }

    render() {
        return (
            <Breadcrumb>
                {this.buildInit().map((content: any, index: number, array: any[]) =>
                    <React.Fragment>
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
