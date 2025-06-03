// Jenkinsfile – combined settings with automatic workspace cleanup

pipeline {
  agent any

  environment {
    /* Tool and quality settings */
    NODEJS_HOME       = tool name: 'nodejs_lts', type: 'NodeJS'
    SONARQUBE_SERVER  = 'SonarQubeServer'

    /* Docker settings */
    IMAGE_NAME        = 'my_node_app'
    DOCKER_REGISTRY   = 'docker.io'
    DOCKER_REPO       = "your_dockerhub_username/${IMAGE_NAME}"
    DOCKER_CREDENTIALS= 'docker_hub_credentials_id'  // Jenkins credential ID

    /* GitHub release tag */
    GITHUB_TOKEN_CRED = 'github_token'               // Jenkins Secret Text ID
  }

  /* Always clean the workspace after every build */
  options {
    cleanWs()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh "${NODEJS_HOME}/bin/node --version"
        sh "${NODEJS_HOME}/bin/npm  --version"
      }
    }

    stage('Install_and_Test') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npm install'
          sh 'npm test'
          junit 'reports/junit/*.xml'           // if your tests generate JUnit XML
        }
      }
    }

    stage('Code_Quality') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
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
    }

    stage('Security') {
      steps {
        withEnv(["PATH+NODE=${env.NODEJS_HOME}/bin"]) {
          sh 'npm audit --audit-level=high || true'
        }
      }
    }

    stage('Build_and_Push_Image') {
      steps {
        script {
          def fullTag = "${DOCKER_REPO}:${env.BRANCH_NAME}_${env.BUILD_NUMBER}"
          docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
            def img = docker.build(fullTag)
            img.push()             // push unique tag
            img.push('latest')     // optional: update latest
          }
        }
      }
    }

    stage('Create_Release_Tag') {
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
        echo 'Add deployment logic here (ssh, kubectl, etc.)'
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
            error "Health check failed code ${code}"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'          // reclaim disk space
    }
    success {
      echo 'Pipeline completed successfully'
    }
    failure {
      echo 'Pipeline failed see logs for details'
    }
  }
}
