import path from 'path';
import yaml from 'js-yaml';
import { Project } from 'fixturify-project';
import type { IMigrationSpec } from '../../src/util/migration-spec';
import { BinTesterProject } from '@scalvert/bin-tester';

export function createMigration(
  name = 'shepherd-project',
  version = '0.0.1',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cb: (project: Project) => void = () => {}
) {
  return new ShepherdProject(name, version, cb);
}

export type MigrationProject = InstanceType<typeof ShepherdProject>;

class ShepherdProject extends BinTesterProject {
  private _shepherdDir = '';

  get shepherdDir() {
    return this._shepherdDir ?? (this._shepherdDir = path.join(this.baseDir, '.shepherd'));
  }

  async addShepherdSpec(spec: IMigrationSpec) {
    await this.write({
      'shepherd.yml': yaml.dump(spec),
    });
  }
}
