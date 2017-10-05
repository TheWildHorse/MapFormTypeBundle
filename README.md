# MapFormTypeBundle
Generic Map FormType for Symfony 3

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  

Branch | Travis | 
------ | ------ |
master | [![Build Status](https://travis-ci.org/CuriousInc/MapFormTypeBundle.svg?branch=master)](https://travis-ci.org/CuriousInc/MapFormTypeBundle) | 

## Installation

#### 1) Install the Bundle
Install the bundle using composer:
```bash
composer require curious-inc/map-form-type-bundle
```

#### 2) Enable the Bundle
Register the bundle in `app/AppKernal.php` to enable it:
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

#### 3) Configure the Bundle
Add the following configuration to `app/config/config.yml` and change it to needs or wishes accordingly:
```yaml
curious_inc_map_form_type:
    example:              ~
```

#### 4) Configure the MapType template
Add the MapType template to `app/config/config.yml` under twig, like so:
```yaml
# Twig Configuration
twig:
    form_themes:
        - CuriousIncMapFormTypeBundle:Form:fields.html.twig
```
