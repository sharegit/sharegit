using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace WebAPI.Authentication
{
    public class TokenAuthenticationSchemeOptions : AuthenticationSchemeOptions
    {
    }
    public class TokenAuthenticationHandler
        : AuthenticationHandler<TokenAuthenticationSchemeOptions>
    {

        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        public TokenAuthenticationHandler(
            IOptionsMonitor<TokenAuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
            : base(options, logger, encoder, clock)
        {
            ShareRepository = shareRepository;
        }

        protected async override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("token"))
            {
                return AuthenticateResult.Fail("Token header Not Found.");
            }

            var token = Request.Headers["token"].ToString();

            var validatedToken = await ShareRepository.GetAsync(token);
            var nowMinues = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60;
            if (validatedToken != null && (validatedToken.Token.ExpireDate == 0 || validatedToken.Token.ExpireDate > nowMinues) || IsTokenOwner(validatedToken))
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.Hash, token)
                };

                var claimsIdentity = new ClaimsIdentity(claims, nameof(TokenAuthenticationHandler));

                var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);

                Context.Items.Add("access", validatedToken.AccessibleRepositories);

                return AuthenticateResult.Success(ticket);
            }
            else
            {
                return AuthenticateResult.Fail("Invalid token!");
            }
        }
        private bool IsTokenOwner(Share share)
        {
            var validatedJWT = JWTAuthenticationHandler.GetAuthenticatedUserClaims(Request.Headers);

            if(validatedJWT != null)
                return validatedJWT.GetValueOrDefault("id") == share.Token.SharingUserId;

            return false;
        }
    }

}
