import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

export function ConfirmPassword(
    property : string ,
    validationOption?: ValidationOptions){
    return (object : any , propertyName : string) => {
        registerDecorator({
            target : object.constructor,
            propertyName , 
            options : validationOption,
            constraints : [property],
            validator : ConfirmPasswordConstraints
        })
    };
}

@ValidatorConstraint({
    name : 'confirmPassword', 
    async : false
})
export class ConfirmPasswordConstraints implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments){
        const {object , constraints} = args;
        const [property] = constraints
        const relatedValue = object[property];
        return value === relatedValue
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return "رمز عبورها با یکدیگر تطابق ندارند !"
    }
}
