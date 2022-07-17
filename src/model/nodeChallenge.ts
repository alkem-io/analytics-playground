export class NodeChallenge {
  label: string;
  id: string;
  title: string;
  group: string;

  constructor(id: string, label: string, title: string, group: string) {
    this.id = id;
    this.label = label;
    this.title = title;
    this.group = group;
  }
}
