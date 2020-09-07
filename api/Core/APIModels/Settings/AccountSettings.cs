using FluentValidation;

namespace Core.APIModels.Settings
{
    public class AccountSettings
    {
        public string Email { get; set; }
    }
	public class AccountSettingsValidator : AbstractValidator<AccountSettings>
	{
		public AccountSettingsValidator()
		{
			RuleFor(x => x.Email).EmailAddress().MaximumLength(100);
		}
	}
}
