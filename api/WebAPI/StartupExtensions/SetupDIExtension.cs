﻿using Microsoft.Extensions.Configuration;
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
            services.AddTransient<IRepositoryServiceGithub, RepositoryServiceGithub>();
            services.AddTransient<IAccountServiceGithub, AccountServiceGithub>();

            services.AddTransient<IAccountServiceGitlab, AccountServiceGitlab>();
            services.AddTransient<IRepositoryServiceGitlab, RepositoryServiceGitlab>();

            services.Configure<AccountDatabaseSettings>(configuration.GetSection(nameof(AccountDatabaseSettings)));
            services.Configure<ShareDatabaseSettings>(configuration.GetSection(nameof(ShareDatabaseSettings)));

            services.Configure<GithubAppSettings>(configuration.GetSection(nameof(GithubAppSettings)));
            services.Configure<GitlabAppSettings>(configuration.GetSection(nameof(GitlabAppSettings)));

            services.AddTransient(typeof(IRepository<,>), typeof(RepositoryBase<,>));
        }
    }
}