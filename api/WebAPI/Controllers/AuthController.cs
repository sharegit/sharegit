using Core.Model.Github;
using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
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
        public async Task<IActionResult> RefreshToken()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            string oldRefreshToken = JWT.Decode<string>(user.EncodedRefreshToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));

            var refreshReponse = await AccountService.RefreshAuthWithGithub(oldRefreshToken);
            dynamic refresh = JObject.Parse(refreshReponse.RAW);
            string accessToken = refresh.access_token;
            long accessTokenExpIn = refresh.expires_in;
            string refreshToken = refresh.refresh_token;
            long refreshTokenExpIn = refresh.refresh_token_expires_in;

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

            return new OkObjectResult(new
            {
                token = jwt,
                exp = accessTokenExp
            });
        }
        [HttpGet("{code}/{state}")]
        [Produces("application/json")]
        public async Task<IActionResult> Auth(string code, string state)
        {
            var userAccessResponse = await AccountService.AuthUserWithGithub(code, state);
            dynamic userAccessJO = JObject.Parse(userAccessResponse.RAW);
            string accessToken = userAccessJO.access_token;
            long accessTokenExpIn = userAccessJO.expires_in;
            string refreshToken = userAccessJO.refresh_token;
            long refreshTokenExpIn = userAccessJO.refresh_token_expires_in;

            var userAccess = new GithubUserAccess()
            {
                AccessToken = accessToken,
                UserId = null
            };
            var userResponse = await AccountService.GetUserInfo(userAccess);
            dynamic user = JObject.Parse(userResponse.RAW);
            string login = user.login;
            string name = user.name;
            int github_id = user.id;
            
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

            return new OkObjectResult(new
            {
                token = jwt,
                exp = accessTokenExp
            });
        }
    }
}
