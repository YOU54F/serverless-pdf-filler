export const getEnv = (name: string, defaultValue?: string) => {
  const value = process.env[name] || defaultValue;

  // https://github.com/serverless/serverless/issues/3491
  if (value === undefined || value === "undefined") {
    throw new Error(`Environment variable '${name}' is not set`);
  } else {
    return value;
  }
};
