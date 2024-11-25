import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class OpennextCdkStandalonePocStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create S3 Bucket for Static Assets
    const staticAssetsBucket = new s3.Bucket(this, "StaticAssetsBucket", {
      bucketName: `opennext-static-assets-bucket-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Step 2: Upload Static Assets to S3
    new s3deploy.BucketDeployment(this, "DeployStaticAssets", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../next-app/.open-next/assets"))],
      destinationBucket: staticAssetsBucket,
    });

    // Step 3: Create Lambda Function for SSR
    const serverFunction = new lambda.Function(this, "ServerFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../next-app/.open-next/server-functions")),
    });

    // Step 4: Create Lambda Function for Image Optimization
    const imageFunction = new lambda.Function(this, "ImageOptimizationFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../next-app/.open-next/image-optimization-function")),
    });

    // Step 5: Create API Gateway for SSR Lambda
    const serverApi = new apigateway.LambdaRestApi(this, "ServerApi", {
      handler: serverFunction,
    });

    // Step 6: Create API Gateway for Image Optimization Lambda
    const imageApi = new apigateway.LambdaRestApi(this, "ImageApi", {
      handler: imageFunction,
    });

    // Step 7: Create CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(staticAssetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        "/_next/data/*": {
          origin: new cloudfrontOrigins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", serverApi.url))),
        },
        "/_next/image/*": {
          origin: new cloudfrontOrigins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", imageApi.url))),
        },
      },
    });

    // Step 8: Output CloudFront Distribution URL
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "CF app distribution URL",
    });

    new cdk.CfnOutput(this, "ServerApiURL", {
      value: serverApi.url,
      description: "Server API Gateway URL",
    });

    new cdk.CfnOutput(this, "ImageApiURL", {
      value: imageApi.url,
      description: "Image Optimization API Gateway URL",
    });
  }
}
