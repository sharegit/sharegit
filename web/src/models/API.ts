import config from '../config'
import axios, {AxiosResponse, AxiosRequestConfig, AxiosError, CancelToken as AxiosCancelToken} from 'axios'
import Mutex from '../util/Mutex';

export interface APIResponse<T = any> {
    data: T;
    statusCode: number;
}
export interface CancelToken {
    token: AxiosCancelToken,
    cancel: () => void
}

export interface SharedRepository {
    owner: string;
    repo: string;
    provider: 'github';
    description: string;
    snapshot: boolean;
    branches: Branch[];
}
export interface Repository {
    name: string;
    private: boolean;
    description: string;
}
export interface RepositoriesResponse {
    total_count: number;
    repositories: Repository[];
}
export interface BlobResult {
    file: string;
    content: string;
}
export interface TreeResult {
    treeNodes: TreeNode[];
}
export interface TreeNode {
    path: string;
    type: 'tree' | 'blob' | 'file' | 'dir';
    sha: string;
    author: string;
    lastModifyDate: string;
    lastModifyCommitMessage: string;
}
export interface AuthResult {
    token: string;
    exp: string;
}
export interface DashboardResponse {
    name: string;
}
export interface SharedToken {
    token: string;
}
export interface Branch {
    name: string;
    snapshot: boolean;
    sha: boolean;
}


export default class API {
    static aquireNewCancelToken(): CancelToken {
        return axios.CancelToken.source()
    }
    static populateDefaultRequest(cancelToken: CancelToken): AxiosRequestConfig {
        return {
            cancelToken: cancelToken.token,
            headers: {
                token: localStorage.getItem('token'),
                jwt: localStorage.getItem('OAuthJWT')
            }
        };
    }
    static mutex = new Mutex();
    static async checkJWT(cancelToken: CancelToken) {
        const exp = localStorage.getItem('OAuthJWT-exp')
        if (exp != undefined && parseInt(exp) < new Date().getTime() / 1000) {
            console.log('YES')
            await this.mutex.dispatch(async () => {
                console.log('IN_MUTEX')
                const exp2 = localStorage.getItem('OAuthJWT-exp')
                if (exp2 != undefined && parseInt(exp2) < new Date().getTime() / 1000) {
                    console.log('REFRESHING_TOKEN')
                    const axiosConfig: AxiosRequestConfig = this.populateDefaultRequest(cancelToken);
                    const result = await axios.get<AuthResult>(`${config.apiUrl}/auth/refreshtoken`, axiosConfig);
                    localStorage.setItem('OAuthJWT-exp', result.data.exp)
                    localStorage.setItem('OAuthJWT', result.data.token)
                }
            })
        }
    }
    static async get<T = any>(request: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);
        await this.checkJWT(cancelToken);

        const config: AxiosRequestConfig = this.populateDefaultRequest(cancelToken)
        if (additionalConfig != undefined)
            Object.assign(config, additionalConfig);
        return new Promise<APIResponse<T>>((resolve, reject) => {
            axios.get<T>(request, config)
            .then((res: AxiosResponse<T>) => {
                if(res.status >= 200 && res.status < 400) {
                    console.log(`Got a response for ${request} (${res.status})`)
                    resolve({
                        data: res.data,
                        statusCode: res.status
                    })
                } else {
                    console.error(`Error while requesting ${request} ${res.status}`)
                    reject();
                }
            })
            .catch((error) => {
                console.error(`Error while requesting ${request} ${error}`)
                reject();
            });
        });
    }
    static async post<T = any>(request: string, data: any, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);

        const config: AxiosRequestConfig = this.populateDefaultRequest(cancelToken)
        if (additionalConfig != undefined)
            Object.assign(config, additionalConfig);
        return new Promise<APIResponse<T>>((resolve, reject) => {
            axios.post<T>(request, data, config)
            .then((res: AxiosResponse<T>) => {
                if(res.status >= 200 && res.status < 400) {
                    console.log(`Got a response for ${request} (${res.status})`)
                    resolve({
                        data: res.data,
                        statusCode: res.status
                    })
                } else {
                    console.error(`Error while requesting ${request} ${res.status}`)
                    reject();
                }
            })
            .catch((error) => {
                console.error(`Error while requesting ${request} ${error}`)
                reject();
            });
        });
    }

    static async getData<T = any>(request: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<T> {
        const result = await this.get<T>(request, cancelToken)
        return result.data;
    }

    static async getBranches(owner: string, repo: string, cancelToken: CancelToken): Promise<Branch[]> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/branches`;
        return await this.getData<Branch[]>(request, cancelToken);
    }
    static async getSharedBranches(owner: string, repo: string, cancelToken: CancelToken): Promise<Branch[]> {
        const request = `${config.apiUrl}/share/branches/${owner}/${repo}`;
        return await this.getData<Branch[]>(request, cancelToken);
    }
    static async getRepoTree(owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<TreeNode[]> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/tree/${sha}/${uri}`;
        return await this.getData<TreeNode[]>(request, cancelToken);
    }
    static async getRepoBlob(owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<BlobResult> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/blob/${sha}/${uri}`;
        return await this.getData<BlobResult>(request, cancelToken);
    }
    static async getSharedRepositories(token: string, cancelToken: CancelToken): Promise<SharedRepository[]> {
        const request = `${config.apiUrl}/share/${token}`;
        return await this.getData<SharedRepository[]>(request, cancelToken);
    }
    static async auth(code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const request = `${config.apiUrl}/auth/${code}/${state}`;
        return await this.getData<AuthResult>(request, cancelToken);
    }
    static async fetchDashboardEssential(cancelToken: CancelToken): Promise<DashboardResponse> {
        const request = `${config.apiUrl}/dashboard`;
        return await this.getData<DashboardResponse>(request, cancelToken);
    }
    static async getSharedTokens(cancelToken: CancelToken): Promise<SharedToken[]> {
        const request = `${config.apiUrl}/dashboard/tokens`;
        return await this.getData<SharedToken[]>(request, cancelToken);
    }
    static async getMyRepos(cancelToken: CancelToken): Promise<SharedRepository[]> {
        const request = `${config.apiUrl}/dashboard/repos`;
        return await this.getData<SharedRepository[]>(request, cancelToken);
    }
    static async createToken(tokenCreation: any, cancelToken: CancelToken): Promise<SharedToken> {
        const request = `${config.apiUrl}/dashboard/createtoken`;
        return (await this.post<SharedToken>(request, tokenCreation, cancelToken)).data;
    }
    static async deleteToken(token: string, cancelToken: CancelToken): Promise<any> {
        const request = `${config.apiUrl}/dashboard/deletetoken/${token}`;
        return await this.post<any>(request, {}, cancelToken);
    }
}