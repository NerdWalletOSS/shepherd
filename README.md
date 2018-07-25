# Shepherd2
A utility for applying code changes across many repositories

### Usage

Shepherd is run as follows:

```sh
shepherd <command> <migration> [options]
```

`<migration>` is the path to your migration directory containing a `shepherd.yml` file.

Currently, the only supported option is `--repos`, which allows you to specifiy a comma-separated list of repos that should be operated on. An example usage of this option:

```
shepherd checkout ~/path/to/migration --repos facebook/react,google/protobuf
```

Run `shepherd --help` to see available commands.

### Developing

Run `npm install` to install dependencies, and the `npm install -g` to make the `shepherd` executable available on your `PATH`.

Shepherd2 is written in TypeScript, which requires compilation to JavaScript. When developing Shepherd2, it's recommended to run `npm run build:watch` in a separate terminal. This will constantly recompile the source code as you edit it.
