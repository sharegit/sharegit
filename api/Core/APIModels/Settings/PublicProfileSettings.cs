using FluentValidation;
using System;

namespace Core.APIModels.Settings
{
    public class PublicProfileSettings
    {
        public string DisplayName { get; set; }
        public string Url { get; set; }
        public string Bio { get; set; }
    }

    public class PublicProfileSettingsValidator : AbstractValidator<PublicProfileSettings>
    {
        public PublicProfileSettingsValidator()
        {
            RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100).When(x => x.DisplayName != null);
            RuleFor(x => x.Url).Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _)).When(x => !string.IsNullOrEmpty(x.Url)).MaximumLength(100);
            RuleFor(x => x.Bio).MaximumLength(200);
        }
    }
}
