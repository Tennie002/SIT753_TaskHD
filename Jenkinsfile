pipeline {
  agent any
  environment {
    NODEJS_HOME       = tool name: 'nodejs-lts', type: 'NodeJS'
    SONARQUBE_SERVER  = 'SonarQubeServer'
    IMAGE_NAME        = 'my_node_app'
    DOCKER_REGISTRY   = 'docker.io'
    DOCKER_REPO       = "your-dockerhub-username/${IMAGE_NAME}"
    DOCKER_CREDENTIALS= 'docker-hub-credentials-id'
    GITHUB_TOKEN_CRED = 'github-token'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh "${NODEJS_HOME}/bin/node --version"
        sh "${NODEJS_HOME}/bin/npm --version"
      }
    }
    stage('Install & Test') {
      steps {
        sh "${NODEJS_HOME}/bin/npm install"
        sh "${NODEJS_HOME}/bin/npm test"
      }
    }
    stage('Build & Push Docker Image') {
      steps {
        script {
          def fullTag = "${DOCKER_REPO}:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
          docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
            def img = docker.build(fullTag)
            img.push()
            img.push('latest')
          }
        }
      }
    }
    stage('Release Tag') {
      steps {
        script {
          sh "git tag v${env.BUILD_NUMBER}"
          withCredentials([string(credentialsId: GITHUB_TOKEN_CRED, variable: 'GH_TOKEN')]) {
            sh 'git push origin --tags'
          }
        }
      }
    }
    stage('Deploy') {
      steps {
        echo 'Add your deploy commands here'
      }
    }
  }
  post {
    always {
      node {
        cleanWs()
      }
      sh 'docker image prune -f'
    }
  }
}