'use strict';
var alflogo = require('alfresco-logo');
var yeoman = require('yeoman-generator');
var githubUsername = require('github-username');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = yeoman.Base.extend({

  initializing: function() {
    this.props = {
      licenseHeader: '',
      licenseChecker: false
    };

    if (this.options.alfresco) {
      this.props.licenseHeader = this.fs.read(path.join(__dirname, './alfresco-license-header.ts'));
      this.props.licenseChecker = true;
    }
  },

  prompting: function() {
    var done = this.async();

    this.log(alflogo(
      'Welcome to the awesome\nAngular 2 app generator\nfor Alfresco!\n',
      {'left-pad': '     '}));

    var prompts = [{
      name: 'projectName',
      message: 'What\'s the name of your App?',
      validate: function(str) {
        return str.length > 0;
      }
    }];

    this.prompt(prompts, function(props) {
      this.props = _.extend(this.props, props);
      done();
    }.bind(this));
  },

  default: function() {
    if (path.basename(this.destinationPath()) !== this.props.projectName) {
      this.log(
        'Your generator must be inside a folder named ' + this.props.projectName + '\n' +
        'I\'ll automatically create this folder.'
      );
      mkdirp(this.props.projectName);
      this.destinationRoot(this.destinationPath(this.props.projectName));
    }
  },

  askFor: function() {
    var done = this.async();

    var prompts = [{
      name: 'description',
      message: 'How would you describe the app?',
      default: 'Alfresco Angular 2 Application Example'
    }, {
      name: 'authorName',
      message: 'Author\'s Name',
      default: this.user.git.name(),
      store: true
    }, {
      name: 'authorEmail',
      message: 'Author\'s Email',
      default: this.user.git.email(),
      store: true
    }, {
      name: 'authorUrl',
      message: 'Author\'s Homepage',
      store: true
    }, {
      name: 'keywords',
      message: 'Package keywords (comma to split)',
      filter: function(words) {
        return words.split(/\s*,\s*/g);
      }
    }, {
      name: 'alfrescoServerHost',
      message: 'What is your Alfresco platform server URL?',
      default: 'http://127.0.0.1:8080',
      store: true
    }, {
      name: 'activitiServerHost',
      message: 'What is your Activiti platform server URL?',
      default: 'http://127.0.0.1:9999',
      store: true
    }];

    this.prompt(prompts, function(props) {
      this.props = _.extend(this.props, props);

      var projectAuthor = this.props.authorName;
      if (this.props.authorEmail) {
        projectAuthor += ' <' + this.props.authorEmail + '>';
      }
      this.props.projectAuthor = projectAuthor;

      done();
    }.bind(this));
  },

  askForGithubAccount: function() {
    var done = this.async();

    if (validateEmail(this.props.authorEmail)) {
      githubUsername(this.props.authorEmail, function(err, username) {
        if (err) {
          username = username || '';
        }

        var prompts = [{
          name: 'githubAccount',
          message: 'GitHub username or organization',
          default: username
        }];

        this.prompt(prompts, function(props) {
          this.props = _.extend(this.props, props);
          done();
        }.bind(this));
      }.bind(this));
    } else {
      done();
    }
  },

  askForAlfrescoComponent: function() {
    var done = this.async();

    var prompts = [{
      name: 'navigationBar',
      message: 'Do you want include a navigation bar?',
      type: 'confirm',
      default: true
    }, {
      name: 'drawerBar',
      message: 'Do you want include a drawer bar?',
      type: 'confirm',
      default: true
    }, {
      name: 'searchBar',
      message: 'Do you want include a search bar?',
      type: 'confirm',
      default: true
    }, {
      name: 'contentPage',
      message: 'Do you want include a Document List?',
      type: 'confirm',
      default: true
    }, {
      name: 'bpmTaskPage',
      message: 'Do you want include a Tasks List?',
      type: 'confirm',
      default: true
    }];

    this.prompt(prompts, function(props) {
      this.props = _.extend(this.props, props);
      done();
    }.bind(this));
  },

  writing: function() {
    this.props.projectNameCamelCase = _.chain(this.props.projectName).camelCase().upperFirst();

    this.fs.copy(
      this.templatePath('_typings.json'),
      this.destinationPath('typings.json')
    );

    this.fs.copy(
      this.templatePath('_tslint.json'),
      this.destinationPath('tslint.json')
    );

    this.fs.copy(
      this.templatePath('_tsconfig.json'),
      this.destinationPath('tsconfig.json')
    );

    this.fs.copy(
      this.templatePath('_systemjs.config.js'),
      this.destinationPath('systemjs.config.js')
    );

    this.fs.copyTpl(
      this.templatePath('_angular-cli.json'),
      this.destinationPath('angular-cli.json'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('_README.md'),
      this.destinationPath('README.md'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('_index.html'),
      this.destinationPath('index.html'),
      this.props
    );

    this.fs.copy(
      this.templatePath('_.gitignore'),
      this.destinationPath('.gitignore')
    );

    this.fs.copy(
      this.templatePath('_.editorconfig'),
      this.destinationPath('.editorconfig')
    );

    this.fs.copyTpl(
      this.templatePath('_package.json'),
      this.destinationPath('package.json'),
      this.props
    );

    var currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    this.props.keywords.push('alfresco-component');

    var pkg = _.merge(
      currentPkg,
      { keywords: this.props.keywords }
    );

    if (this.props.licenseChecker) {
      pkg = _.merge(
          currentPkg,
          this.fs.readJSON(path.join(__dirname, './alfresco-license-check.json'), {})
      );
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    this.composeWith('license', {
      options: {
        name: this.props.authorName,
        email: this.props.authorEmail,
        website: this.props.authorUrl
      }
    }, {
      local: require.resolve('generator-license/app')
    });

  },

  writeApp: function() {
    this.fs.copyTpl(
      this.templatePath('app/_main.ts'),
      this.destinationPath('app/main.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/components/_index.ts'),
      this.destinationPath('app/components/index.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/_app.routes.ts'),
      this.destinationPath('app/app.routes.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/_app.module.ts'),
      this.destinationPath('app/app.module.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/_app.component.ts'),
      this.destinationPath('app/app.component.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/_app.component.html'),
      this.destinationPath('app/app.component.html'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/_app.component.css'),
      this.destinationPath('app/app.component.css'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/components/login/_login-demo.component.ts'),
      this.destinationPath('app/components/login/login-demo.component.ts'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/components/login/_login-demo.component.html'),
      this.destinationPath('app/components/login/login-demo.component.html'),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath('app/components/login/_login-demo.component.css'),
      this.destinationPath('app/components/login/login-demo.component.css'),
      this.props
    );

    this.fs.copy(
      this.templatePath('assets/_material.orange-blue.min.css'),
      this.destinationPath('assets/material.orange-blue.min.css')
    );

    if (this.props.licenseChecker) {
      this.fs.copy(
        this.templatePath('assets/_license_header.txt'),
        this.destinationPath('assets/license_header.txt')
      );
    }

    this.fs.copy(
      this.templatePath('app/css/_muli-font.css'),
      this.destinationPath('app/css/muli-font.css')
    );

    this.fs.copy(
      this.templatePath('app/css/_app.css'),
      this.destinationPath('app/css/app.css')
    );

    this.fs.copy(
      this.templatePath('app/fonts/_Muli-Regular.ttf'),
      this.destinationPath('app/fonts/Muli-Regular.ttf')
    );

    this.fs.copy(
      this.templatePath('i18n/_en.json'),
      this.destinationPath('i18n/en.json')
    );

    this.fs.copy(
      this.templatePath('i18n/_it.json'),
      this.destinationPath('i18n/it.json')
    );

    if (this.props.searchBar) {
      this.fs.copy(
        this.templatePath('app/components/search/_search.component.html'),
        this.destinationPath('app/components/search/search.component.html')
      );

      this.fs.copyTpl(
        this.templatePath('app/components/search/_search.component.ts'),
        this.destinationPath('app/components/search/search.component.ts'),
        this.props
      );

      this.fs.copyTpl(
        this.templatePath('app/components/search/_search-bar.component.ts'),
        this.destinationPath('app/components/search/search-bar.component.ts'),
        this.props
      );

      this.fs.copy(
        this.templatePath('app/components/search/_search-bar.component.html'),
        this.destinationPath('app/components/search/search-bar.component.html')
      );

    }

    if (this.props.contentPage) {
      this.fs.copy(
        this.templatePath('app/components/files/_files.component.html'),
        this.destinationPath('app/components/files/files.component.html')
      );

      this.fs.copy(
        this.templatePath('app/components/files/_files.component.css'),
        this.destinationPath('app/components/files/files.component.css')
      );

      this.fs.copyTpl(
        this.templatePath('app/components/files/_files.component.ts'),
        this.destinationPath('app/components/files/files.component.ts'),
        this.props
      );
    }

    if (this.props.bpmTaskPage) {
      this.fs.copyTpl(
        this.templatePath('app/components/tasks/_activiti-demo.component.ts'),
        this.destinationPath('app/components/tasks/activiti-demo.component.ts'),
        this.props
      );

      this.fs.copy(
        this.templatePath('app/components/tasks/_activiti-demo.component.css'),
        this.destinationPath('app/components/tasks/activiti-demo.component.css')
      );

      this.fs.copy(
        this.templatePath('app/components/tasks/_activiti-demo.component.html'),
        this.destinationPath('app/components/tasks/activiti-demo.component.html')
      );

      this.fs.copy(
        this.templatePath('app/js/Polyline.js'),
        this.destinationPath('app/js/Polyline.js')
      );

    }
  },

  install: function() {
    if (this.options.install) {
      this.npmInstall();
    }
  }
});
