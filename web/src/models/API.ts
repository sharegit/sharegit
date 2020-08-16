import config from '../config'
import axios, {AxiosResponse, AxiosRequestConfig, AxiosError, CancelToken as AxiosCancelToken} from 'axios'

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

export interface RepoObj {
    type: 'tree' | 'blob';
    path: string;
    author: string;
    lastmodifydate: string;
    lastmodifycommitmessage: string;
}
export interface BlobResult {
    file: string;
    content: string;
}
export interface AuthResult {
    token: string;
}
export interface DashboardResponse {
    name: string;
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
    static get<T = any>(request: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);

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
    static getRepositories(owner: string, cancelToken: CancelToken): Promise<RepositoriesResponse> {
        const request = `${config.apiUrl}/repo/${owner}`;
        return new Promise((resolve, reject) => {
            this.get<RepositoriesResponse>(request, cancelToken)
            .then((res) => {
                resolve(res.data);
            })
            .catch(() => {
                reject();
            });
        });
    }
    static getBranches(owner: string, repo: string, cancelToken: CancelToken): Promise<String[]> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/branches`;
        return new Promise<String[]>((resolve, reject) => {
            this.get<String[]>(request,  cancelToken)
                .then((res) => {
                    resolve(res.data);
                })
                .catch(() => {
                    reject();
                });
        })
    }
    static getRepoTree(owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<RepoObj[]> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/tree/${sha}/${uri}`;
        return new Promise<RepoObj[]>((resolve, reject) => {
            this.get<RepoObj[]>(request,  cancelToken )
            .then((res) => {
                resolve(res.data);
            })
            .catch(() => {
                reject();
            });
        });
    }
    static getRepoBlob(owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<BlobResult> {
        const request = `${config.apiUrl}/repo/${owner}/${repo}/blob/${sha}/${uri}`;
        return new Promise<BlobResult>((resolve, reject) => {
            this.get<BlobResult>(request, cancelToken)
            .then((res) => {
                resolve(res.data);
            })
            .catch(()=> {
                reject();
            })
        })
    }
    static getSharedRepositories(token: string, cancelToken: CancelToken): Promise<SharedRepository[]> {
        const request = `${config.apiUrl}/share/${token}`;
        return new Promise<SharedRepository[]>((resolve, reject) => {
            this.get<SharedRepository[]>(request, cancelToken)
            .then((res) => {
                resolve(res.data);
            })
            .catch(() => {
                reject();
            })
        })
    }
    static auth(code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const request = `${config.apiUrl}/auth/${code}/${state}`;
        return new Promise<AuthResult>((resolve, reject) => {
            this.get<AuthResult>(request, cancelToken)
            .then((res) => {
                resolve(res.data);
            })
            .catch(() => {
                reject();
            })
        })
    }
    static fetchDashboardEssential(cancelToken: CancelToken): Promise<DashboardResponse> {
        const request = `${config.apiUrl}/dashboard`;
        return new Promise<DashboardResponse>((resolve, reject) => {
            this.get<DashboardResponse>(request, cancelToken)
            .then((res) => {
                resolve(res.data);
            })
            .catch(() => {
                reject();
            })
        })
    }
}