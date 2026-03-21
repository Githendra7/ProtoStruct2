pipeline {
    agent any
    environment {
        AWS_ACCOUNT_ID = '625966732962'
        AWS_REGION     = 'us-east-1'
        BACKEND_REPO   = 'protostruct-backend'
        FRONTEND_REPO  = 'protostruct-frontend'
        // This must match the ID you created in Jenkins -> Credentials
        AWS_CREDS      = credentials('aws-creds') 
    }
    stages {
        stage('Install & Login') {
            steps {
                bat "aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com"
            }
        }
        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat "docker build -t %BACKEND_REPO% ."
                    bat "docker tag %BACKEND_REPO%:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/%BACKEND_REPO%:latest"
                    bat "docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/%BACKEND_REPO%:latest"
                }
            }
        }
        stage('Build Frontend') {
            steps {
                // Navigating to where your package.json is located
                dir('frontend/next-app') {
                    bat "docker build -t %FRONTEND_REPO% ."
                    bat "docker tag %FRONTEND_REPO%:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/%FRONTEND_REPO%:latest"
                    bat "docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/%FRONTEND_REPO%:latest"
                }
            }
        }
    }
    post {
        success {
            echo "Successfully pushed ProtoStruct2 images to AWS ECR!"
        }
        failure {
            echo "Deployment failed. Check the Dockerfiles or AWS Credentials."
        }
    }
}