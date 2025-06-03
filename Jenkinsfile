// Jenkinsfile  (Declarative Pipeline - combined environments)

pipeline {
  agent any

  environment {
    /* Tool & quality settings */
    NODEJS_HOME       = tool name: 'nodejs-lts', type: 'NodeJS'
    SONARQUBE_SERVER  = 'SonarQubeServer'        // configured in Manage Jenkins → Configure System

    /* Docker settings */
    IMAGE_NAME        = 'my_node_app'
    DOCKER_REGISTRY   = 'docker.io'              // Docker Hub; change if using ECR, GCR, etc.
    DOCKER_REPO       = "your-dockerhub-username/${IMAGE_NAME}"
    DOCKER_CREDENTIALS= 'docker-hub-credentials-id' // Jenkins credential ID (username-password or PAT)

    /* Git / release */
    GITHUB_TOKEN_CRED = 'github-token'           // Jenkins Secret Text with your PAT
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
          sh 'npm test'                   // makes sure tests pass
          junit 'reports/junit/*.xml'     // if your tests create JUnit XML
        }
      }
    }

    stage('Code Quality') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          // Run ESLint
          sh 'npm run lint'

          // Run SonarQube analysis
          withSonarQubeEnv("${SONARQUBE_SERVER}") {
            sh """
              sonar-scanner \
                -Dsonar.projectKey=my-node-app \
                -Dsonar.sources=. \
                -Dsonar.host.url=${SONARQUBE_SERVER} \
                -Dsonar.login=${SONARQUBE_SERVER_CREDENTIALS}
            """
          }
        }
      }
    }


    stage('Security') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npm audit --audit-level=high || true'
          // If using OWASP Dependency-Check:
          // sh 'dependency-check --project my-node-app --format HTML --scan .'
        }
      }
    }

    stage('Build & Push Docker Image') {
      steps {
        script {
          def fullTag = "${DOCKER_REPO}:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"

          docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
            def img = docker.build(fullTag)
            img.push()          // pushes the unique tag
            img.push('latest')  // optional: also push/update latest
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

    stage('Deploy (example)') {
      steps {
        echo 'Add your deploy commands here, for example ssh to a host and run the new image'
        // sshagent(['ssh-credentials-id']) { ... }
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
            error "Health check failed, got ${code}"
          }
        }
      }
    }
  }

  post {
    always {
      cleanWs()
      // optional: prune dangling images to conserve disk
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
