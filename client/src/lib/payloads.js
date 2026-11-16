export function postBody(values, thumbnail) {
  const fields = {
    title: values.title.trim(),
    category: values.category,
    description: values.description,
  };
  if (!thumbnail) return fields;
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  data.append('thumbnail', thumbnail);
  return data;
}
