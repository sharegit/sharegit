﻿using Core.APIModels;
using Core.Model.Github;
using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.GithubAuth;
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
        public async Task<ActionResult<EssentialDashboardInfo>> GetEssentialDashboardInfo()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new EssentialDashboardInfo()
            {
                Name = user.Name
            };
        }

        [HttpGet("tokens")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<Core.APIModels.SharedToken>>> GetTokens()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return user.SharedTokens.Select(x => new Core.APIModels.SharedToken()
            {
                Token = x.Token
            }).ToList();
        }

        [HttpGet("repos")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<SharedRepository>>> GetRepos()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.EncodedAccessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccess);

            return repos.Select(x =>
                new SharedRepository()
                {
                    Description = x.Description,
                    Owner = x.Owner.Login,
                    Provider = "github",
                    Repo = x.Name
                }
            ).ToList();
        }
        [HttpPost("createtoken")]
        public async Task<ActionResult<Core.APIModels.SharedToken>> CreateToken([FromBody] CreateToken createToken)
        {
            if (createToken.Repositories.Length == 0)
            {
                return new BadRequestResult();
            }

            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if (user.SharedTokens.Any(x => x.Stamp == createToken.Stamp))
            {
                return new BadRequestResult();
            }

            var userAccess = new GithubUserAccess()
            {
                AccessToken = JWT.Decode<string>(user.EncodedAccessToken, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC")),
                UserId = user.Id
            };
            var repos = await RepositoryService.GetUserInstallationRepositories(userAccess);
            if (createToken.Repositories.Any(c => !repos.Any(r => c.Owner == r.Owner.Login && c.Repo == r.Name)))
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
                    AccessibleRepositories = createToken.Repositories.Select(x => new Repository()
                    {
                        Owner = x.Owner,
                        Provider = "github",
                        Repo = x.Repo
                    }).ToArray()
                };

                user.SharedTokens.Add(new ShareGithub.Models.SharedToken()
                {
                    Token = share.Token,
                    Stamp = createToken.Stamp
                });
                ShareRepository.Create(share);
                AccountRepository.Update(user.Id, user);

                return new Core.APIModels.SharedToken()
                {
                    Token = share.Token
                };
            }
        }
        [HttpPost("deletetoken/{token}")]
        public async Task<IActionResult> DeleteToken(string token)
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            if (user.SharedTokens.Any(x => x.Token == token))
            {
                user.SharedTokens.RemoveAll(x => x.Token == token);
                var share = ShareRepository.Find(x => x.Token == token);
                if (share != null)
                    ShareRepository.Remove(share.Id);
                AccountRepository.Update(user.Id, user);
                return new OkResult();
            }
            else
            {
                return new BadRequestResult();
            }
        }
    }
}