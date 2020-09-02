using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using ShareGit.Settings;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGit.Services.Google
{
    public class GoogleMeasurementService : IMeasurementService
    {
        private GoogleAnalyticsSettings GoogleAnalyticsSettings { get; }
        private IHttpContextAccessor ContextAccessor { get; }
        public GoogleMeasurementService(IHttpContextAccessor httpContextAccessor,
            IOptions<GoogleAnalyticsSettings> googleAnalyticsSettings)
        {
            GoogleAnalyticsSettings = googleAnalyticsSettings.Value;
            ContextAccessor = httpContextAccessor;
        }

        public async Task Hit(string path, string clientId)
        {
            await Post("/collect", path, clientId, "pageview");
        }

        /// <summary>
        /// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
        /// </summary>
        private async Task Post(string uri, string path, string clientId, string hitType = "pageview")
        {
            using var httpClient = new HttpClient();

            // Build query
            var uriBuilder = new UriBuilder($"{GoogleAnalyticsSettings.Endpoint}{uri}");
            var query = HttpUtility.ParseQueryString(uriBuilder.Query);

            query.Add("v", GoogleAnalyticsSettings.Version.ToString());
            query.Add("tid", GoogleAnalyticsSettings.PropertyId.ToString());
            query.Add("cid", clientId);

            string userAgent = "";
            if (ContextAccessor.HttpContext.Request.Headers.TryGetValue("User-Agent", out var userAgentValues))
                userAgent = userAgentValues.First();

            string host = "";
            if (ContextAccessor.HttpContext.Request.Headers.TryGetValue("Host", out var hostValues))
                host = hostValues.First();

            // User Agent Override
            query.Add("ua", userAgent);

            // IP Override
            string remoteIp = ContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString();
            query.Add("uip", remoteIp);

            // Document Host Name
            query.Add("dh", host);
            // Document Path
            query.Add("dp", path);

            // Build hit type
            query.Add("t", hitType);

            uriBuilder.Query = query.ToString();

            // Build request
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(uriBuilder.ToString()),
                Method = HttpMethod.Post
            };

            // Run request
            await httpClient.SendAsync(request);
        }
    }
}
