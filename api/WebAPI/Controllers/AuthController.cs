using Core.APIModels;
using Core.Model.Github;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IAccountService AccountService { get; }

        public AuthController(IAccountService accountService,
            IRepository<Account, AccountDatabaseSettings> accountRepository)
        {
            AccountService = accountService;
            AccountRepository = accountRepository;
        }


        [HttpGet("refreshtoken")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = "jwt")]
        public async Task<ActionResult<JWTResponse>> RefreshToken()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            string oldRefreshToken = JWT.Decode<string>(user.EncodedRefreshToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));

            var refresh = await AccountService.RefreshAuthWithGithub(oldRefreshToken);
            string accessToken = refresh.Value.AccessToken;
            long accessTokenExpIn = refresh.Value.ExpiresIn;
            string refreshToken = refresh.Value.RefreshToken;
            long refreshTokenExpIn = refresh.Value.RefreshTokenExpiresIn;

            var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 10).ToUnixTimeSeconds();
            var refreshTokenExp = DateTimeOffset.UtcNow.AddSeconds(refreshTokenExpIn - 10).ToUnixTimeSeconds();

            user.EncodedAccessToken = encodedAccessToken;
            user.EncodedRefreshToken = encodedRefreshToken;
            user.AccessTokenExp = accessTokenExp;
            user.RefreshTokenExp = refreshTokenExp;
            AccountRepository.Update(user.Id, user);

            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                exp = accessTokenExp,
                id = user.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                Exp = accessTokenExp
            };
        }
        [HttpGet("{code}/{state}")]
        [Produces("application/json")]
        public async Task<ActionResult<JWTResponse>> Auth(string code, string state)
        {
            var userAccess = await AccountService.AuthUserWithGithub(code, state);
            string accessToken = userAccess.Value.AccessToken;
            long accessTokenExpIn = userAccess.Value.ExpiresIn;
            string refreshToken = userAccess.Value.RefreshToken;
            long refreshTokenExpIn = userAccess.Value.RefreshTokenExpiresIn;

            var githubUserAccess = new GithubUserAccess()
            {
                AccessToken = accessToken,
                UserId = null
            };
            var user = await AccountService.GetUserInfo(githubUserAccess);
            string login = user.Value.Login;
            string name = user.Value.Name;
            int github_id = user.Value.Id;

            var existingUser = AccountRepository.Find(x => x.GithubId == github_id);
            var encodedAccessToken = JWT.Encode(accessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
            var encodedRefreshToken = JWT.Encode(refreshToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
            var accessTokenExp = DateTimeOffset.UtcNow.AddSeconds(accessTokenExpIn - 10).ToUnixTimeSeconds();
            var refreshTokenExp = DateTimeOffset.UtcNow.AddSeconds(refreshTokenExpIn - 10).ToUnixTimeSeconds();
            if (existingUser == null)
            {
                existingUser = new Account()
                {
                    Login = login,
                    Name = name,
                    DisplayName = name,
                    GithubId = github_id,
                    EncodedAccessToken = encodedAccessToken,
                    EncodedRefreshToken = encodedRefreshToken,
                    AccessTokenExp = accessTokenExp,
                    RefreshTokenExp = refreshTokenExp
                };
                existingUser = AccountRepository.Create(existingUser);
            }
            else
            {
                existingUser.EncodedAccessToken = encodedAccessToken;
                existingUser.EncodedAccessToken = encodedAccessToken;
                existingUser.EncodedRefreshToken = encodedRefreshToken;
                existingUser.AccessTokenExp = accessTokenExp;
                existingUser.RefreshTokenExp = refreshTokenExp;
                AccountRepository.Update(existingUser.Id, existingUser);
            }


            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                exp = accessTokenExp,
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));

            return new JWTResponse()
            {
                Token = jwt,
                Exp = accessTokenExp
            };
        }
    }
}
