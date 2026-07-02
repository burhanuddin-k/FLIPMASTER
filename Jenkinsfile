pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/html"
    }

    options {
        timestamps()
    }

    stages {

        stage('Checkout Source') {
            steps {
                echo "Using source code checked out by Jenkins."
            }
        }

        stage('Verify Project') {
            steps {
                sh '''
                echo "Current Directory:"
                pwd

                echo "Project Files:"
                ls -la

                if [ ! -f index.html ]; then
                    echo "ERROR: index.html not found!"
                    exit 1
                fi

                echo "Project verification successful."
                '''
            }
        }

        stage('Clean Deployment Folder') {
            steps {
                sh '''
                echo "Cleaning old website..."
                sudo rm -rf ${DEPLOY_DIR}/*
                '''
            }
        }

        stage('Deploy Website') {
            steps {
                sh '''
                echo "Deploying website..."

                sudo cp -r ./* ${DEPLOY_DIR}/

                echo "Deployment completed."
                '''
            }
        }

        stage('Set Permissions') {
            steps {
                sh '''
                sudo chown -R www-data:www-data ${DEPLOY_DIR}
                sudo chmod -R 755 ${DEPLOY_DIR}
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                echo "Checking website..."

                sleep 5

                curl http://localhost | head
                '''
            }
        }
    }

    post {

        success {
            echo "======================================"
            echo "FlipMaster deployed successfully!"
            echo "======================================"
        }

        failure {
            echo "======================================"
            echo "Pipeline Failed!"
            echo "======================================"
        }

        always {
            cleanWs()
        }
    }
}