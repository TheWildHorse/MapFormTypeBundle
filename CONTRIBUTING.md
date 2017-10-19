## Contributing

#### Standards
* Spacing and line-endings: Common standards (use EditorConfig plugin)
* PHP: [PSR](http://www.php-fig.org/) (Use PHP Coding Standards Fixer)
* Javascript: [AirBnB](https://github.com/airbnb/javascript) (use ESLint)

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

#### Setup
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`  
    * Load it in any symfony project using composer, [pointing](https://getcomposer.org/doc/05-repositories.md#loading-a-package-from-a-vcs-repository) it to that branch
3. Install requirements
```bash
 $ yarn
```
Happy Coding!

#### Updating Javascript Libraries
```bash
 $ bower update [package-name]
```

#### Pull Request
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D



