#!/bin/bash
set -euo pipefail

# Get S3 bucket name from Terraform output
cd infra
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
cd ..

# Build the Vue app
echo "Building Vue app..."
npm run build

# Sync to S3
echo "Deploying to S3 bucket: $BUCKET_NAME"
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "Deployment completed successfully!"
echo "URL: $(cd infra && terraform output -raw cloudfront_url)"
