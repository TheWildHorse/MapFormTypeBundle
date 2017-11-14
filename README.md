# MapFormTypeBundle
Generic Map FormType for Symfony 3 and Sonata Project.

Set latitude, longitude and any other value from Nominatim on a form using Leaflet.
Supports the configuration of a fallback layer, base layers and overlay layers. When a pin is dragged or an address is 
filled in, the fields are updated.

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
curious_inc_map_form_type: ~
```

#### 5) Configure the MapType template
Add the MapType template to `app/config/config.yml` under twig, like so:
```yaml
# Twig Configuration
twig:
    form_themes:
        - CuriousIncMapFormTypeBundle:Form:fields.html.twig
```
