using Core.APIModels;
using Core.Model.Bitbucket;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Math.EC.Rfc7748;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
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

        /// <summary>
        /// https://stackoverflow.com/questions/2715532/synchronizing-access-to-a-member-of-the-asp-net-session
        /// https://docs.microsoft.com/en-us/previous-versions/dotnet/articles/aa479041(v=msdn.10)?redirectedfrom=MSDN
        /// </summary>
        /// <returns></returns>
        public async Task<ActionResult> RefreshToken()
        {
            return new OkResult();
        }

        [HttpGet("bitbucket/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> AuthBitbucket(string code, string state)
        {
            var userAccess = await AccountServiceBB.AuthUserWithBitbucket(code, state);

            string accessToken = userAccess.Value.AccessToken;
            long accessTokenExpIn = userAccess.Value.ExpiresIn;
            string refreshToken = userAccess.Value.RefreshToken;

            var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 90).ToUnixTimeSeconds();

            var bitbucketUserAccess = new BitbucketUserAccess()
            {
                AccessToken = accessToken,
                AccessTokenExp = accessTokenExp,
                RefreshToken = refreshToken,
                UserId = null
            };
            var user = await AccountServiceBB.GetUserInfo(bitbucketUserAccess);

            
            string name = user.Value.DisplayName;
            string bitbucket_id = user.Value.UUID;

            var emails = await AccountServiceBB.GetUserEmails(bitbucketUserAccess);
            string email = emails.Value.Values.First(x => x.IsPrimary).Email;

            var existingUser = await GetExistingAccount("bitbucket", bitbucket_id);
            if (existingUser == null)
            {
                existingUser = new Account()
                {
                    Name = name,
                    DisplayName = name,
                    Email = email,
                    BitbucketConnection = new BitbucketConnectedService()
                    {
                        BitbucketId = bitbucket_id,
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                        AccessTokenExp = accessTokenExp
                    }
                };
                existingUser = AccountRepository.Create(existingUser);
            }
            else
            {
                existingUser.BitbucketConnection = new BitbucketConnectedService()
                {
                    BitbucketId = bitbucket_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken,
                    AccessTokenExp = accessTokenExp
                };
                AccountRepository.Update(existingUser.Id, existingUser);
            }


            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                // exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                // Exp = accessTokenExp
            };
        }

        [HttpGet("gitlab/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> AuthGitlab(string code, string state)
        {
            var userAccess = await AccountServiceGL.AuthUserWithGitlab(code, state);

            string accessToken = userAccess.Value.AccessToken;
            long accessTokenExpIn = userAccess.Value.ExpiresIn;
            string refreshToken = userAccess.Value.RefreshToken;

            var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddYears(999).ToUnixTimeSeconds();


            var githubUserAccess = new GitlabUserAccess()
            {
                AccessToken = accessToken,
                UserId = null
            };
            var user = await AccountServiceGL.GetUserInfo(githubUserAccess);

            string login = user.Value.Login;
            string name = user.Value.Name;
            string email = user.Value.Email;
            int gitlab_id = user.Value.Id;

            var existingUser = await GetExistingAccount("gitlab", gitlab_id);
            if (existingUser == null)
            {
                existingUser = new Account()
                {
                    Name = name,
                    DisplayName = name,
                    Email = email,
                    GitlabConnection = new GitlabConnectedService()
                    {
                        Login = login,
                        GitlabId = gitlab_id,
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                        AccessTokenExp = accessTokenExp
                    }
                };
                existingUser = AccountRepository.Create(existingUser);
            }
            else
            {
                existingUser.GitlabConnection = new GitlabConnectedService()
                {
                    Login = login,
                    GitlabId = gitlab_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken,
                    AccessTokenExp = accessTokenExp
                };
                AccountRepository.Update(existingUser.Id, existingUser);
            }


            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                // exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                // Exp = accessTokenExp
            };
        }
        [HttpGet("github/{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> AuthGithub(string code, string state)
        {
            var userAccess = await AccountServiceGH.AuthUserWithGithub(code, state);

            string accessToken = userAccess.Value.AccessToken;
            long accessTokenExpIn = userAccess.Value.ExpiresIn;
            string refreshToken = userAccess.Value.RefreshToken;
            long refreshTokenExpIn = userAccess.Value.RefreshTokenExpiresIn;

            var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 90).ToUnixTimeSeconds();
            var refreshTokenExp = DateTimeOffset.UtcNow.AddSeconds(refreshTokenExpIn - 90).ToUnixTimeSeconds();


            var githubUserAccess = new GithubUserAccess()
            {
                AccessToken = accessToken,
                UserId = null
            };
            var user = await AccountServiceGH.GetUserInfo(githubUserAccess);

            string login = user.Value.Login;
            string name = user.Value.Name;

            var emails = await AccountServiceGH.GetUserEmails(githubUserAccess);
            string email = emails.Value.First(x => x.Primary).Email;
            int github_id = user.Value.Id;

            var existingUser = await GetExistingAccount("github", github_id);
            if (existingUser == null)
            {
                existingUser = new Account()
                {
                    Name = name,
                    DisplayName = name,
                    Email = email,
                    GithubConnection = new GithubConnectedService()
                    {
                        Login = login,
                        GithubId = github_id,
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                        AccessTokenExp = accessTokenExp,
                        RefreshTokenExp = refreshTokenExp
                    }
                };
                existingUser = AccountRepository.Create(existingUser);
            }
            else
            {
                existingUser.GithubConnection = new GithubConnectedService()
                {
                    Login = login,
                    GithubId = github_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken,
                    AccessTokenExp = accessTokenExp,
                    RefreshTokenExp = refreshTokenExp
                };
                AccountRepository.Update(existingUser.Id, existingUser);
            }


            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                // exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                // Exp = accessTokenExp
            };
        }
        private async Task<Account> GetExistingAccount(string provider, object id)
        {
            if (Request.Headers.ContainsKey("jwt"))
            {
                var jwt = Request.Headers["jwt"].ToString();
                try
                {
                    var validatedJWT = JWT.Decode<Dictionary<string, string>>(jwt, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
                    if (validatedJWT != null)
                    {
                        return AccountRepository.Get(validatedJWT["id"]);
                    }
                }
                catch
                {
                }
            }

            return provider switch
            {
                "github" => AccountRepository.Find(x => x.GithubConnection?.GithubId.Equals(id) ?? false),
                "gitlab" => AccountRepository.Find(x => x.GitlabConnection?.GitlabId.Equals(id) ?? false),
                "bitbucket" => AccountRepository.Find(x => x.BitbucketConnection?.BitbucketId.Equals(id) ?? false),
                _ => throw new ArgumentException("Invalid argument: provider: [" + provider + "]"),
            };
        }
    }
}
