# MapFormTypeBundle
Generic Map FormType for Symfony 3

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  

Branch | Travis | 
------ | ------ |
master | [![Build Status](https://travis-ci.org/CuriousInc/MapFormTypeBundle.svg?branch=master)](https://travis-ci.org/CuriousInc/MapFormTypeBundle) |
develop | [![Build Status](https://travis-ci.org/CuriousInc/MapFormTypeBundle.svg?branch=develop)](https://travis-ci.org/CuriousInc/MapFormTypeBundle) |

## Installation

#### 1) Install Prerequisites
Make sure bootstrap styles and scripts are included.

__Note:__ when using bootstrap _v4_, make sure glyphicons are included too. 

#### 2) Install the Bundle
Install the bundle using composer:
```bash
composer require curious-inc/map-form-type-bundle
```

#### 3) Enable the Bundle
Register the bundle in `app/AppKernel.php` to enable it:
```php
// app/AppKernel.php
 
// ...
class AppKernel extends Kernel
{
    // ...
 
    public function registerBundles()
    {
        $bundles = [
            // ...
            new CuriousInc\MapFormTypeBundle\CuriousIncMapFormTypeBundle(),
        ];
 
        // ...
    }
}
```

#### 4) Configure the Bundle
Add the following configuration to `app/config/config.yml` and change it to needs or wishes accordingly:
```yaml
curious_inc_map_form_type:
    example:              ~
```

#### 5) Configure the MapType template
Add the MapType template to `app/config/config.yml` under twig, like so:
```yaml
# Twig Configuration
twig:
    form_themes:
        - CuriousIncMapFormTypeBundle:Form:fields.html.twig
```

## Developers

#### Prerequisites
1. Install Yarn
    * Using Node.js
```bash
 $ npm i -g yarn
```
  * Using Yum
```bash
 $ yum install yarn 
```
  * Using Apt
```bash
 $ apt install yarn
```

#### Updating Javascript Libraries
```bash
bower update [package-name]
```

#### Standards
* Spacing and line-endings: Common standards (use EditorConfig plugin)
* PHP: [PSR](http://www.php-fig.org/) (Use PHP Coding Standards Fixer)
* Javascript: [AirBnB](https://github.com/airbnb/javascript) (use ESLint)

#### Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`  
    * (Optional) Load it in any symfony project using composer, [pointing](https://getcomposer.org/doc/05-repositories.md#loading-a-package-from-a-vcs-repository) it to that branch
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
