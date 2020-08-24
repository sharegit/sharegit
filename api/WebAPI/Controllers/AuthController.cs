using Core.APIModels;
using Core.Model.Github;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Security.Claims;
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

        public AuthController(IAccountServiceGithub accountServiceGH,
            IAccountServiceGitlab accountServiceGL,
            IRepository<Account, AccountDatabaseSettings> accountRepository)
        {
            AccountServiceGH = accountServiceGH;
            AccountServiceGL = accountServiceGL;
            AccountRepository = accountRepository;
        }


        [HttpGet("refreshtoken")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = "jwt")]
        public async Task<ActionResult<JWTResponse>> RefreshTokens()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);

            // Refresh github token
            long? tokenExp = null;
            if (user.GithubConnection != null)
            {
                string oldRefreshToken = JWT.Decode<string>(user.GithubConnection.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

                var refresh = await AccountServiceGH.RefreshAuthWithGithub(oldRefreshToken);
                if (refresh.Value.AccessToken != null)
                {
                    string accessToken = refresh.Value.AccessToken;
                    long accessTokenExpIn = refresh.Value.ExpiresIn;
                    string refreshToken = refresh.Value.RefreshToken;
                    long refreshTokenExpIn = refresh.Value.RefreshTokenExpiresIn;

                    var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
                    var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));
                    var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 10).ToUnixTimeSeconds();
                    var refreshTokenExp = DateTimeOffset.UtcNow.AddSeconds(refreshTokenExpIn - 10).ToUnixTimeSeconds();

                    user.GithubConnection = new GithubConnectedService()
                    {
                        EncodedAccessToken = encodedAccessToken,
                        EncodedRefreshToken = encodedRefreshToken,
                        AccessTokenExp = accessTokenExp,
                        RefreshTokenExp = refreshTokenExp
                    };
                    AccountRepository.Update(user.Id, user);

                    tokenExp = tokenExp.HasValue ? accessTokenExp : Math.Min(tokenExp.Value, accessTokenExp);
                }
            }

            if (tokenExp.HasValue)
            {
                var payload = new
                {
                    iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    exp = tokenExp.Value,
                    id = user.Id
                };

                var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

                return new JWTResponse()
                {
                    Token = jwt,
                    Exp = tokenExp.Value
                };
            }
            else
            {
                return new ForbidResult();
            }
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
                exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                Exp = accessTokenExp
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
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 10).ToUnixTimeSeconds();
            var refreshTokenExp = DateTimeOffset.UtcNow.AddSeconds(refreshTokenExpIn - 10).ToUnixTimeSeconds();


            var githubUserAccess = new GithubUserAccess()
            {
                AccessToken = accessToken,
                UserId = null
            };
            var user = await AccountServiceGH.GetUserInfo(githubUserAccess);

            string login = user.Value.Login;
            string name = user.Value.Name;
            string email = user.Value.Email;
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
                exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                Exp = accessTokenExp
            };
        }
        private async Task<Account> GetExistingAccount(string provider, int id)
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
                "github" => AccountRepository.Find(x => x.GithubConnection?.GithubId == id),
                "gitlab" => AccountRepository.Find(x => x.GitlabConnection?.GitlabId == id),
                _ => throw new ArgumentException("Invalid argument: provider: [" + provider + "]"),
            };
        }
    }
}
