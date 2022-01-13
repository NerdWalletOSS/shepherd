import * as fixturify from 'fixturify';
import { Project } from 'fixturify-project';

export default class ShepherdProject extends Project {
  write(dirJSON: fixturify.DirJSON) {
    Object.assign(this.files, dirJSON);
    this.writeSync();
  }
}
