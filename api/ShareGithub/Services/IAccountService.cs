﻿using Core.Model;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountService
    {
        Task<GithubAPIResponse> AuthUserWithGithub(string code, string state);
        Task<GithubAPIResponse> GetUserInfo(string accessToken);
    }
}
