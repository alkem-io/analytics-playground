export class NodeChallenge {
  label: string;
  id: string;
  title: string;
  group: string;
  leadOrgsCount: number;

  constructor(id: string, label: string, title: string, group: string, leadOrgsCount: number) {
    this.id = id;
    this.label = label;
    this.title = title;
    this.group = group;
    this.leadOrgsCount = leadOrgsCount;
  }
}
