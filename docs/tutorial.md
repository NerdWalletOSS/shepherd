# Tutorial

In this tutorial, we're going to build a simple Shepherd migration spec and apply it to a demo repo.

> Note: this tutorial is designed for people who like to learn by doing. If that's not how you prefer to learn, you can check out the complete docs.

## Setting the scene

ESLint has deprecated extensionless `.eslintrc` files - they're now expected to have an extension indicating the format of the contents, like `.eslintrc.yml`. Your organization has 100s of JavaScript repositories that were created from the same repository template, and they all use YAML in extensionless `.eslintrc` files. You want to get ahead of the game and rename them in preparation for the inevitable breaking change that removes support for the old filename. You could try to convince your coworkers to do this, but they're far too busy disrupting the "Tinder for Uber for cats" industry. You could also make these changes yourself, but that would take forever and you also have better things to do with your time.

Thankfully, you just heard about this tool called Shepherd that can help you automate code changes across infinitely many repositories at once. Let's build a Shepherd migration to do all the hard work for you.

## Setting up a test repository

Of course, for this tutorial, you don't have access to hundreds of repositories to try Shepherd out on. So, we'll be running on this migration on only one repository. While it may seem silly to do all this work just to rename a single file in a single repository, keep in mind that once you have a migration working for one repository, it will scale efforlessly to as many repositories as your organization has.

We've set up a simple repository that you can fork for the purpose of this demo.

[forking instructions here]

There's no actual project in the repository, as that's not relevant to this tutorial.

## Outlining our migration spec

Create a directory to hold files for this migration somewhere on your machine. We'll be using the directory `~/shepherd-demo`.

```sh
mkdir ~/shepherd-demo
cd ~/shepherd-demo
```

Shepherd migrations are declaratively specified in a file named `shepherd.yml`. We call this file a spec.

Create that file and open it in your favorite editor.

```sh
touch shepherd.yml
```

Let's bootstrap the file with some contents. More on what this all means in a bit!

```yml
# shepherd.yml
id: 2018.08.15-eslintrc-yml
title: Rename all .eslintrc files to .eslintrc.yml
```

The `id` value will be used to as a unique identifier for this migration, as well as the name of the branch that Shepherd creates. The `title` will be used to build a commit message and a title for the pull request that we'll open.