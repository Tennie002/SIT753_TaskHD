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
        sh "${NODEJS_HOME}/bin/npm  --version"
      }
    }

    stage('Install & Test') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npm install'
          sh 'npm test'
          junit 'reports/junit/*.xml'
        }
      }
    }

    stage('Code Quality') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npx eslint --format junit -o eslint-report.xml .'
          recordIssues tools: [eslint(pattern: 'eslint-report.xml')]
          withSonarQubeEnv("${SONARQUBE_SERVER}") {
            sh "sonar-scanner -Dsonar.projectKey=my-node-app -Dsonar.sources=. -Dsonar.host.url=${SONARQUBE_SERVER}"
          }
        }
      }
    }

    stage('Security') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npm audit --audit-level=high || true'
        }
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

    stage('Deploy to Staging') {
      steps {
        script {
          sh "docker stop my_node_app || true"
          sh "docker rm my_node_app || true"
          sh "docker run -d --name my_node_app -p 3000:3000 ${DOCKER_REPO}:${BRANCH_NAME}-${BUILD_NUMBER}"
        }
      }
    }

    stage('Promote to Production') {
      steps {
        input message: 'Deploy to production?'
        script {
          def prodTag = "${DOCKER_REPO}:prod"
          docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
            sh "docker pull ${DOCKER_REPO}:${BRANCH_NAME}-${BUILD_NUMBER}"
            sh "docker tag ${DOCKER_REPO}:${BRANCH_NAME}-${BUILD_NUMBER} ${prodTag}"
            sh "docker push ${prodTag}"
          }
        }
      }
    }

    stage('GitHub Release') {
      steps {
        withCredentials([string(credentialsId: GITHUB_TOKEN_CRED, variable: 'GH_TOKEN')]) {
          sh '''
          curl -X POST https://api.github.com/repos/your-username/your-repo/releases \
          -H "Authorization: token $GH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"tag_name\": \"v${BUILD_NUMBER}\", \"name\": \"Release v${BUILD_NUMBER}\", \"body\": \"Auto-generated release for build ${BUILD_NUMBER}\", \"draft\": false, \"prerelease\": false}"
          '''
        }
      }
    }

    stage('Monitoring') {
      steps {
        script {
          def code = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health', returnStdout: true).trim()
          if (code != '200') {
            error "Health check failed, got ${code}"
          }
        }
      }
    }
  }

  post {
    always {
      cleanWs()
      sh 'docker image prune -f || true'
    }
    success {
      echo 'Pipeline finished successfully'
    }
    failure {
      echo 'Pipeline failed, see logs for details'
    }
  }
}
// This Jenkinsfile defines a CI/CD pipeline for a Node.js application.
