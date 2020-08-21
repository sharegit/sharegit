using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShareGithub;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;

namespace WebAPI.StartupExtensions
{
    public static class SetupDIExtension
    {
        public static void SetupServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddTransient<IRepositoryService, RepositoryService>();
            services.AddTransient<IAccountService, AccountService>();

            services.Configure<AccountDatabaseSettings>(configuration.GetSection(nameof(AccountDatabaseSettings)));
            services.Configure<ShareDatabaseSettings>(configuration.GetSection(nameof(ShareDatabaseSettings)));
            services.Configure<GithubAppSettings>(configuration.GetSection(nameof(GithubAppSettings)));

            services.AddTransient(typeof(IRepository<,>), typeof(RepositoryBase<,>));
        }
    }
}
