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


        [HttpGet("{code}/{state}")]
        [Produces("application/json")]
        public async Task<IActionResult> Auth(string code, string state)
        {
            var userAccessResponse = await AccountService.AuthUserWithGithub(code, state);
            dynamic userAccess = JObject.Parse(userAccessResponse.RAW);
            string access_token = userAccess.access_token;

            var userResponse = await AccountService.GetUserInfo(access_token);
            dynamic user = JObject.Parse(userResponse.RAW);
            string login = user.login;
            string name = user.name;
            int github_id = user.id;

            var existingUser = AccountRepository.Find(x => x.GithubId == github_id);
            if(existingUser == null)
            {
                existingUser = new Account()
                {
                    Login = login,
                    Name = name,
                    GithubId = github_id,
                    AccessToken = access_token
                };
                existingUser = AccountRepository.Create(existingUser);
            }


            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                id = existingUser.Id
            };

            var jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));

            return new OkObjectResult(new
            {
                token = jwt
            });
        }
    }
}
