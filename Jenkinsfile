#!groovy
pipeline {
    agent { label 'linux' }

    environment {
         API_DEPLOY_DIR = "/var/www/sharegithub/api/"
         WEB_DEPLOY_DIR = "/var/www/sharegithub/web/"
         JENKINS_CRED = credentials('jenkins-centos-user-password')
    }

    stages {
        stage('Publish backend') {
            steps {
                sh '''
                    echo $JENKINS_CRED_PSW | sudo -S systemctl stop sharegithub
                    dotnet publish api/WebAPI/WebAPI.csproj -o $API_DEPLOY_DIR
                    echo $JENKINS_CRED_PSW | sudo -S systemctl start sharegithub
                '''
            }
        }
        stage('Publish fronend') {
            steps {
                dir("web") {
                    sh '''
                        yarn install
                        yarn build
                        echo $JENKINS_CRED_PSW | sudo -S cp -R public/ $WEB_DEPLOY_DIR
                    '''
                }
            }
        }
    }
}