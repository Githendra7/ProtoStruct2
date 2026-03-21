pipeline {
    agent any
    environment {
        AWS_ACCOUNT_ID = '625966732962'
        // CHANGED: Fixed to match your Stockholm (eu-north-1) repository location
        AWS_REGION     = 'eu-north-1'
        BACKEND_REPO   = 'protostruct-backend'
        FRONTEND_REPO  = 'protostruct-frontend'
        // Ensure 'aws-creds' matches your ID in Jenkins -> Credentials
        AWS_CREDS      = credentials('aws-creds') 
    }
    stages {
        stage('Install & Login') {
            steps {
                // Using %VAR% syntax since your logs show you are running on a Windows Jenkins agent (bat)
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
                // Pointing to your 'next-app' directory inside frontend
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
            echo "Successfully pushed ProtoStruct2 images to AWS ECR in %AWS_REGION%!"
        }
        failure {
            echo "Deployment failed. Verify the ECR repository exists in %AWS_REGION%."
        }
    }
}
