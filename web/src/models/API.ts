import config from '../config'
import axios, {AxiosResponse, AxiosRequestConfig, AxiosError, CancelToken as AxiosCancelToken} from 'axios'
import Mutex from '../util/Mutex';
import RCache from './RCache';

export interface APIResponse<T = any> {
    data: T;
    statusCode: number;
}
export interface CancelToken {
    token: AxiosCancelToken,
    cancel: () => void
}
export interface SharedRepositories {
    repositories: SharedRepository[];
    author: string;
    authorWebsite: string;
    authorBio: string;
}
export interface SharedRepository {
    id: number;
    owner: string;
    repo: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
    downloadAllowed: boolean;
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
    // Expiring tokens turned off
    // exp: string;
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

export interface Analytic {
    token: string;
    pageViews: string;
    uniquePageViews: string;
}
export interface DashboardAnalyticsInfo {
    analytics: Analytic[];
}
export interface GithubInstallations {
    installations: GithubInstallation[];
}
export interface GithubInstallation {
    login: string;
}

export interface AccountSettings {
    email?: string;
}
export interface ConnectedServices {
    githubLogin?: string;
    gitlabLogin?: string;
    bitbucketLogin?: string;
}
export interface PublicProfileSettings {
    displayName?: string;
    url?: string;
    bio?: string;
}

export default class API {


    static cache: RCache = new RCache('share-git');

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
    // Expiring tokens turned off
    // static async checkJWT(cancelToken: CancelToken) {
    //     const exp = localStorage.getItem('OAuthJWT-exp')
    //     if (exp != undefined && parseInt(exp) < new Date().getTime() / 1000) {
    //         console.log('YES')
    //         await this.mutex.dispatch(async () => {
    //             console.log('IN_MUTEX')
    //             const exp2 = localStorage.getItem('OAuthJWT-exp')
    //             if (exp2 != undefined && parseInt(exp2) < new Date().getTime() / 1000) {
    //                 console.log('REFRESHING_TOKEN')
    //                 const axiosConfig: AxiosRequestConfig = this.populateDefaultRequest(cancelToken);
    //                 const result = await axios.get<AuthResult>(`${config.apiUrl}/auth/refreshtoken`, axiosConfig);
    //                 localStorage.setItem('OAuthJWT-exp', result.data.exp)
    //                 localStorage.setItem('OAuthJWT', result.data.token)
    //             }
    //         })
    //     }
    // }
    static async get<T = any>(request: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);
        // Expiring tokens turned off
        // await this.checkJWT(cancelToken);

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
    static async put<T = any>(request: string, data: any, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);

