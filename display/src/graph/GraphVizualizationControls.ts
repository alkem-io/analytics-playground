import { GraphDataProvider } from './GraphDataProvider';

export class GraphVizualizationControls {
  dataLoader: GraphDataProvider;

  constructor(dataLoader: GraphDataProvider) {
    this.dataLoader = dataLoader;
  }

  // Helper to build hierarchical space list with indentation
  buildHierarchicalSpaceList() {
    const l0 = this.dataLoader.getRawSpaceNodes();
    const l1 = this.dataLoader.data?.nodes.spacesL1 || [];
    const l2 = this.dataLoader.data?.nodes.spacesL2 || [];

    // Build a map for quick lookup
    const l1ByParent: Record<string, any[]> = {};
    l1.forEach((space: any) => {
      const parentId = space.parentId;
      if (!l1ByParent[parentId]) l1ByParent[parentId] = [];
      l1ByParent[parentId].push(space);
    });
    const l2ByParent: Record<string, any[]> = {};
    l2.forEach((space: any) => {
      const parentId = space.parentId;
      if (!l2ByParent[parentId]) l2ByParent[parentId] = [];
      l2ByParent[parentId].push(space);
    });

    // Recursively build the list
    const result: { node: any, level: number }[] = [];
    l0.forEach((space0: any) => {
      result.push({ node: space0, level: 0 });
      (l1ByParent[space0.id] || []).forEach((space1: any) => {
        result.push({ node: space1, level: 1 });
        (l2ByParent[space1.id] || []).forEach((space2: any) => {
          result.push({ node: space2, level: 2 });
        });
      });
    });
    return result;
  }

  addSpaceSelectorOptions(container: any) {
    // Use hierarchical list for dropdown
    const hierarchicalSpaces = this.buildHierarchicalSpaceList();
    container
      .selectAll('option.space-option')
      .data(hierarchicalSpaces, (d: any) => d.node.id)
      .join('option')
      .attr('id', (d: any) => d.node.id)
      .attr('class', 'space-option')
      .attr('value', (d: any) => d.node.id)
      .attr('data-level', (d: any) => d.level)
      .text((d: any) => `${'\u00A0\u00A0'.repeat(d.level)}${d.level > 0 ? '— ' : ''}${d.node.profile?.displayName || d.node.id}`);
  }
}
