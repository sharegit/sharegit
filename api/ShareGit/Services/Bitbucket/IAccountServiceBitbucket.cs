﻿using Core.Model;
using Core.Model.Bitbucket;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public interface IAccountServiceBitbucket
    {
        Task<APIResponse<BitbucketWebFlowAccessToken>> AuthUserWithBitbucket(string code, string state);
        Task<APIResponse<BitbucketUserInfo>> GetUserInfo(BitbucketUserAccess accessToken);
        Task<APIResponse<PaginatedBitbucketResponse<BitbucketEmail>>> GetUserEmails(BitbucketUserAccess accessToken);
    }
}
