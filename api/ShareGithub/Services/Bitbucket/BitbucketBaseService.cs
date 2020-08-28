using Core.Model;
using Core.Model.Bitbucket;
using Microsoft.Extensions.Options;
using ShareGithub.GithubAuth;
using ShareGithub.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public abstract class BitbucketBaseService : BaseService<BitbucketAppSettings>
    {
        protected BitbucketBaseService(IOptions<BitbucketAppSettings> appSettings) : base(appSettings)
        {
        }

        protected async Task<APIResponse<PaginatedBitbucketResponse<T>>> FetchBitbucketAPIRecursively<T>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            List<T> values = new List<T>();
            APIResponse<PaginatedBitbucketResponse<T>> currentResponse = null;
            do
            {
                currentResponse = currentResponse switch
                {
                    null => await Fetch<PaginatedBitbucketResponse<T>>($"{AppSettings.APIEndpoint}{url}", method, authMode, body, queryOptions),
                    _ => currentResponse.Value.Next switch
                    {
                        null => null,
                        _ => await Fetch<PaginatedBitbucketResponse<T>>($"{currentResponse.Value.Next}", method, authMode, body, queryOptions)
                    }
                };
                if (currentResponse?.Value?.Values != null)
                    values.AddRange(currentResponse.Value.Values);
            } while (currentResponse != null);
            return new APIResponse<PaginatedBitbucketResponse<T>>()
            {
                RAW = "",
                RemainingLimit = 0,
                Value = new PaginatedBitbucketResponse<T>()
                {
                    Next = null,
                    PageLen = 0,
                    Values = values.ToArray()
                }
            };
        }
    }
}
