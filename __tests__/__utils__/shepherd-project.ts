import yaml from 'js-yaml';
import * as fixturify from 'fixturify';
import { Project } from 'fixturify-project';

import type { IMigrationSpec } from '../../src/util/migration-spec';

export default class ShepherdProject extends Project {
  addShepherdSpec(spec: IMigrationSpec) {
    this.files['shepherd.yml'] = yaml.dump(spec);
    this.writeSync();
  }

  write(dirJSON: fixturify.DirJSON) {
    Object.assign(this.files, dirJSON);
    this.writeSync();
  }
}
