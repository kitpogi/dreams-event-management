# Form Components Usage Guide

This document provides examples of how to use the new form components.

## FormBuilder

A dynamic form builder that uses shadcn/ui Form with react-hook-form and Zod validation.

```jsx
import FormBuilder from '@/components/ui/FormBuilder';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older'),
});

const fields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your name',
    description: 'Your full legal name',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'email@example.com',
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    placeholder: 'Enter your age',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'select',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
    ],
  },
];

function MyForm() {
  const handleSubmit = (data) => {
    console.log('Form data:', data);
  };

  return (
    <FormBuilder
      fields={fields}
      schema={schema}
      onSubmit={handleSubmit}
      defaultValues={{ name: '', email: '', age: 0 }}
    />
  );
}
```

## FileUpload

File upload component with preview and drag & drop support.

```jsx
import FileUpload from '@/components/ui/FileUpload';

function MyFileUpload() {
  const [file, setFile] = useState(null);

  return (
    <FileUpload
      value={file}
      onFileChange={setFile}
      multiple={false}
      accept="application/pdf,image/*"
      maxSize={10 * 1024 * 1024} // 10MB
      label="Upload Document"
      description="Upload a PDF or image file"
      showPreview={true}
    />
  );
}
```

## ImageUpload

Image upload component with drag & drop, preview, and validation.

```jsx
import ImageUpload from '@/components/ui/ImageUpload';

function MyImageUpload() {
  const [images, setImages] = useState([]);

  return (
    <ImageUpload
      value={images}
      onImageChange={setImages}
      multiple={true}
      maxImages={5}
      maxSize={5 * 1024 * 1024} // 5MB
      label="Upload Images"
      description="Upload up to 5 images"
      acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
      minWidth={800}
      minHeight={600}
    />
  );
}
```

## RichTextEditor

Simple rich text editor for formatted text input.

```jsx
import RichTextEditor from '@/components/ui/RichTextEditor';

function MyEditor() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
      minHeight="300px"
    />
  );
}
```

## DatePicker

Date picker component using shadcn/ui Calendar.

```jsx
import DatePicker from '@/components/ui/DatePicker';
import { useState } from 'react';

function MyDatePicker() {
  const [date, setDate] = useState(null);

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      minDate={new Date()}
      label="Select Date"
      description="Choose a date"
      placeholder="Pick a date"
    />
  );
}
```

## TimePicker

Time picker component.

```jsx
import TimePicker from '@/components/ui/TimePicker';
import { useState } from 'react';

function MyTimePicker() {
  const [time, setTime] = useState('');

  return (
    <TimePicker
      value={time}
      onChange={setTime}
      label="Select Time"
      description="Choose a time"
      minTime="09:00"
      maxTime="17:00"
      step={30} // 30 minutes
    />
  );
}
```

## DateTimePicker

Combined date and time picker.

```jsx
import DateTimePicker from '@/components/ui/DateTimePicker';
import { useState } from 'react';

function MyDateTimePicker() {
  const [dateTime, setDateTime] = useState(null);

  return (
    <DateTimePicker
      value={dateTime}
      onChange={setDateTime}
      label="Select Date & Time"
      description="Choose date and time"
      minDate={new Date()}
    />
  );
}
```

## FormFieldWrapper

Enhanced form field wrapper with visual validation feedback.

```jsx
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { Input } from '@/components/ui/Input';
import { useFormContext } from 'react-hook-form';

function MyFormField() {
  const { formState } = useFormContext();
  const error = formState.errors.email;

  return (
    <FormFieldWrapper
      label="Email"
      description="Enter your email address"
      error={error?.message}
      showSuccess={!error && formState.touchedFields.email}
      successMessage="Email looks good!"
      required
    >
      <Input type="email" />
    </FormFieldWrapper>
  );
}
```

## Integration with react-hook-form

All components can be integrated with react-hook-form:

```jsx
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import ImageUpload from '@/components/ui/ImageUpload';
import DatePicker from '@/components/ui/DatePicker';

function MyForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onImageChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

