const inquirer = require('inquirer');
const { writeFileSync } = require('fs');
const log = require('../utils/logger.js').logger;
const confierAscii = require('../utils/confierAscii');
const {
  cloneDeployRepo,
  cloneFilesRepo,
  installCDK,
  createConiferLocalDirectory,
} = require('../utils/coniferInit');
const ora = require('ora');
const path = require('path');
const CWD = process.cwd();
const spinner = ora();
const {
  CONIFER_ENVIRONMENT_PATH,
  CONIFER_CONFIG_FILE,
} = require('../utils/coniferConfig');

const awsQuestions = [
  {
    type: 'password',
    name: 'AWS_ACCESS_KEY',
    message: 'AWS Access Key:',
  },
  {
    type: 'password',
    name: 'AWS_SECRET',
    message: 'AWS Secret:',
  },
  {
    type: 'input',
    name: 'AWS_REGION',
    message: 'AWS Region:',
  },
];

const getAwsCred = async () => {
  log('Please provide the following AWS credentials:');
  await inquirer.prompt(awsQuestions).then(async (answers) => {
    let envStr = '';
    for (const [key, value] of Object.entries(answers)) {
      envStr += key + '=' + value + '\n';
    }
    spinner.start();
    writeFileSync(CONIFER_ENVIRONMENT_PATH, envStr);
    spinner.succeed('Credentials saved to confier environment\n');
  });
};

const initQuestions = [
  {
    type: 'input',
    name: 'testDirectory',
    message:
      'What parent folder is your test files located relative to your project folder: (e.g., ./cypress)',
  },
  {
    type: 'input',
    name: 'entryPoint',
    message: 'What is your entry point command (e.g., npm start):',
  },
  {
    type: 'input',
    name: 'parallelInstances',
    message: 'How many parallel instances do you want to provision:',
  },
  {
    type: 'list',
    name: 'ec2InstanceType',
    message: 'What type of EC2 instance do you want to provision:',
    choices: [
      { name: 't3.xlarge - 4 vCPU & 16 GiB', value: 't3.xlarge' },
      { name: 't3.2xlarge - 8 vCPU & 32 GiB', value: 't3.2xlarge' },
      { name: 'c6i.2xlarge - 8 vCPU & 16 GiB', value: 'c6i.2xlarge' },
      { name: 'c6i.4xlarge - 16 vCPU & 32 GiB', value: 'c6i.4xlarge' },
    ],
  },
  {
    type: 'list',
    name: 'parallelType',
    message: 'How would you like to parallelize the tests:',
    choices: ['File globbing', 'Timing data'],
  },
];

const gatherInfo = async () => {
  log('Please provide the following information:');
  const pwd = await inquirer.prompt({
    type: 'confirm',
    name: 'projectDirectory',
    message: 'Confirm your current working directory is your project folder:',
  });
  if (!pwd.projectDirectory) {
    log('Please go to the correct working directory then reinitialize');
    process.exit();
  } else {
    await inquirer.prompt(initQuestions).then(async (answers) => {
      const transformAns = {
        ...answers,
        testDirectory: path.join(CWD, answers.testDirectory),
      };
      writeFileSync(CONIFER_CONFIG_FILE, JSON.stringify(transformAns));
    });
  }
};

const newInit = async () => {
  await createConiferLocalDirectory();
  await getAwsCred();
  await gatherInfo();
  await cloneFilesRepo();
  await cloneDeployRepo();
  await installCDK();
};

module.exports = async () => {
  await confierAscii();
  await newInit();
};
