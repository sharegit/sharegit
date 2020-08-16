using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShareGithub.Models;
using ShareGithub.Repositories;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace WebAPI.Authentication
{
    public class JWTAuthenticationSchemeOptions : AuthenticationSchemeOptions
    {
    }
    public class JWTAuthenticationHandler
        : AuthenticationHandler<JWTAuthenticationSchemeOptions>
    {

        public JWTAuthenticationHandler(
            IOptionsMonitor<JWTAuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("jwt"))
            {
                return Task.FromResult(AuthenticateResult.Fail("JWT header Not Found."));
            }

            var jwt = Request.Headers["jwt"].ToString();

            try
            {
                var validatedJWT = JWT.Decode<Dictionary<string, string>>(jwt, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
                if (validatedJWT != null)
                {
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, validatedJWT["id"])
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, nameof(JWTAuthenticationHandler));

                    var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);

                    return Task.FromResult(AuthenticateResult.Success(ticket));
                }
                else
                {
                    return Task.FromResult(AuthenticateResult.Fail("Invalid JWT!"));
                }
            }
            catch
            {
                return Task.FromResult(AuthenticateResult.Fail("Invalid JWT!"));
            }
        }
    }

}
