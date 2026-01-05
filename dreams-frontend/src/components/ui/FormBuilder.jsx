import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './form';
import { Input } from './Input';
import { Textarea } from './textarea';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';
import { cn } from '@/lib/utils';

/**
 * FormBuilder - A dynamic form builder component using shadcn/ui Form
 * 
 * @param {Object} props
 * @param {Array} props.fields - Array of field definitions
 * @param {Function} props.onSubmit - Submit handler
 * @param {Object} props.defaultValues - Default form values
 * @param {Object} props.schema - Zod schema for validation
 * @param {Object} props.className - Additional CSS classes
 * @param {Object} props.buttonProps - Props for submit button
 */
const FormBuilder = ({
  fields = [],
  onSubmit,
  defaultValues = {},
  schema,
  className,
  buttonProps = {},
  showSubmitButton = true,
  submitLabel = 'Submit',
  ...formProps
}) => {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    ...formProps,
  });

  const handleSubmit = (data) => {
    if (onSubmit) {
      onSubmit(data, form);
    }
  };

  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      placeholder,
      description,
      options = [],
      validation,
      className: fieldClassName,
      ...fieldProps
    } = field;

    return (
      <FormField
        key={name}
        control={form.control}
        name={name}
        rules={validation}
        render={({ field: formField }) => {
          switch (type) {
            case 'textarea':
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      {...formField}
                      {...fieldProps}
                    />
                  </FormControl>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );

            case 'select':
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <Select onValueChange={formField.onChange} value={formField.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={placeholder || `Select ${label}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );

            case 'checkbox':
              return (
                <FormItem className={cn('flex flex-row items-start space-x-3 space-y-0', fieldClassName)}>
                  <FormControl>
                    <Checkbox
                      checked={formField.value}
                      onCheckedChange={formField.onChange}
                      {...fieldProps}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    {label && <FormLabel>{label}</FormLabel>}
                    {description && <FormDescription>{description}</FormDescription>}
                  </div>
                  <FormMessage />
                </FormItem>
              );

            case 'switch':
              return (
                <FormItem className={cn('flex flex-row items-center justify-between rounded-lg border p-4', fieldClassName)}>
                  <div className="space-y-0.5">
                    {label && <FormLabel>{label}</FormLabel>}
                    {description && <FormDescription>{description}</FormDescription>}
                  </div>
                  <FormControl>
                    <Switch
                      checked={formField.value}
                      onCheckedChange={formField.onChange}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );

            case 'radio':
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <FormControl>
                    <RadioGroup
                      onValueChange={formField.onChange}
                      value={formField.value}
                      {...fieldProps}
                    >
                      {options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <label
                            htmlFor={option.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );

            case 'number':
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={placeholder}
                      {...formField}
                      onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
                      {...fieldProps}
                    />
                  </FormControl>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );

            case 'email':
            case 'password':
            case 'tel':
            case 'url':
            case 'date':
            case 'time':
            case 'datetime-local':
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <FormControl>
                    <Input
                      type={type}
                      placeholder={placeholder}
                      {...formField}
                      {...fieldProps}
                    />
                  </FormControl>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );

            default:
              return (
                <FormItem className={fieldClassName}>
                  {label && <FormLabel>{label}</FormLabel>}
                  <FormControl>
                    <Input
                      type={type}
                      placeholder={placeholder}
                      {...formField}
                      {...fieldProps}
                    />
                  </FormControl>
                  {description && <FormDescription>{description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              );
          }
        }}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', className)}>
        {fields.map((field) => renderField(field))}
        
        {showSubmitButton && (
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            {...buttonProps}
          >
            {form.formState.isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default FormBuilder;

