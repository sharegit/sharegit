using Microsoft.Extensions.Options;
using ShareGit.Settings;

namespace ShareGit.Services
{
    public abstract class GitlabBaseService : BaseService<GitlabAppSettings>
    {
        protected GitlabBaseService(IOptions<GitlabAppSettings> appSettings) : base(appSettings)
        {
        }
    }
}
