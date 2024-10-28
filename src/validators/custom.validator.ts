import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
export function ValidatePassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validatePassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'string' &&
            IsContainSpecialChar(value) &&
            IsContainNumber(value) &&
            IsContainUpperChar(value) &&
            IsContainLowerChar(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} does not pass the required security check`;
        },
      },
    });
  };
}

export function IsContainSpecialChar(str: string) {
  const specialCharacterRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  return specialCharacterRegex.test(str);
}

export function IsContainNumber(str: string) {
  const numberRegex = /\d/;
  return numberRegex.test(str);
}

export function IsContainUpperChar(str: string) {
  const uppercaseRegex = /[A-Z]/;
  return uppercaseRegex.test(str);
}

export function IsContainLowerChar(str: string) {
  const uppercaseRegex = /[a-z]/;
  return uppercaseRegex.test(str);
}
