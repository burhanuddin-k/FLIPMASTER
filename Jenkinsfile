pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/var/www/html"
    }

    options {
        timestamps()
        skipDefaultCheckout(false)
    }

    stages {

        stage('Verify Checkout') {
            steps {
                sh '''
                echo "Current Directory:"
                pwd

                echo "Files:"
                ls -la

                if [ ! -f index.html ]; then
                    echo "ERROR: index.html not found!"
                    exit 1
                fi
            '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                echo "Deploying website..."

                sudo mkdir -p ${DEPLOY_DIR}

                sudo rm -rf ${DEPLOY_DIR:?}/*

                sudo cp -r . ${DEPLOY_DIR}/

                echo "Deployment Complete."
                '''
            }
        }

        stage('Permissions') {
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
                sleep 3

                curl -I http://localhost
                '''
            }
        }
    }

    post {

        success {
            echo "================================="
            echo "FlipMaster deployed successfully"
            echo "================================="
        }

        failure {
            echo "================================="
            echo "Pipeline Failed"
            echo "================================="
        }
    }
}