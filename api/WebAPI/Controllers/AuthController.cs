using Core.APIModels;
using Core.Model.Bitbucket;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Mvc;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Services;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IAccountServiceGithub AccountServiceGH { get; }
        private IAccountServiceGitlab AccountServiceGL { get; }
        private IAccountServiceBitbucket AccountServiceBB { get; }

        public AuthController(IAccountServiceGithub accountServiceGH,
            IAccountServiceGitlab accountServiceGL,
            IAccountServiceBitbucket accountServiceBB,
            IRepository<Account, AccountDatabaseSettings> accountRepository)
        {
            AccountServiceGH = accountServiceGH;
            AccountServiceGL = accountServiceGL;
            AccountServiceBB = accountServiceBB;


            AccountRepository = accountRepository;
        }

        [HttpGet("signin/bitbucket/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignInBitbucket(string code, string state)
        {
            var userAccess = await AccountServiceBB.AuthUserWithBitbucket(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(userAccess.Value.RefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(userAccess.Value.ExpiresIn - 90).ToUnixTimeSeconds();

            var bitbucketUserAccess = new BitbucketUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                AccessTokenExp = accessTokenExp,
                RefreshToken = userAccess.Value.RefreshToken,
                UserId = null
            };

            var user = await AccountServiceBB.GetUserInfo(bitbucketUserAccess);
            var bitbucket_id = user.Value.UUID;

            var existingUser = await GetExistingAccount("bitbucket", bitbucket_id);
            if (existingUser != null)
            {
                existingUser.BitbucketConnection = new BitbucketConnectedService()
                {
                    Username = user.Value.Username,
                    BitbucketId = bitbucket_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken,
                    AccessTokenExp = accessTokenExp
                };
                await AccountRepository.UpdateAsync(existingUser.Id, existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }

        [HttpGet("signin/gitlab/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignInGitlab(string code, string state)
        {
            var userAccess = await AccountServiceGL.AuthUserWithGitlab(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(userAccess.Value.RefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            var githubUserAccess = new GitlabUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                UserId = null
            };
            var user = await AccountServiceGL.GetUserInfo(githubUserAccess);
            int gitlab_id = user.Value.Id;
            string login = user.Value.Username;

            var existingUser = await GetExistingAccount("gitlab", gitlab_id);
            if (existingUser != null)
            {
                existingUser.GitlabConnection = new GitlabConnectedService()
                {
                    Login = login,
                    GitlabId = gitlab_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken
                };
                await AccountRepository.UpdateAsync(existingUser.Id, existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }

        [HttpGet("signin/github/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignInGithub(string code, string state)
        {
            var userAccess = await AccountServiceGH.AuthUserWithGithub(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            var githubUserAccess = new GithubUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                UserId = null
            };
            var user = await AccountServiceGH.GetUserInfo(githubUserAccess);
            string login = user.Value.Login;
            int github_id = user.Value.Id;

            var existingUser = await GetExistingAccount("github", github_id);
            if (existingUser != null)
            {
                existingUser.GithubConnection = new GithubConnectedService()
                {
                    Login = login,
                    GithubId = github_id,
                    EncodedAccessToken = encodedAccessToken,
                };
                await AccountRepository.UpdateAsync(existingUser.Id, existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }


        [HttpGet("signup/bitbucket/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignUpBitbucket(string code, string state)
        {
            var userAccess = await AccountServiceBB.AuthUserWithBitbucket(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(userAccess.Value.RefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(userAccess.Value.ExpiresIn - 90).ToUnixTimeSeconds();

            var bitbucketUserAccess = new BitbucketUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                AccessTokenExp = accessTokenExp,
                RefreshToken = userAccess.Value.RefreshToken,
                UserId = null
            };
            var user = await AccountServiceBB.GetUserInfo(bitbucketUserAccess);

            string name = user.Value.DisplayName;
            string bitbucket_id = user.Value.UUID;


            var existingUser = await GetExistingAccount("bitbucket", bitbucket_id);
            if (existingUser == null)
            {
                var emails = await AccountServiceBB.GetUserEmails(bitbucketUserAccess);
                string email = emails.Value.Values.First(x => x.IsPrimary).Email;

                existingUser = new Account()
                {
                    Name = name,
                    DisplayName = name,
                    Email = email,
                    BitbucketConnection = new BitbucketConnectedService()
                    {
                        Username = user.Value.Username,
                        BitbucketId = bitbucket_id,
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                        AccessTokenExp = accessTokenExp
                    }
                };
                existingUser = await AccountRepository.CreateAsync(existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }

        [HttpGet("signup/gitlab/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignUpGitlab(string code, string state)
        {
            var userAccess = await AccountServiceGL.AuthUserWithGitlab(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(userAccess.Value.RefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            var githubUserAccess = new GitlabUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                UserId = null
            };
            var user = await AccountServiceGL.GetUserInfo(githubUserAccess);

            int gitlab_id = user.Value.Id;

            var existingUser = await GetExistingAccount("gitlab", gitlab_id);
            if (existingUser == null)
            {
                existingUser = new Account()
                {
                    Name = user.Value.Name,
                    DisplayName = user.Value.Name,
                    Email = user.Value.Email,
                    GitlabConnection = new GitlabConnectedService()
                    {
                        Login = user.Value.Username,
                        GitlabId = gitlab_id,
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                    }
                };
                existingUser = await AccountRepository.CreateAsync(existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }

        [HttpGet("signup/github/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> SignUpGithub(string code, string state)
        {
            var userAccess = await AccountServiceGH.AuthUserWithGithub(code, state);

            var encodedAccessToken = JWT.Encode(userAccess.Value.AccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            var githubUserAccess = new GithubUserAccess()
            {
                AccessToken = userAccess.Value.AccessToken,
                UserId = null
            };

            var user = await AccountServiceGH.GetUserInfo(githubUserAccess);
            int github_id = user.Value.Id;

            var existingUser = await GetExistingAccount("github", github_id);
            if (existingUser == null)
            {
                var emails = await AccountServiceGH.GetUserEmails(githubUserAccess);
                string email = emails.Value.First(x => x.Primary).Email;
                existingUser = new Account()
                {
                    Name = user.Value.Name,
                    DisplayName = user.Value.Name,
                    Email = email,
                    GithubConnection = new GithubConnectedService()
                    {
                        Login = user.Value.Login,
                        GithubId = github_id,
                        EncodedAccessToken = encodedAccessToken,
                    }
                };
                existingUser = await AccountRepository.CreateAsync(existingUser);

                return ConstructJWT(existingUser.Id);
            }
            else
            {
                return new ForbidResult("jwt");
            }
        }

        private async Task<Account> GetLoggedInUser()
        {
            if (Request.Headers.ContainsKey("jwt"))
            {
                var jwt = Request.Headers["jwt"].ToString();
                try
                {
                    var validatedJWT = JWT.Decode<Dictionary<string, string>>(jwt, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
                    if (validatedJWT != null)
                    {
                        return await AccountRepository.GetAsync(validatedJWT["id"]);
                    }
                }
                catch
                {
                    return null;
                }
            }
            return null;
        }
        private async Task<Account> GetExistingAccount(string provider, object id)
        {
            var existingAccount = provider switch
            {
                "github" => AccountRepository.Find(x => x.GithubConnection?.GithubId.Equals(id) ?? false),
                "gitlab" => AccountRepository.Find(x => x.GitlabConnection?.GitlabId.Equals(id) ?? false),
                "bitbucket" => AccountRepository.Find(x => x.BitbucketConnection?.BitbucketId.Equals(id) ?? false),
                _ => throw new ArgumentException("Invalid argument: provider: [" + provider + "]"),
            };
            var loggedInUser = await GetLoggedInUser();
            if (existingAccount == null && loggedInUser == null)
                return null;
            else if (existingAccount != null && loggedInUser == null)
                return existingAccount;
            else if (existingAccount == null && loggedInUser != null)
                return loggedInUser;
            else
                return null;
        }
        private JWTResponse ConstructJWT(string userId)
        {
            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                id = userId
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
            };
        }
    }
}
