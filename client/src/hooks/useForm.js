import { useState } from 'react';

export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (event) => {
      const value = event.target.value;
      setValues((previous) => ({ ...previous, [name]: value }));
      setErrors((previous) => ({ ...previous, [name]: '' }));
    },
  });
  function validate(nextErrors, form) {
    setErrors(nextErrors);
    const first = Object.keys(nextErrors).find((key) => nextErrors[key]);
    if (first)
      requestAnimationFrame(() => form.elements.namedItem(first)?.focus());
    return !first;
  }
  return { values, setValues, errors, setErrors, bind, validate };
}
