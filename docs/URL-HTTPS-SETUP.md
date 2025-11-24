# ACM Certificate Setup Guide

## Overview
This guide explains how to set up SSL/TLS for your subdomain using AWS Certificate Manager (ACM).

## Prerequisites
- A domain or subdomain (e.g., `dev.yourdomain.com` or `api.yourdomain.com`)
- Access to your DNS provider to add CNAME records

## Step 1: Configure Your Domain

Edit `terraform.tfvars` and add your domain name:

```hcl
domain_name = "dev.yourdomain.com"  # Replace with your actual subdomain
```

## Step 2: Apply Terraform Configuration

Run Terraform to create the ACM certificate:

```bash
terraform plan
terraform apply
```

## Step 3: Get DNS Validation CNAME Record

After applying, Terraform will output the CNAME record needed for DNS validation:

```bash
terraform output acm_certificate_validation_records
```

The output will look like this:

```json
{
  "dev.yourdomain.com" = {
    "name"  = "_abc123.dev.yourdomain.com."
    "type"  = "CNAME"
    "value" = "_xyz456.acm-validations.aws."
  }
}
```

## Step 4: Give CNAME to DevOps

**Copy the following information to your DevOps team:**

```
CNAME Record for DNS Validation:

Name:  _abc123.dev.yourdomain.com.
Type:  CNAME
Value: _xyz456.acm-validations.aws.

Instructions: Add this CNAME record to the DNS zone for yourdomain.com
```

⚠️ **Important**: Your DevOps team needs to add this CNAME record to your DNS provider (e.g., Route 53, Cloudflare, Namecheap, etc.)

## Step 5: Wait for Validation

After the CNAME record is added to DNS:
- ACM will automatically validate the certificate (usually takes 5-30 minutes)
- The certificate status will change from "Pending Validation" to "Issued"
- The HTTPS listener on your ALB will start working

## What Was Created

1. **ACM Certificate** (`aws_acm_certificate.main`)
   - Domain: Your specified subdomain
   - Validation: DNS (CNAME record)
   - Auto-renews before expiration

2. **HTTPS Listener** (`aws_lb_listener.https`)
   - Port: 443
   - Protocol: HTTPS
   - TLS Policy: ELBSecurityPolicy-TLS13-1-2-2021-06
   - Certificate: Your ACM certificate

3. **HTTP → HTTPS Redirect**
   - All HTTP (port 80) traffic automatically redirects to HTTPS (port 443)
   - 301 permanent redirect

## Verify Certificate Status

Check the certificate status in AWS Console:
1. Go to AWS Certificate Manager
2. Find your certificate for the domain
3. Status should show "Issued" after DNS validation completes

Or use AWS CLI:
```bash
aws acm describe-certificate --certificate-arn $(terraform output -raw acm_certificate_arn)
```

## Access Your Application

Once the certificate is validated:
- **HTTPS**: `https://dev.yourdomain.com`
- **HTTP**: `http://dev.yourdomain.com` (automatically redirects to HTTPS)

## Troubleshooting

### Certificate Stuck in "Pending Validation"
- Verify the CNAME record was added correctly to DNS
- Check DNS propagation: `dig _abc123.dev.yourdomain.com CNAME`
- Wait up to 30 minutes for validation

### "No domain_name set" Error
- Make sure you added `domain_name = "your.domain.com"` to `terraform.tfvars`
- Run `terraform apply` again

### Certificate Not Working
- Ensure the certificate status is "Issued" in ACM
- Check ALB listener is using port 443
- Verify security group allows inbound traffic on port 443

## Removing the Certificate

To remove the certificate and HTTPS listener:
1. Remove or set `domain_name = ""` in `terraform.tfvars`
2. Run `terraform apply`

This will:
- Delete the HTTPS listener
- Delete the ACM certificate
- Restore HTTP-only operation on port 80
