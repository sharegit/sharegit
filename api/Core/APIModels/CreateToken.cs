using FluentValidation;
using System;

namespace Core.APIModels
{
    public class CreateToken
    {
        public class Repository
        {
            public int Id { get; set; }
            public string Owner { get; set; }
            public string Repo { get; set; }
            public string Provider { get; set; }
            public bool DownloadAllowed { get; set; }
            public string Path { get; set; }
            public Branch[] Branches { get; set; }
        }
        public string Stamp { get; set; }
        public Repository[] Repositories { get; set; }
        public string CustomName { get; set; }
        // Expiration date in UTC minutes!
        public long ExpireDate { get; set; }
    }
    public class CreateTokenValidator : AbstractValidator<CreateToken>
    {
        public CreateTokenValidator()
        {
            RuleFor(x => x.Stamp).NotEmpty().MaximumLength(50);
            RuleFor(x => x.CustomName).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Repositories).NotEmpty();
            RuleForEach(x => x.Repositories).NotNull().SetValidator(new CreateTokenRepositoryValidator());
            RuleFor(x => x.ExpireDate).Must(x => x == 0 || x > DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60);
        }
    }

    class CreateTokenRepositoryValidator : AbstractValidator<CreateToken.Repository>
    {
        public CreateTokenRepositoryValidator()
        {
            RuleFor(x => x.DownloadAllowed).Must(x => !x).When(x => x.Provider != "github");
            RuleFor(x => x.Branches).NotEmpty();
            RuleForEach(x => x.Branches).NotEmpty();
            RuleFor(x => x.Path).MaximumLength(1024);
            RuleFor(x => x.Path).Must(x => string.IsNullOrEmpty(x) || x == "." || x == "/").When(x => x.DownloadAllowed);
        }
    }
}
