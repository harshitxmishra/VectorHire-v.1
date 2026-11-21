# Fetch Latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 Compute Instance running NestJS API + BullMQ Workers + Redis via Docker Compose
resource "aws_instance" "vectorhire_backend" {
  ami                  = data.aws_ami.amazon_linux_2023.id
  instance_type        = var.ec2_instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -ex

              # 1. Update OS and install Docker & Git
              dnf update -y
              dnf install -y docker git

              # 2. Start and enable Docker daemon
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user

              # 3. Install Docker Compose v2
              mkdir -p /usr/local/lib/docker/cli-plugins
              curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
              chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
              ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose

              # 4. Create App directory and Docker Compose deployment
              mkdir -p /opt/vectorhire
              cd /opt/vectorhire

              cat << 'DOCKER_EOF' > docker-compose.yml
              version: '3.8'
              services:
                redis:
                  image: redis:7-alpine
                  container_name: vectorhire-redis
                  restart: always
                  ports:
                    - "6379:6379"
                  volumes:
                    - redis_data:/data
                  command: redis-server --appendonly yes

                backend:
                  image: node:22-alpine
                  container_name: vectorhire-backend
                  restart: always
                  working_dir: /app
                  ports:
                    - "4000:4000"
                  environment:
                    - NODE_ENV=production
                    - PORT=4000
                    - REDIS_URL=redis://redis:6379
                  depends_on:
                    - redis

              volumes:
                redis_data:
              DOCKER_EOF

              # 5. Bootstrap Docker Compose service
              docker-compose up -d
              EOF

  tags = {
    Name = "VectorHire-Backend-Worker-${var.environment}"
  }
}
