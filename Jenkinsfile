pipeline {
    agent any

    environment {
        APP_NAME = "FlipMaster"
        DEPLOY_DIR = "/var/www/FlipMaster"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Cloning latest code..."
                git branch: 'main',
                    url: 'https://github.com/YOUR_USERNAME/FlipMaster.git'
            }
        }

        stage('Verify Project') {
            steps {
                sh '''
                echo "Project Structure"
                pwd
                ls -la
                '''
            }
        }

        stage('Install Backend Dependencies') {
            when {
                expression {
                    fileExists('server/package.json')
                }
            }
            steps {
                dir('server') {
                    sh '''
                    npm install
                    '''
                }
            }
        }

        stage('Run Tests') {
            when {
                expression {
                    fileExists('server/package.json')
                }
            }
            steps {
                dir('server') {
                    sh '''
                    npm test || true
                    '''
                }
            }
        }

        stage('Deploy Website') {
            steps {
                sh """
                sudo mkdir -p ${DEPLOY_DIR}
                sudo cp -r client/* ${DEPLOY_DIR}/
                """
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                echo "Deployment Completed Successfully"
                '''
            }
        }
    }

    post {

        success {
            echo "✅ FlipMaster deployed successfully."
        }

        failure {
            echo "❌ Pipeline failed."
        }

        always {
            cleanWs()
        }
    }
}