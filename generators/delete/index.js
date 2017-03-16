'use strict';

var _ = require('lodash');
var glob = require("glob");
var path = require('path');
var s = require('underscore.string');
var yeoman = require('yeoman-generator');
var fs = require('fs-extra')

var logger = require('../app/logger');
var utils = require('../app/utils');

function getCompChoices(path) {
  let cpNames = fs.readdirSync(path);

  return cpNames
    .filter(cpName => cpName.indexOf('index.js') === -1)
    .map(cpName => {
      return {
        name: cpName,
        value: cpName
      }
    });
}



module.exports = yeoman.Base.extend({

  // 询问删除种类
  prompting() {
    let prompts = [{
      type: 'list',
      name: 'deletetype',
      message: 'delete which component?',
      choices: [{ name: 'components', value: 'components' }, { name: 'directives', value: 'directives' }],
      default: ['components']
    }];

    return this.prompt(prompts).then(props => {
      this.deleteType = props.deletetype;
    });
  },

  // 询问名称
  promptingAgain() {
    let deleteType = this.deleteType;
    let path = `./src/${deleteType}/`;

    // 获取选项列表
    let choices = getCompChoices(path);
    if (choices.length === 0) {
      console.log(`You don\'t have any ${deleteType}. Bye.`);
      return;
    }

    // 弹出信息
    let prompts = [{
      type: 'list',
      name: 'deletename',
      message: `delete which ${deleteType}?`,
      choices: choices,
      default: choices[0].name
    }];

    return this.prompt(prompts).then(props => {
      let compName = props.deletename,
        componentName = s(compName).underscored().slugify().value(), // => demo-user
        camelComponentName = s(componentName).camelize().value(), // => demoUser
        firstCapCamelComponentName = s(camelComponentName).capitalize().value(), // => DemoUser
        indexFilePath = `src/${deleteType}/index.js`,
        deleteKeyWord = `${camelComponentName},`,
        compPath = `src/${deleteType}/${compName}/`,
        examplePath = `examples/${deleteType}/${compName}/`,
        exampleIndexHtml = 'examples/index.html',
        htmlDeleteKeyWord = `examples/${deleteType}/${compName}/index.html`,
        webpackConfigPath = 'conf/webpack.config.dev.js',
        wpDeleteKeyWord = `'${deleteType}', '${compName}', 'index.`,
        deleteKeyWord2;

      // component 和 directive 要删除的行的keyword不同
      if (deleteType === 'components') {
        deleteKeyWord2 = `import ${camelComponentName} from`;
      } else {
        deleteKeyWord2 = `import './${compName}/index'`;
      }

      logger.log('============ delete start =============')

      fs.removeSync(compPath);
      logger.red(`deleted ${compPath}`);

      fs.removeSync(examplePath);
      logger.red(`deleted ${examplePath}`);

      utils.deleteSome(indexFilePath, [deleteKeyWord, deleteKeyWord2]);
      logger.green(`updated ${indexFilePath}`);

      utils.deleteSome(exampleIndexHtml, [htmlDeleteKeyWord], true);
      logger.green(`updated ${exampleIndexHtml}`);

      utils.deleteSome(webpackConfigPath, [wpDeleteKeyWord]);
      logger.green(`updated ${webpackConfigPath}`);

      logger.log('============ delete end =============');
    });
  }
});
