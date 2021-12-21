import path from 'path';
import yaml from 'js-yaml';
import { Project } from 'fixturify-project';
import ShepherdProject from './shepherd-project';
import type { IMigrationSpec } from '../../src/util/migration-spec';

export function createMigration(
  name: string = 'shepherd-project',
  version: string = '0.0.1',
  cb: (project: Project) => void = () => {}
) {
  return new ShepherdMigrationProject(name, version, cb);
}

export type MigrationProject = InstanceType<typeof ShepherdMigrationProject>;

class ShepherdMigrationProject extends ShepherdProject {
  shepherdDir: string = '';

  constructor(name: string, version: string, cb: (project: Project) => void) {
    super(name, version, cb);

    // calling writeSync is required in order to generate a baseDir
    this.writeSync();

    this.shepherdDir = path.join(this.baseDir, '.shepherd');
  }

  addShepherdSpec(spec: IMigrationSpec) {
    this.files['shepherd.yml'] = yaml.dump(spec);
    this.writeSync();
  }
}
