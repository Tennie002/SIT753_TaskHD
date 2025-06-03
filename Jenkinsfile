// Jenkinsfile – fixed Declarative syntax

pipeline {
  agent any

  /* Automatically install Node.js and add it to PATH */
  tools {
    nodejs 'nodejs-lts'            // <-- name as defined in Global Tool Configuration
  }

  environment {
    /* Quality */
    SONARQUBE_SERVER   = 'SonarQubeServer'

    /* Docker */
    IMAGE_NAME         = 'my_node_app'
    DOCKER_REGISTRY    = 'docker.io'
    DOCKER_REPO        = "your_dockerhub_username/${IMAGE_NAME}"
    DOCKER_CREDENTIALS = 'docker_hub_credentials_id'

    /* GitHub release */
    GITHUB_TOKEN_CRED  = 'github_token'
  }

  /* Always wipe workspace after each build */
  options {
    cleanWs()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'node --version'
        sh 'npm  --version'
      }
    }

    stage('Install and Test') {
      steps {
        sh 'npm install'
        sh 'npm test'
        junit 'reports/junit/*.xml'           // if you generate JUnit XML
      }
    }

    stage('Code Quality') {
      steps {
        sh 'npm run lint'
        withSonarQubeEnv("${SONARQUBE_SERVER}") {
          sh """
            sonar-scanner \
              -Dsonar.projectKey=my_node_app \
              -Dsonar.sources=. \
              -Dsonar.host.url=${SONARQUBE_SERVER}
          """
        }
      }
    }

    stage('Security') {
      steps {
        sh 'npm audit --audit-level=high || true'
      }
    }

    stage('Build & Push Image') {
      steps {
        script {
          def tag = "${DOCKER_REPO}:${env.BRANCH_NAME}_${env.BUILD_NUMBER}"
          docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
            def img = docker.build(tag)
            img.push()
            img.push('latest')        // optional
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
        echo 'Add deployment commands here'
      }
    }

    stage('Monitoring') {
      steps {
        script {
          def code = sh(
            script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health',
            returnStdout: true
          ).trim()
          if (code != '200') {
            error "Health check failed – HTTP ${code}"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'
    }
    success {
      echo 'Pipeline finished successfully'
    }
    failure {
      echo 'Pipeline failed – review console output'
    }
  }
}
