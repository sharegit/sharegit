using Core.APIModels;
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
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "jwt")]
    public class DashboardController : ControllerBase
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepositoryService RepositoryService { get; }

        public DashboardController(IRepositoryService repositoryService,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            RepositoryService = repositoryService;
            AccountRepository = accountRepository;
            ShareRepository = shareRepository;
        }

        [HttpGet()]
        [Produces("application/json")]
        public async Task<IActionResult> Get()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new OkObjectResult(new
            {
                name = user.Name
            });
        }

        [HttpGet("tokens")]
        [Produces("application/json")]
        public async Task<IActionResult> GetTokens()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new OkObjectResult(user.SharedTokens.Select(x => x.Token));
        }

        [HttpGet("repos")]
        [Produces("application/json")]
        public async Task<IActionResult> GetRepos()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            var userAccessToken = user.AccessToken;
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccessToken);
            return new OkObjectResult(repos);
        }
        [HttpPost("createtoken")]
        public async Task<IActionResult> CreateToken([FromBody] CreateToken createToken)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if(user.SharedTokens.Any(x=>x.Stamp == createToken.Stamp))
            {
                return new BadRequestResult();
            }

            var userAccessToken = user.AccessToken;
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccessToken);
            if (createToken.Repositories.Any(c => !repos.Any(r => c.Owner == r.Owner && c.Repo == r.Repo)))
            {
                return new ForbidResult();
            }

            using (RandomNumberGenerator rng = new RNGCryptoServiceProvider())
            {
                byte[] tokenData = new byte[64];
                rng.GetBytes(tokenData);

                // Get repositories available for user access token

                var share = new Share()
                {
                    Token = Base64UrlTextEncoder.Encode(tokenData),
                    AccessibleRepositories = createToken.Repositories.Select(x=>new Repository()
                    {
                        Owner = x.Owner,
                        Provider = "github",
                        Repo = x.Repo
                    }).ToArray()
                };

                user.SharedTokens.Add(new SharedToken()
                {
                    Token = share.Token,
                    Stamp = createToken.Stamp
                });
                ShareRepository.Create(share);
                AccountRepository.Update(user.Id, user);

                return new OkResult();
            }
        }
    }
}
