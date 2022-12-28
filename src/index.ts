import { hello } from '#root/hello';


if (process.env.NODE_ENV.includes("development")) console.log(hello("lazuee"));