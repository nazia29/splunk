import * as secretsmanager from 'ets-cdk-lib/aws-secretsmanager';
import * as ets from '@ets/ets-cdk-lib'; 
import { Construct } from 'aws-cdk-lib/constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// Define the properties for your SplunkInstallerConstruct
interface SplunkInstallerProps {
  readonly splunkDomain: string;
  readonly splunkVersion?: string;
  readonly jfrogRepoUrl?: string;
}

// Retrieve secrets from AWS Secrets Manager
const jfrogSecret = secretsmanager.Secret.fromSecretArn(
  this,
  'JFrogSecret',
  `arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:ets-\${props.env.id}-\${props.env.airportCode}-splunk-secrets`
);

// Access the secret values within your SplunkInstallerConstruct
const jfrogUsername = jfrogSecret.secretValueFromJson('username');
const jfrogPassword = jfrogSecret.secretValueFromJson('password');

// Define the SplunkInstallerConstruct class
export class SplunkInstallerConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SplunkInstallerProps) {
    super(scope, id);

    // Define the user data script to install Splunk Forwarder via YUM
    const splunkInstallScript = `
      #!/bin/bash
      # Install Splunk Forwarder from JFrog repository via YUM

      # Set up JFrog repository URL and authentication
      JFROG_REPO_URL="${props.jfrogRepoUrl}"  # Use the provided Jfrog repository URL

      # Use the retrieved JFrog username and password
      JFROG_USERNAME="${jfrogUsername}"
      JFROG_PASSWORD="${jfrogPassword}"

      # Configure YUM to use the JFrog repository
      cat <<EOF > /etc/yum.repos.d/splunk.repo
      [splunk]
      name=Splunk Forwarder Repository
      baseurl=\${JFROG_REPO_URL}
      enabled=1
      gpgcheck=0
      repo_gpgcheck=0
      EOF

      # Install Splunk Forwarder
      yum install -y splunkforwarder

      # Start Splunk Forwarder on boot
      systemctl enable splunk
      systemctl start splunk
    `;
