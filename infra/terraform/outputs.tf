output "s3_bucket_name" {
  description = "The name of the private S3 storage bucket"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_arn" {
  description = "The ARN of the private S3 storage bucket"
  value       = aws_s3_bucket.documents.arn
}

output "iam_role_arn" {
  description = "The ARN of the IAM role granted scoped S3 access"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_id" {
  description = "The ID of the EC2 compute instance"
  value       = aws_instance.vectorhire_backend.id
}

output "ec2_public_ip" {
  description = "The public IPv4 address of the VectorHire compute instance"
  value       = aws_instance.vectorhire_backend.public_ip
}