        const config: AxiosRequestConfig = this.populateDefaultRequest(cancelToken)
        if (additionalConfig != undefined)
            Object.assign(config, additionalConfig);
        return new Promise<APIResponse<T>>((resolve, reject) => {
            axios.put<T>(request, data, config)
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
    static async delete<T = any>(request: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        console.log(`Requesting: ${request}`);

        const config: AxiosRequestConfig = this.populateDefaultRequest(cancelToken)
        if (additionalConfig != undefined)
            Object.assign(config, additionalConfig);
        return new Promise<APIResponse<T>>((resolve, reject) => {
            axios.delete<T>(request, config)
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
    static async getDataCached<T = any>(request: string, cancelToken: CancelToken, ttl: number = 3600): Promise<T> {
        return await this.cache.getOrPutAndGet<T>(request, 
            async () =>  (await this.getData<T>(request, cancelToken)),
            ttl);
    }

    static async getSharedBranches(owner: string, repo: string, cancelToken: CancelToken): Promise<Branch[]> {
        const request = `${config.apiUrl}/share/branches/${owner}/${repo}`;
        return await this.getDataCached<Branch[]>(request, cancelToken, 3600);
    }
    static async getRepoTree(provider: string, id: number, owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<TreeNode[]> {
        const request = `${config.apiUrl}/${provider}/${id}/${owner}/${repo}/tree/${sha}/${uri}`;
        return await this.getDataCached<TreeNode[]>(request, cancelToken, 3600);
    }
    static async getRepoBlob(provider: string, id: number, owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<BlobResult> {
        const request = `${config.apiUrl}/${provider}/${id}/${owner}/${repo}/blob/${sha}/${uri}`;
        return await this.getDataCached<BlobResult>(request, cancelToken, 3600);
    }
    static async getSharedRepositories(token: string, cancelToken: CancelToken): Promise<SharedRepositories> {
        const request = `${config.apiUrl}/share/${token}`;
        return await this.getDataCached<SharedRepositories>(request, cancelToken, 60 * 5);
    }
    static async signIn(provider: string, code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const request = `${config.apiUrl}/auth/signin/${provider}/${code}/${state}`;
        return await this.getData<AuthResult>(request, cancelToken);
    }
    static async signUp(provider: string, code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const request = `${config.apiUrl}/auth/signup/${provider}/${code}/${state}`;
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
    static async startDeleteAccount(cancelToken: CancelToken): Promise<any> {
        const request = `${config.apiUrl}/settings`;
        return await this.put<any>(request, {}, cancelToken);
    }
    static async deleteAccount(token: string, cancelToken: CancelToken): Promise<any> {
        const request = `${config.apiUrl}/settings/${token}`;
        return await this.delete<any>(request, cancelToken);
    }
    static async getAnalytics(cancelToken: CancelToken): Promise<DashboardAnalyticsInfo> {
        const request = `${config.apiUrl}/dashboard/analytics`;
        return await this.getDataCached(request, cancelToken, 3600);
    }
    static pushHit(path: string, cid: string, cancelToken: CancelToken): void {
        const request = `${config.apiUrl}/an/hit?path=${encodeURIComponent(path)}&cid=${encodeURIComponent(cid)}`;
        this.post(request, {}, cancelToken);
    }
    static async getDownloadLink(provider: string, id: number, owner: string, repo: string, sha: string, cancelToken: CancelToken): Promise<string> {
        const request = `${config.apiUrl}/${provider}/download/${id}/${owner}/${repo}/${sha}`;
        return await this.getData<string>(request, cancelToken);
    }
    static async getGithubInstallations(cancelToken: CancelToken): Promise<GithubInstallations> {
        const request = `${config.apiUrl}/settings/githubinstallations`;
        return await this.getData<GithubInstallations>(request, cancelToken);
    }

    static async getSettingsPublicProfile(cancelToken: CancelToken): Promise<PublicProfileSettings> {
        const request = `${config.apiUrl}/settings/public`;
        return await this.getData<PublicProfileSettings>(request, cancelToken);
    }
    static async setSettingsPublicProfile(newSettings: PublicProfileSettings, cancelToken: CancelToken): Promise<any> {
        const request = `${config.apiUrl}/settings/public`;
        return await this.put<any>(request, newSettings, cancelToken);
    }
    static async getSettingsAccount(cancelToken: CancelToken): Promise<AccountSettings> {
        const request = `${config.apiUrl}/settings/account`;
        return await this.getData<AccountSettings>(request, cancelToken);
    }
    static async setSettingsAccount(newSettings: AccountSettings, cancelToken: CancelToken): Promise<any> {
        const request = `${config.apiUrl}/settings/account`;
        return await this.put<any>(request, newSettings, cancelToken);
    }
    static async getConnectedServices(cancelToken: CancelToken): Promise<ConnectedServices> {
        const request = `${config.apiUrl}/settings/connections`;
        return await this.getData<ConnectedServices>(request, cancelToken);
    }
    static async disconnectService(provider: string, cancelToken: CancelToken) {
        const request = `${config.apiUrl}/settings/connection/${provider}`;
        return await this.delete<any>(request, cancelToken);
    }
}