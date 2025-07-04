# S3 Screenshot Setup Guide

This guide explains how to set up Amazon S3 storage for displaying Puppeteer test screenshots directly in pull request comments.

## Overview

The GitHub Actions workflow can upload screenshots to an S3 bucket and display them visually in PR comments. This provides:
- Visual comparison of screenshots without downloading artifacts
- Persistent storage accessible from anywhere
- No GitHub permission issues with forks
- Better user experience for reviewing changes

## AWS S3 Setup

### 1. Create an S3 Bucket

1. Log into the AWS Console and navigate to S3
2. Create a new bucket with these settings:
   - **Bucket name**: Choose a unique name (e.g., `abundance-screenshots`)
   - **Region**: Choose your preferred region (e.g., `us-east-1`)
   - **Block Public Access**: Uncheck "Block all public access" (we need public read access for images)
   - **Bucket Versioning**: Enable (optional but recommended)

### 2. Configure Bucket Policy

Add the following bucket policy to allow public read access to screenshots:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

Replace `YOUR_BUCKET_NAME` with your actual bucket name.

### 3. Create IAM User for GitHub Actions

1. Go to IAM → Users → Create user
2. **User name**: `github-actions-abundance`
3. **Attach policies directly**: Create a custom policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
        }
    ]
}
```

4. Create access keys for this user and save them securely

## GitHub Repository Setup

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | Your S3 bucket name | `abundance-screenshots` |
| `AWS_REGION` | AWS region (optional, defaults to us-east-1) | `us-east-1` |

### Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each required secret
4. Add the secret name and value

## How It Works

### With S3 Configured
- Screenshots are uploaded to `s3://your-bucket/pr-{PR_NUMBER}/run-{RUN_NUMBER}/`
- PR comments display images directly using S3 URLs
- Side-by-side comparison tables for test vs deployed versions
- Images are publicly accessible via HTTPS URLs

### Without S3 (Fallback)
- Screenshots are stored only in GitHub workflow artifacts
- PR comments show download links to artifacts
- Users must download and extract to view images

## File Organization

Screenshots are organized in S3 as:
```
your-bucket/
├── pr-123/
│   ├── run-1/
│   │   ├── ProjectName-Test.png
│   │   ├── ProjectName-Deployed.png
│   │   └── main.png
│   └── run-2/
│       └── ...
└── pr-124/
    └── ...
```

## Cleanup

S3 objects are automatically tagged and can be cleaned up using lifecycle policies:

1. Go to your S3 bucket → Management → Lifecycle rules
2. Create a rule to delete objects after 30 days
3. This keeps storage costs minimal

## Cost Considerations

- S3 storage costs are minimal for screenshots (typically < $1/month)
- Data transfer costs apply for image viewing (typically < $1/month)
- Consider implementing lifecycle policies to automatically delete old screenshots

## Security Notes

- The S3 bucket allows public read access to enable image display in GitHub
- Only GitHub Actions can write to the bucket (via IAM permissions)
- Screenshots may contain sensitive information - consider this before enabling
- Access keys are stored securely in GitHub Secrets

## Troubleshooting

### Images Not Displaying
- Check that bucket policy allows public read access
- Verify S3 URLs are accessible in browser
- Ensure AWS credentials are correctly set in GitHub Secrets

### Permission Errors
- Verify IAM user has correct permissions
- Check AWS region matches between bucket and credentials
- Ensure bucket name is correct in secrets

### Upload Failures
- Check GitHub Actions logs for AWS error messages
- Verify AWS credentials are valid and not expired
- Ensure bucket exists and is in the specified region