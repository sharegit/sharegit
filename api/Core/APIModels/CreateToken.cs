using FluentValidation;

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
            public Branch[] Branches { get; set; }
        }
        public string Stamp { get; set; }
        public Repository[] Repositories { get; set; }
        public string CustomName { get; set; }
    }
    public class CreateTokenValidator : AbstractValidator<CreateToken>
    {
        public CreateTokenValidator()
        {
            RuleFor(x => x.Stamp).NotEmpty().MaximumLength(50);
            RuleFor(x => x.CustomName).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Repositories).NotEmpty();
            RuleForEach(x => x.Repositories).NotNull().SetValidator(new CreateTokenRepositoryValidator());
        }
    }

    class CreateTokenRepositoryValidator : AbstractValidator<CreateToken.Repository>
    {
        public CreateTokenRepositoryValidator()
        {
            RuleFor(x => x.DownloadAllowed).Must(x => !x).When(x => x.Provider != "github");
            RuleFor(x => x.Branches).NotEmpty();
            RuleForEach(x => x.Branches).NotEmpty();
        }
    }
}
