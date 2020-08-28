using Microsoft.Extensions.Options;
using ShareGithub.Settings;

namespace ShareGithub.Services
{
    public abstract class GitlabBaseService : BaseService<GitlabAppSettings>
    {
        protected GitlabBaseService(IOptions<GitlabAppSettings> appSettings) : base(appSettings)
        {
        }
    }
}
