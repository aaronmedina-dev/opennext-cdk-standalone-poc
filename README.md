# Proof of Concept: Serverless Next.js (page router) Application on AWS using [cdk-nextjs](https://github.com/jetbridge/cdk-nextjs/)

Aaron Medina | [GitHub](https://github.com/aaronmedina-dev) | [Linkedin](https://www.linkedin.com/in/aamedina/)

## Overview

This guide explains how to deploy a Next.js (page router) application on AWS with **cdk-nextjs-standalone**. It supports:

- **Server-side rendering (SSR)** for dynamic content.
- **Dynamic routing** for flexible URLs.
- **Image optimization** for performance.
- **Static assets** such as JSON files, served via CloudFront

The architecture leverages **AWS Lambda**, **CloudFront**, and **S3** to provide a scalable and serverless deployment.

## References
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext Documentation](https://opennext.js.org/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [cdk-nextjs-standalone GitHub](https://github.com/jetbridge/cdk-nextjs/)
- [cdk-nextjs-standalone ConstructHub](https://constructs.dev/packages/cdk-nextjs-standalone/)

## Recommended Set-up from [OpenNext](https://opennext.js.org/aws/inner_workings/architecture)

![OpenNext Architecture](assets/opennext-architecture.png)

More information about the components [here](https://opennext.js.org/aws/inner_workings/architecture)

## PoC Output

![PoC Output](assets/poc_output.png)

---

# Set-up and Core Implementation

## Prerequisites

### Required Tools
- **AWS CLI**: For deploying resources to AWS.
- **Node.js**: To run and build the Next.js app.
- **AWS CDK**: To define and deploy the infrastructure.

### Commands to Set Up Your Environment
1. Install AWS CLI and configure it:
   ```bash
   aws configure
   ```

2. Install Node.js (LTS version) and AWS CDK:
   ```bash
   npm install -g aws-cdk
   ```

3. Verify installation:
   ```bash
   aws --version
   node -v
   cdk --version
   ```

---

## Step 1: Initialize the CDK Project

1. Create a project directory:
   ```bash
   mkdir serverless-nextjs-poc && cd serverless-nextjs-poc
   ```

2. Initialize the CDK project in TypeScript:
   ```bash
   cdk init app --language=typescript
   ```

3. Install the required CDK dependencies:
   ```bash
   npm install aws-cdk-lib constructs cdk-nextjs-standalone
   ```

---

## Step 2: Create and Configure the Next.js Application

### Step 2.1: Create and Configure the App

1. Create the Next.js app:
   ```bash
   npx create-next-app@latest nextjs-app --typescript
   ```

2. Navigate to the app directory:
   ```bash
   cd nextjs-app
   ```

3. Delete the `src/app` directory if it exists:
   ```bash
   rm -rf src/app
   ```

4. Add `next.config.js` for standalone mode and image optimization:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone', 
     // add image optimisation allowed width
     images: {
           // Define allowed image sizes
           deviceSizes: [320, 420, 768, 1024, 1200], // for <Image /> responsive sizes
           imageSizes: [16, 32, 48, 64, 128, 256, 384, 500, 1000], // explicitly add allowed sizes
           dangerouslyAllowSVG: true, // Enable SVG optimization
           contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // CSP
     }, 
   }; 
   module.exports = nextConfig;
   ```

### Step 2.2: Add Global Styles

1. Create (if not existing) or update the global CSS file:
   ```bash
    mkdir -p src/styles && touch src/styles/globals.css
   ```

2. Add the following to `globals.css`:

   ```css
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh; /* Full viewport height */
      margin: 0; /* Remove default browser margin */
      color: var(--foreground);
      background: var(--background);
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
   ```

3. Import the global CSS in `pages/_app.tsx`:

   ```tsx
    import "@/styles/globals.css";
    import type { AppProps } from "next/app";

    export default function App({ Component, pageProps }: AppProps) {
      return <Component {...pageProps} />;
    }
   ```

### Step 2.3: Add Local Styles

1. Create (if not existing) or update Home.module.css:

   ```bash
   touch src/styles/Home.module.css
   ```

2. Add/replace the following to `Home.module.css`:

   ```css
    .container {
        font-family: Arial, sans-serif;
        padding: 20px;
        max-width: 900px;
        text-align: center;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .header {
        margin-bottom: 20px;
    }

    .header h1 {
        color: #0070f3;
        font-size: 2rem;
        margin-bottom: 10px;
    }

    .header p {
        color: #666;
        font-size: 1.1rem;
    }

    .main {
        padding: 20px 0;
    }

    .imageComparison h2 {
        margin-bottom: 10px;
        color: #333;
    }

    .imageComparison p {
        margin-bottom: 20px;
        color: #555;
    }

    .imageContainer {
        display: flex;
        justify-content: center;
        gap: 20px;
    }

    .imageContainer div {
        text-align: center;
    }

    .image {
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .links h2 {
        margin-bottom: 10px;
    }

    .link {
        color: #0070f3;
        text-decoration: none;
        margin-top: 10px;
    }

    .link:hover {
        text-decoration: underline;
    }

    .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.9rem;
        color: #999;
    }

    .label {
        display: block;
        margin-bottom: 8px;
        font-size: 1rem;
        color: #333;
    }

    .input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        margin-right: 8px;
        outline: none;
        width: 200px;
    }

    .input:focus {
        border-color: #0070f3;
        box-shadow: 0 0 4px rgba(0, 112, 243, 0.3);
    }

    .button {
        padding: 8px 16px;
        background-color: #0070f3;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
    }

    .button:hover {
        background-color: #005bb5;
    }

    .button:disabled {
        background-color: #ddd;
        cursor: not-allowed;
    }
   ```

---

## Step 3: Add Image and Pages to the Application

### 1. Homepage: `nextjs-app/src/pages/index.tsx`
  ```tsx
    import { useState, useEffect } from 'react';
    import Image from 'next/image';
    import Link from 'next/link';
    import { useRouter } from 'next/router';
    import styles from '../styles/Home.module.css'; // Styling for the page

    const Home: React.FC = () => {
        const [apiParam, setApiParam] = useState(''); // State to store the parameter
        const router = useRouter(); // Hook for programmatic navigation

        // Function to redirect to the API route with the correct query parameter
        const handleRedirect = () => {
            if (apiParam.trim()) {
                // Redirect to /api/hello?name=<parameter>
                router.push(`/api/hello?name=${encodeURIComponent(apiParam)}`);
            }
        };


        const [staticData, setStaticData] = useState<{ title: string; description: string } | null>(null);

        useEffect(() => {
            // Fetch the static JSON file
            fetch('/static/data.json')
                .then((response) => response.json())
                .then((data) => setStaticData(data));
        }, []);

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    {/* Consumtption of static data */}
                    <h1>{staticData?.title || 'Loading...'}</h1>
                    <p>{staticData?.description || 'Fetching static data...'}</p>
                </header>

                <main className={styles.main}>
                    {/* Image Optimization Example */}
                    <section className={styles.imageComparison}>
                        <h2>Image Optimisation Example</h2>
                        <p>
                            Below is an example of Next.js image optimisation: the same image
                            rendered at <strong>different quality levels</strong>.
                        </p>
                        <div className={styles.imageContainer}>
                            <div>
                                <Image
                                    src="/test-image.jpg"
                                    alt="Optimisedd Image (Quality: 1)"
                                    width={500}
                                    quality={1}
                                    className={styles.image}
                                />
                                <p>Width:500 Quality: 1</p>
                            </div>
                            <div>
                                <Image
                                    src="/test-image.jpg"
                                    alt="Optimisedd Image (Quality: 100)"
                                    width={500}
                                    quality={100}
                                    className={styles.image}
                                />
                                <p>Width:500 Quality: 100</p>
                            </div>
                        </div>
                        <br />
                        <div className={styles.imageContainer}>
                            <div>
                                <Image
                                    src="/test-image.jpg"
                                    alt="Optimisedd Image (Quality: 1)"
                                    width={256}
                                    quality={1}
                                    className={styles.image}
                                />
                                <p>Width:256 Quality: 1</p>
                            </div>
                            <div>
                                <Image
                                    src="/test-image.jpg"
                                    alt="Optimisedd Image (Quality: 100)"
                                    width={256}
                                    quality={100}
                                    className={styles.image}
                                />
                                <p>Width:256 Quality: 100</p>
                            </div>
                        </div>
                    </section>

                    {/* Explore More Links */}
                    <section className={styles.links}>
                        <br />
                        <h2>Explore More</h2>
                        <p>
                            <Link href="/ssr" className={styles.link}>
                                Server-Side Rendering (SSR) page demo.
                            </Link>
                        </p>
                        <br />
                        <p>
                            <Link href="/dynamic/example" className={styles.link}>
                                Dynamic route with slug:<strong>example</strong> demo.
                            </Link>
                        </p>
                        <br />
                        <p>
                            {/* Textbox and button for API parameter */}
                            <label htmlFor="apiParam" className={styles.label}>
                                API Demo. Enter a parameter to test API route:
                            </label>
                            <input
                                type="text"
                                id="apiParam"
                                className={styles.input}
                                value={apiParam}
                                onChange={(e) => setApiParam(e.target.value)}
                                placeholder="Enter Name"
                            />
                            <button
                                className={styles.button}
                                onClick={handleRedirect}
                                disabled={!apiParam.trim()}
                            >
                                Go to API Page
                            </button>
                        </p>
                    </section>
                </main>

                <footer className={styles.footer}>
                    <p>Built with ❤️ using Next.js, TypeScript, and AWS.</p>
                </footer>
            </div>
        );
    };

    export default Home;
  ```

### 2. SSR Example

  Create a new page: `nextjs-app/src/pages/ssr.tsx`

  ```tsx
  import { GetServerSideProps } from 'next';

  export const getServerSideProps: GetServerSideProps = async () => {
      return {
          props: { message: 'Hello from SSR!' },
      };
  };

  const SSRPage: React.FC<{ message: string }> = ({ message }) => {
      return (
          <div>
              <h1>Server-Side Rendering</h1>
              <p>{message}</p>
          </div>
      );
  };

  export default SSRPage;
  ```

### 3. Dynamic Route Example

  Create dynamic folder and [slug].tsx

  ```bash
  mkdir -p src/dynamic && touch src/dynamic[slug].tsx
  ```

  Add the code in [slug].tsx

  ```tsx
  import { GetServerSideProps } from 'next';

  interface DynamicPageProps {
      slug: string;
  }

  export const getServerSideProps: GetServerSideProps = async (context) => {
      const { slug } = context.params as { slug: string };
      return {
          props: { slug },
      };
  };

  const DynamicPage: React.FC<DynamicPageProps> = ({ slug }) => {
      return (
          <div>
              <h1>Dynamic Routing</h1>
              <p>You visited the dynamic route: {slug}</p>
          </div>
      );
  };

  export default DynamicPage;
  ```

### 4. API Example

  Create a file named `hello.ts` in the `nextjs-app/src/pages/api/` directory:

  ```bash
  mkdir -p src/pages/api && touch src/pages/api/hello.ts
  ```

  Add the ff code to `hello.ts`

  ```tsx
    import { NextApiRequest, NextApiResponse } from 'next';

    export default function handler(req: NextApiRequest, res: NextApiResponse) {
        const { name } = req.query;

        // Return a greeting based on the name provided in the query string
        res.status(200).json({
            message: `Hello, ${name || 'World'}! Welcome to the API.`,
        });
    }
  ```

### 5. Image Optimisation Example 

  Add `test-image.jpg` test image to `nextjs-app/public` folder

### 6. /_next/data/* Example

  Add a Dynamic Route to Generate `/_next/static/*`

  Dynamic routes in Next.js automatically generate JSON files in the /_next/static/* path. These files contain server-rendered or pre-fetched data.

  Add a new dynamic page dynamic/page-ssr.tsx:

  ``` bash
  touch src/pages/dynamic/page-ssr.tsx
  ```

### 7. Static File Example

  Create a static JSON file in the `public/static` directory:

  ```bash
  mkdir -p public/static && touch public/static/data.json
  ```
  
  Add the sample content to `data.json`

  ```json
  {
    "title": "Welcome to Next.js!",
    "description": "This is a static JSON file served from CloudFront."
  }
  ```

---

## Step 4: Configure the CDK Stack

  Update the CDK stack in `lib/serverless-nextjs-poc-stack.ts`:
  
  ```typescript
  import { Stack, StackProps } from 'aws-cdk-lib';
  import { Construct } from 'constructs';
  import { Nextjs } from 'cdk-nextjs-standalone';

  export class ServerlessNextjsPocStack extends Stack {
      constructor(scope: Construct, id: string, props?: StackProps) {
          super(scope, id, props);

          new Nextjs(this, 'NextjsSite', {
            nextjsPath: './nextjs-app', // Path to the built Next.js app
          });
      }
  }
  ```

### 1. Bootstrap the AWS environment:
  ```bash
  cdk bootstrap
  ```

### 2. Deploy the stack:
  ```bash
  cdk deploy
  ```

---

## Step 5: Testing Components

1. **Homepage**: Visit `https://<cloudfront-id>/`

2. **SSR Example**: Visit `https://<cloudfront-id>/ssr`

3. **Dynamic Route**: Visit `https://<cloudfront-id>/dynamic/example`

4. **API Example**: Via `curl` command or accessing `http://<cloudfront-id>/api/hello?name=<Name>` or via Homepage

5. **Image Optimization**: Viewable in Homepage or you can play with width (w) and quality (q) parameters in `https://<cloudfront-id>/_next/image?url=%2Ftest-image.jpg&w=500&q=100`

    Width parameters should be in the explicitly allowed imageSizes in your `next.config.js`
    
    ```perl
    https://<cloudfront-id>/_next/image?url=%2test-image.jpg&w=500&q=75
    ```

6. **/_next/static/**: `https://<your-cloudfront-id>/dynamic/page-ssr?slug=test`
    
    The JSON file should contain:

    ```json
    {
      "pageProps": {
          "data": "Dynamic SSR content for slug: test"
      }
    }
    ```

    You can also open your browser’s developer tools and look at the Network tab. Find the /_next/static/* request, which serves the JSON file for this page.


7. **Static File**: Static data has been consumed in Homepage.


# Warmer Implementation - WIP

### Adding Warmer Components

See diagram above for the architecture.

1. Update code in `lib/serverless-nextjs-poc-stack.ts`

    ```typescript
        import { Stack, StackProps, Duration } from 'aws-cdk-lib';
        import { Construct } from 'constructs';
        import { Nextjs } from 'cdk-nextjs-standalone';
        import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
        import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
        import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

        export class ServerlessNextjsPocStack extends Stack {
            constructor(scope: Construct, id: string, props?: StackProps) {
                super(scope, id, props);

                const nextJsSite = new Nextjs(this, 'NextjsSite', {
                    nextjsPath: './nextjs-app', // Path to the built Next.js app
                });

                //Define Warmer Lambda Function
                const warmer = new Function(this, 'Warmer', {
                    runtime: Runtime.NODEJS_18_X,
                    handler: 'index.handler',
                    code: Code.fromInline(`
                        const https = require('https');

                        exports.handler = async function() {
                        const baseUrl = process.env.CLOUDFRONT_URL;  // Base Dynamic CloudFront URL from environment variables
                        const paths = process.env.WARMER_PATHS.split(','); // Comma-separated paths from environment variables

                        // Loop through each path and send a request to keep the corresponding Lambda warm
                        for (const path of paths) {
                            const url = \`\${baseUrl}\${path}\`;  // Construct the full URL (CloudFront URL + path)

                            // Make an HTTPS GET request to the URL
                            await new Promise((resolve, reject) => {
                            https.get(url, (res) => {
                                // Log success response for each warmed endpoint
                                console.log(\`Warmed: \${url}, Status Code: \${res.statusCode}\`);
                                resolve(); // Resolve the promise on success
                            }).on('error', (err) => {
                                // Log error if the request fails
                                console.error(\`Error warming: \${url}, \`, err);
                                reject(err); // Reject the promise on error
                            });
                            });
                        }
                        };
                            
                    `),
                    timeout: Duration.seconds(30), // Set the Lambda timeout to 30 seconds
                    environment: {
                        CLOUDFRONT_URL: `https://${nextJsSite.distribution.distributionDomain}`, // Dynamic CloudFront domain name for the Next.js app
                        WARMER_PATHS: '/api/hello', //You can add multiple paths here separated by comma
                    },
                });

                // Schedule the warmer to run every X minutes
                const warmerRule = new Rule(this, 'WarmerRule', {
                    schedule: Schedule.rate(Duration.minutes(5)),
                    targets: [new LambdaFunction(warmer)],
                });
            }
        }
    ```

    We have added here a Warmer Lambda Function and Eventbridge rule for invoking the Lambda function every X minutes.
    Paths should be added to `WARMER_PATHS:` separated by comma (,).

2. Rebuild and Deploy. 

    You should be able to see the new Rule created in Eventbridge targetting the Lambda function containing the inline script.

### Testing Warmer Components

1. Manual Invocation

    - Locate the `*WarmerFunction*` in Lambda.
    
    - Use the Test feature to invoke the function, logs should have an entry like:

    ```yaml
    INFO    Warmed: https://<cloudfront-id>/api/hello, Status Code: 200
    ```




# ISR Revalidation Implementation - WIP

To follow.

---

## Additional Information

### Common Issues

- **Image Optimization Errors**:
  - Ensure image widths and types are allowed in `next.config.js`.

- **CloudFront Cache**:
  - If updates are not visible, invalidate the CloudFront cache:
    ```bash
    aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_ID> --paths "/*"
    ```

---