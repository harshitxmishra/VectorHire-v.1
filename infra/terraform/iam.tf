# Least-Privilege IAM Policy for VectorHire Storage Access
resource "aws_iam_policy" "s3_access_policy" {
  name        = "VectorHire-S3-Access-${var.environment}"
  description = "Scoped least-privilege IAM policy granting access strictly to VectorHire bucket objects"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.documents.arn
      },
      {
        Sid    = "ObjectCRUD"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.documents.arn}/*"
      }
    ]
  })
}

# IAM Role for EC2 Compute Node
resource "aws_iam_role" "ec2_role" {
  name = "VectorHire-EC2-Role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach Least-Privilege Policy to Role
resource "aws_iam_role_policy_attachment" "attach_s3" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "VectorHire-EC2-Profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}
