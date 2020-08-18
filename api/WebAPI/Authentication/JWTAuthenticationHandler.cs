using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
       // private static ConcurrentDictionary<string, object> locks = new ConcurrentDictionary<string, object>();
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("jwt"))
            {
                return AuthenticateResult.Fail("JWT header Not Found.");
            }

            var jwt = Request.Headers["jwt"].ToString();

            try
            {
                var validatedJWT = JWT.Decode<Dictionary<string, string>>(jwt, RollingEnv.Get("SHARE_GITHUB_API_PRIV_KEY_LOC"));
                if (validatedJWT != null)
                {
                    var id = validatedJWT["id"];

                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, id)
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, nameof(JWTAuthenticationHandler));

                    var ticket = new AuthenticationTicket(new ClaimsPrincipal(claimsIdentity), this.Scheme.Name);

                    return AuthenticateResult.Success(ticket);
                }
                else
                {
                    return AuthenticateResult.Fail("Invalid JWT!");
                }
            }
            catch
            {
                return AuthenticateResult.Fail("Invalid JWT!");
            }
        }
    }

}
