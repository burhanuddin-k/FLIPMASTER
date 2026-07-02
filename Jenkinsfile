pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/html"
    }

    options {
        timestamps()
    }

    stages {

        stage('Verify Checkout') {
            steps {
                sh '''
                    echo "===== WORKSPACE ====="
                    pwd

                    echo "===== FILES ====="
                    ls -lah

                    test -f index.html
                '''
            }
        }

        stage('Prepare Server') {
            steps {
                sh '''
                    sudo mkdir -p ${DEPLOY_DIR}
                    sudo rm -rf ${DEPLOY_DIR:?}/*
                '''
            }
        }

        stage('Deploy Website') {
            steps {
                sh '''
                    sudo cp -r * ${DEPLOY_DIR}/
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
                    curl -I http://localhost
                '''
            }
        }

    }

    post {

        success {
            echo "SUCCESS: FlipMaster deployed."
        }

        failure {
            echo "FAILED: Deployment failed."
        }

    }
}