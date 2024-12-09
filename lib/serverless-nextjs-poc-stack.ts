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
        const warmer = new Function(this, 'WarmerFunction', {
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
